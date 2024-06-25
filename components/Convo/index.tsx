import { Image, Text, TouchableOpacity, View, Linking } from 'react-native'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { chatType, convoType, userType } from '@/types'
import { AntDesign, Feather, FontAwesome6 } from '@expo/vector-icons'
import { getStyles } from './styles'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import ExternalInputBox from '../ExternalInputBox'
import { useRootNavigationState, useRouter } from 'expo-router'
import { getConvoForChat } from '@/state/features/chatSlice'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import moment from 'moment'
import { supabase } from '@/lib/supabase'
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler'
import { getUserData } from '@/state/features/userSlice'
import RemoteImage from '../RemoteImage'
import RemoteVideo from '../RemoteVideo'
import { AVPlaybackStatus, AVPlaybackStatusSuccess, ResizeMode, Video } from 'expo-av'
import { BlurView } from 'expo-blur'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import UrlPreview from '../UrlPreview'
import { Skeleton } from 'moti/skeleton'

type OnPlaybackStatusUpdate = (status: AVPlaybackStatus) => void;


const Convo = (convo: convoType) => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const [userData, setUserData] = useState<userType>()
    const [lastChat, setLastChat] = useState<chatType>()
    const [isKeepingUp, setIsKeepingUp] = useState(false)
    const [numberOfEngagedUsers, setNumberOfEngagedUsers] = useState<Array<String>>([])
    const router = useRouter()
    const dispatch = useDispatch()
    const [content, setContent] = useState('')
    const styles = getStyles(appearanceMode)
    const navigationState = useRootNavigationState() as any
    const widthValue = useSharedValue(0)
    const paddingValuePopup = useSharedValue(0)
    const opacityValue = useSharedValue(0)
    const [optionsVisible, setOptionsVisible] = useState(false)
    const currentRoute = navigationState.routes[navigationState.index].name ?? undefined;
    const videoRefs = useRef<Video[]>([])
    const [currentPlayingVideoIndex, setCurrentPlayingVideoIndex] = useState<number | null>(null)
    const [status, setStatus] = useState<AVPlaybackStatus | null>(null)
    const SkeletonCommonProps = {
        colorMode: appearanceMode.name === 'light' ? 'light' : 'dark',
        transition: { type: 'timing', duration: 2000 },
        // backgroundColor: appearanceMode.faint
    } as const;
    const chatData = useMemo(() => ({
        convo_id: convo.convo_id,
        user_id: convo?.user_id,
        content,
        files: null,
        audio: null,
        userData: authenticatedUserData
    }), [convo, content, authenticatedUserData])

    const convoKeepUpData = {
        user_id: authenticatedUserData?.user_id,
        convo_id: convo.convo_id,
        userData: authenticatedUserData,
        convoData: convo
    }

    const handleOpenLink = async () => {
        // return url.startsWith('https://') ? url : `https://${url}`;
        const url = convo.link?.startsWith('https://') ? convo.link : `https://${convo.link}`
        const supported = await Linking.canOpenURL(url as string)

        if(supported) {
            await Linking.openURL(url as string)
        } else {
            dispatch(setSystemNotificationState(true))
            dispatch(setSystemNotificationData({ type: 'error', message: "Couldn't open link" }))
        }
    }

    const fetchUserData = useCallback(async () => {
        try {
            const { data, error } = await supabase
            .from('Users')
            .select('*')
            .eq('user_id', convo?.user_id)
            .single()
            if(!error) {
                setUserData(data)
            }
        } catch (error) {
            console.log("error getting user")
        }
    }, [convo])


    const fetchChatToGetUsers = async () => {
        const { data, error } = await supabase
        .from('Chats')
        .select('*')
        .eq('convo_id', convo?.convo_id)
        
        if(!error) {
            const userIdSet = new Set<string>();
            data.forEach((chat: chatType) => {
                userIdSet.add(chat.user_id.toString())
            })
    
            const uniqueUserIds = Array.from(userIdSet).map(userId => userId.toString())
            setNumberOfEngagedUsers(uniqueUserIds)
        }
    }

    useEffect(() => {
        fetchChatToGetUsers()
    }, [])

    useEffect(() => {
        const convoChannel = supabase.channel(`convo-usersEngaged-channel-${convo.convo_id}`)
        convoChannel
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Chats', filter: `convo_id=eq.${convo.convo_id}` },
            (payload:any) => {
                const newUserId = payload.new?.user_id;
                if(newUserId && numberOfEngagedUsers.includes(newUserId)) {
                    return;
                } else {
                    setNumberOfEngagedUsers(prev => [...prev, newUserId])
                }
            }
        ).subscribe()
        return () => {
            convoChannel.unsubscribe()
        }
    }, [])

    useEffect(() => {
        fetchUserData()
    }, [fetchUserData])
    
    const notificationForKeepUp = {
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        receiver_id: userData?.user_id,
        convo,
        type: 'keepup',
    }
    const handleGuestProfile = useCallback(() => {
        if(currentRoute === '(profile)/[profileID]') {
            return;
        }
        if(userData) {
            dispatch(getUserData(userData))
            router.push({
                pathname: '/(profile)/[profileID]/',
                params: {
                    profileID: String(convo.user_id)
                }
            })
        } else return;
    }, [currentRoute, userData, router, convo.user_id, dispatch])

    const handleChatNavigation = useCallback(() => {
        dispatch(getConvoForChat(convo))
        router.push({
            pathname: '/(chat)/[convoID]',
            params: {
                convoID: String(convo.convo_id)
            }
        })
    }, [convo, router, dispatch])

    const animatedPopupStyles = useAnimatedStyle(() => {
        return {
            width: widthValue.value,
            padding: paddingValuePopup.value,
            opacity: opacityValue.value,
        }
    })

    const toggleOptionsVisibility = useCallback(() => {
        setOptionsVisible(!optionsVisible)
    }, [optionsVisible])


    const sendChat = async () => {
        if(!content) {
            handleChatNavigation()
        } else {
            const { data, error } = await supabase
            .from('Chats')
            .insert([chatData])
            .eq('convo_id', Number(convo.convo_id))
            .select()
            if(data) {
                setContent('')
                updateConvoLastChat()
                handleChatNavigation()
            } 
            if(error) {
                console.log(error.message)
            }
        } 
    }

    const updateConvoLastChat = useCallback(async () => {
        const { data, error } = await supabase
        .from('Convos')
        .update({lastChat: chatData})
        .eq('convo_id', String(convo.convo_id))
        .select()
    
        if(error) {
          console.log(error.message)
        }
      }, [chatData, convo.convo_id])

      
    const handleDelete = useCallback(async () => {
        const { error } = await supabase
        .from('Convos')
        .delete()
        .eq('convo_id', String(convo.convo_id))
        .eq('user_id', String(authenticatedUserData?.user_id))
        .single()

        if(error) {
            dispatch(setSystemNotificationState(true))
            dispatch(setSystemNotificationData({ type: 'error', message: "Couldn't Delete Convo"}))
            console.log(error.message)
        } else {
            dispatch(setSystemNotificationState(true))
            dispatch(setSystemNotificationData({ type: 'success', message: "Convo deleted successfully"}))
        }
    }, [convo.convo_id, authenticatedUserData?.user_id])


    const getLastChat = useCallback(async () => {
        const { data, error } = await supabase
        .from('Convos')
        .select('*')
        .eq('convo_id', String(convo.convo_id))
        .order('dateCreated', { ascending: false })
        .limit(1)
        .single()

        if(data) {
            setLastChat(data?.lastChat)
        }
    }, [convo.convo_id])

    useEffect(() => {
        getLastChat()
    }, [getLastChat])

    useEffect(() => {
        const channel = supabase
          .channel(`custom-update-channel-${convo.convo_id}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'Convos', filter: `id=eq.${convo.id}` },
            (payload) => {
                setLastChat(payload.new.lastChat)
            }
          )
          .subscribe();
    
        return () => {
          channel.unsubscribe();
        };
      }, [convo.convo_id, convo.id]);

      useEffect(() => {
        if(optionsVisible) {
            widthValue.value = withTiming(120)
            paddingValuePopup.value = withTiming(10)
            opacityValue.value = withTiming(1)
        } else {
            widthValue.value = withTiming(0)
            paddingValuePopup.value = withTiming(0)
            opacityValue.value = withTiming(0)
        }
      }, [optionsVisible, widthValue, paddingValuePopup, opacityValue])


    const renderLastChat = () => {
        return lastChat?.content
    }

    const renderLastChatUsername = useCallback(() => {
        return lastChat?.userData?.username
    }, [lastChat])
    
    const rightSwipe = useCallback(() => {
        return (
            <>
                { authenticatedUserData?.user_id === convo.userData?.user_id && <TouchableOpacity onPress={handleDelete} style={{ backgroundColor: '#E33629', paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 15, borderBottomLeftRadius: 15 }}>
                    <Image style={{ width: 30, height: 30 }} source={require('@/assets/images/bin.png')} />
                </TouchableOpacity>}
            </>
        )
    }, [handleDelete, authenticatedUserData?.user_id, convo.user_id])

    const handleKeepUp = useCallback(async () => {
        const { error } = await supabase
        .from('convoKeepUps')
        .insert([convoKeepUpData])
        .select()
        if(error) {
            console.log('Keep up not added', error.message)
        } else {
            sendNotificationForKeepUp()
            setOptionsVisible(false)
            setIsKeepingUp(true)
        }
    }, [convoKeepUpData])

    const handleDrop = useCallback(async () => {
        const { error } = await supabase
        .from('convoKeepUps')
        .delete()
        .eq('convo_id', convo.convo_id)
        .eq('user_id', String(authenticatedUserData?.user_id))

        if(error) {
            console.log("Couldn't drop convo")
            setIsKeepingUp(true)
        } else {
            setIsKeepingUp(false)
            setOptionsVisible(false)
        }
    }, [convo.convo_id, authenticatedUserData?.user_id])

    const checkIsKeepingUp = useCallback(async () => {
        const { data, error } = await supabase
        .from('convoKeepUps')
        .select('*')
        .eq('convo_id', convo.convo_id)
        .eq('user_id', String(authenticatedUserData?.user_id))
        .single()
        if(error) {
            setIsKeepingUp(false)
        } else {
            setIsKeepingUp(true)
        }
    }, [convo.convo_id, authenticatedUserData?.user_id])


    useEffect(() => {
        checkIsKeepingUp()
    }, [checkIsKeepingUp])

    const sendNotificationForKeepUp = useCallback(async () => {
        if(notificationForKeepUp.receiver_id === notificationForKeepUp.sender_id){
            return;
        }
        const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(convo.user_id))
        .eq('convo->>convo_id', String(convo.convo_id))
        .eq('type', 'keepup')
        .single()

        if(data) {
            console.log("Notification exists")
            return;
        } else {
            const { data: blockedUserData, error: blockedUserError } = await supabase
            .from('blockedUsers')
            .select('*')
            .eq('user_id', String(convo.userData?.user_id))
            .eq('blockedUserID', String(authenticatedUserData?.user_id))
            .single()
            if(blockedUserData){
                console.log("User is blocked so convo keep up notification will not be sent")
                return;
            } else {
                const { error: insertError } = await supabase
                .from('notifications')
                .insert([notificationForKeepUp])
                .single()
                if(!insertError) {
                    console.log("Notification sent successfully")
                }
            }

            if(blockedUserError) {
                console.log("Error checking for blocked user")
            }
        }

        if(error) {
            console.log("Couldn't fetch notification")
        }
        
    }, [notificationForKeepUp, convo.user_id, authenticatedUserData?.user_id])

    const isPlaybackStatusSuccess = (status: AVPlaybackStatus): status is AVPlaybackStatusSuccess => {
        return (status as AVPlaybackStatusSuccess).isLoaded !== undefined;
    }

    const handlePlaybackStatusUpdate:OnPlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
        setStatus(playbackStatus)
    }


    const playVideo = async (index: number) => {
        try {
            if (currentPlayingVideoIndex !== null && currentPlayingVideoIndex !== index) {
                await pauseVideo(currentPlayingVideoIndex);
            }
    
            if (videoRefs.current[index]) {
                await videoRefs.current[index].playAsync();
                setCurrentPlayingVideoIndex(index);
            }
        } catch (error) {
            console.log("Error playing video", error);
        }
    }

    const pauseVideo = async (index: number) => {
        try {
            // Pause the selected video
            if (videoRefs.current[index] && status && isPlaybackStatusSuccess(status) && status.isPlaying) {
                await videoRefs.current[index].pauseAsync();
                setCurrentPlayingVideoIndex(null); // Reset currentPlayingVideoIndex
            }
        } catch (error) {
            console.error('Error pausing video:', error);
        }
    }

    return (
        <GestureHandlerRootView>
            <Skeleton.Group show={userData === undefined}>
            <Swipeable renderRightActions={rightSwipe}>
                <View key={Number(convo.id)} style={styles.container}>
                    <Animated.View style={[styles.popUpContainer, animatedPopupStyles]}>
                        <View>
                            <TouchableOpacity onPress={toggleOptionsVisibility} style={{ alignItems: 'flex-end' }}>
                                <AntDesign size={24} color={appearanceMode.textColor} name='close'/>
                            </TouchableOpacity>
                        </View>

                        { !isKeepingUp && <TouchableOpacity onPress={handleKeepUp} style={[styles.popUpOptionButton]}>
                            <Text style={styles.popUpOptionText}>Keep Up</Text>
                        </TouchableOpacity>}

                        { isKeepingUp && <TouchableOpacity onPress={handleDrop} style={[styles.popUpOptionButton]}>
                            <Text style={styles.popUpOptionText}>Drop</Text>
                        </TouchableOpacity>}
                    </Animated.View>

                    <View style={styles.header}>
                        <Skeleton height={40} width={150} {...SkeletonCommonProps}>
                            <TouchableOpacity onPress={handleGuestProfile} style={styles.headerLeft}>
                                {/* { convo.userData && <RemoteImage style={styles.userImage} path={userData?.profileImage}/>} */}
                                { convo.userData && <Image style={styles.userImage} source={require('@/assets/images/blankprofile.png')}/>}
                                { convo.userData && <Text style={styles.username}>{ userData?.username }</Text>}
                            </TouchableOpacity>
                        </Skeleton>
                        <View style={styles.headerRight}>
                            <TouchableOpacity onPress={toggleOptionsVisibility}>
                                <Feather size={24} color={appearanceMode.textColor} name='more-vertical'/>
                            </TouchableOpacity>
                        </View>
                    </View>

                        <View style={styles.contentContainer}>

                            <TouchableOpacity onPress={handleChatNavigation}>
                                <Text style={styles.convoStarter}>{convo.convoStarter}</Text>
                            </TouchableOpacity>

                            {/* {convo.files && convo.files.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
                                {convo.files.map((file, index) => {
                                    if(String(file).endsWith('.mp4')) {
                                        return (
                                            <View key={index} style={styles.contentContainer}>
                                                <View style={styles.mediaControlContainer}>
                                                    { currentPlayingVideoIndex !== index ? 
                                                    <TouchableOpacity onPress={() => playVideo(index)}>
                                                        <BlurView style={styles.mediaButtonBackdrop}>
                                                            <Image source={require('../../assets/images/play.png')} style={styles.playImage}/>
                                                        </BlurView>
                                                    </TouchableOpacity> : 
                                                    <TouchableOpacity onPress={() => pauseVideo(index)}>
                                                        <BlurView style={styles.mediaButtonBackdrop}>
                                                            <Image source={require('../../assets/images/pause.png')} style={styles.playImage}/>
                                                        </BlurView>
                                                    </TouchableOpacity>
                                                    }
                                                </View>
                                                <RemoteVideo 
                                                ref={(ref: Video) => videoRefs.current[index] = ref} 
                                                isLooping 
                                                onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status)} 
                                                path={String(file)}
                                                resizeMode={ResizeMode.COVER} style={styles.image}/>
                                            </View>
                                        )
                                    } else return (
                                        <View key={index} style={styles.contentContainer}>
                                            <RemoteImage path={String(file)} style={styles.image}/>
                                        </View>
                                    )
                                })}
                            </ScrollView>} */}
                            {/* {convo.files && convo.files.length === 1 && 
                            <View style={styles.contentContainer}>
                                {String(convo.files[0]).endsWith('.mp4') ?
                                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={styles.mediaControlContainer}>
                                        <TouchableOpacity>
                                            <BlurView style={styles.mediaButtonBackdrop}>
                                                <Image source={require('../../assets/images/play.png')} style={styles.playImage}/>
                                            </BlurView>
                                        </TouchableOpacity>
                                    </View>
                                    <RemoteVideo isLooping onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status)} resizeMode={ResizeMode.COVER} path={String(convo.files[0])} style={[styles.image, { width: Dimensions.get('window').width - 20 }]}/>
                                </View> 
                                : 
                                <RemoteImage path={String(convo.files[0])} style={[styles.image, { width: Dimensions.get('window').width - 20 }]}/>}
                                </View>} */}
                            { convo.link && 
                            <TouchableOpacity onPress={handleOpenLink} style={styles.linkContainer}>
                                <UrlPreview url={convo.link}/> 
                            </TouchableOpacity>
                            }
                            { lastChat &&
                                <TouchableOpacity onPress={handleChatNavigation}>
                                    <Text style={styles.lastMessage}><Text style={styles.lastMessageUsername}>{renderLastChatUsername()}:</Text> { renderLastChat() } </Text>
                                </TouchableOpacity>
                            }
                            { !lastChat && <Text style={[styles.lastMessage, { color: appearanceMode.secondary, fontFamily: 'extrabold' }]}>No Chats In This Room</Text> }
                            <ExternalInputBox placeholder={'Send a chat...'} icon={<FontAwesome6 name={"arrow-right-long"} color={'white'} size={15}/>} inputValue={content} onChangeValue={(value) => setContent(value)} action={sendChat}/>
                        </View>

                    <View style={styles.footer}>
                        <Text style={styles.time}>{moment(convo.dateCreated).fromNow()}</Text>
                        <Text style={styles.active}>{Number(numberOfEngagedUsers.length)} { numberOfEngagedUsers.length === 1 ? 'person' : 'people'} in this conversation</Text>
                    </View>
                </View>
            </Swipeable>
            </Skeleton.Group>
        </GestureHandlerRootView>
  )
}
export default memo(Convo)