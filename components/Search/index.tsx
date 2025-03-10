import { View, ScrollView, FlatList, TouchableOpacity, Text, Image, TextInput, Linking, Dimensions, Platform, RefreshControl } from 'react-native'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import SearchHeader from './SearchHeader'
import ProfileCard from '../Profile/ProfileCard'
import { supabase } from '@/lib/supabase'
import { convoType, discoverType, userType } from '@/types'
import Convo from '../Convo'
import { BlurView } from 'expo-blur'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { setAuthenticatedUserID } from '@/state/features/userSlice'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import { useDebounce } from 'use-debounce'
import { router } from 'expo-router'
import RemoteImage from '../RemoteImage'
import { getConvoForChat, setConvoExists } from '@/state/features/chatSlice'
import { FontAwesome6 } from '@expo/vector-icons'
import ExternalInputBox from '../ExternalInputBox'
import RemoteVideo from '../RemoteVideo'
import { ResizeMode } from 'expo-av'
import { setFullScreenSource, setShowFullScreen, togglePlayPause } from '@/state/features/mediaSlice'
import { randomUUID } from 'expo-crypto'
import getStyles from './styles'


const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height
const Search = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)
    const [search, setSearch] = useState('')
    const [debouncedSearch] = useDebounce(search, 300)
    const [convoResults, setConvoResults] = useState<convoType[]>([])
    const [usersResults, setUsersResults] = useState<userType[]>([])
    const [discoverable, setDiscoverable] = useState<discoverType>()
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const [content, setContent] = useState<string>('')
    const [feedback, setFeedback] = useState('')
    const dispatch = useDispatch()
    const activeTab = useSelector((state: RootState) => state.navigation.activeTab)
    const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
    const isPlaying = useSelector((state:RootState) => state.media.playState)

    const chatData = useMemo(() => ({
        convo_id: discoverable?.Convos.convo_id,
        user_id: authenticatedUserData?.user_id,
        content,
        files: null,
        audio: null,
      }), [discoverable?.Convos.convo_id, discoverable?.Convos.user_id, content, authenticatedUserData]);

    const getSearch = async () => {
        const { data: convoData, error: convoSearchError } = await supabase
        .from('Convos')
        .select('*, Users(user_id, username, profileImage, audio, backgroundProfileImage)')
        .eq('private', false)
        .eq('isDiscoverable', false)
        .eq('isHighlight', false)
        .textSearch('convoStarter', `${debouncedSearch}`, {
            type: 'websearch',
            config: 'english'
        })
        if(convoData) {
            setConvoResults(convoData)
        }
        if(convoSearchError) {
            console.log(convoSearchError.message)
        }

        const { data: userData, error: userSearchError } = await supabase
        .from('Users')
        .select()
        .neq('username', 'Dialogue Robot')
        .textSearch('username', `${debouncedSearch}`, {
            type: 'websearch',
            config: 'english'
        })
        if(userData) {
            setUsersResults(userData)
        }
        if(userSearchError) {
            console.log(userSearchError.message)
        }
    }

    useEffect(() => {
        if (debouncedSearch) {
            getSearch()
        } else {
            setConvoResults([])
            setUsersResults([])
        }
    }, [debouncedSearch])

    const handleSendFeedback = async () => {
        const { error } = await supabase
        .from('userFeedbacks')
        .insert({ user_id: setAuthenticatedUserID, feedback })
        if(!error) {
            dispatch(setSystemNotificationState(true));
            dispatch(setSystemNotificationData({ type: 'success', message: 'Thank You For Your Feedback. We\'ll Continue To Improve The App' }));
            setFeedback('')
        }
    }

    const handleDiscoverPostScreenNavigation = async () => {
        if(authenticatedUserData?.username === 'callhimcollins') {
            await router.push({
                pathname: '/main/creatediscoverpostscreen'
            })
        } else {
            return;
        }
    }

    const getDiscoverable = async () => {
        const { data, error } = await supabase
        .from('discoverables')
        .select('*, Convos(*)')
        .order('dateCreated', { ascending: false })
        .limit(1)
        .single()
        if(data) {
            setDiscoverable(data)
        }
    }

    const handleChatNavigation = useCallback(() => {
        dispatch(setConvoExists (null))
        dispatch(getConvoForChat(discoverable?.Convos))
        router.push({
            pathname: '/(chat)/[convoID]',
            params: {
                convoID: String(discoverable?.Convos.convo_id)
            }
        })
    }, [discoverable, router, dispatch])

    useEffect(() => {
        getDiscoverable()
    }, [])

    useEffect(() => {
        const channel = supabase.channel(`discoverables-channel-${authenticatedUserData?.user_id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'discoverables' }, () => {
            getDiscoverable()
        }).subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [])


    const sendChat = async () => {
        if(!content) {
            handleChatNavigation()
        } else {
            const { data, error } = await supabase
            .from('Chats')
            .insert([chatData])
            .eq('convo_id', Number(discoverable?.Convos.convo_id))
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

    const onRefreshDiscover = () => {
        getDiscoverable()
    }

    const updateConvoLastChat = useCallback(async () => {
        const { error } = await supabase
        .from('Convos')
        .update({lastChat: chatData})
        .eq('convo_id', String(discoverable?.Convos.convo_id))
        .select()
    
        if(error) {
          console.log(error.message)
        }
    }, [chatData, discoverable?.Convos.convo_id])

    const handlePlayPause = useCallback(async (file: string) => {
        const videoId = `${file}`;
        await dispatch(togglePlayPause({ index: videoId }));
    }, [dispatch])

    const handleOpenLink = async () => {
        if (!discoverable?.Convos.link) return;
        
        const supported = await Linking.canOpenURL(discoverable?.Convos.link);
        if (supported) {
          await Linking.openURL(discoverable?.Convos.link);
        } else {
          dispatch(setSystemNotificationState(true));
          dispatch(setSystemNotificationData({ type: 'error', message: "Couldn't open link" }));
        }
      };

    const handleShowFullScreen = (file:string) => {
        dispatch(setShowFullScreen(true))
        dispatch(setFullScreenSource({file, convoStarter: String(discoverable?.title)}))
        dispatch(togglePlayPause({ index: file + String(randomUUID()) }))
    }
    return (
        <View style={styles.container}>
                <SearchHeader performSearch={getSearch} searchValue={search} searchFuntion={(value) => setSearch(value)}/>
            { search && <FlatList
            data={convoResults}
            contentContainerStyle={{ paddingTop: usersResults.length !== 0 ? 0 : 120, paddingBottom: 100 }}
            ListHeaderComponent={() => {
                if(usersResults.length !== 0) {
                return <ScrollView horizontal contentContainerStyle={{ paddingTop: 120, height: 290 }}>
                <View style={{ flexDirection: 'row', padding: 10 }}>
                    {
                        usersResults.map((user, index) => (
                            <ProfileCard audio={user.audio} key={Number(user.id)} id={user.id} user_id={user.user_id} backgroundProfileImage={user.backgroundProfileImage} username={user.username} name={user.name} profileImage={user.profileImage}/>
                        ))
                    }
                </View>
            </ScrollView>
                }
            }}
            showsVerticalScrollIndicator={false}
            renderItem={({item, index}) => {
                return <Convo
                user_id={item.user_id}
                lastChat={item.lastChat}
                convo_id={item.convo_id} 
                dateCreated={item.dateCreated} 
                activeInRoom={item.activeInRoom} 
                Users={item.Users} 
                id={item.id} 
                files={item.files} 
                link={item.link}
                numberOfKeepUps={item.numberOfKeepUps} 
                convoStarter={item.convoStarter}
                dialogue={item.dialogue}
                audio={item.audio}
                mediaIndex={index + .3}
                />
            }}
            />}
            { !search && 
            <KeyboardAwareScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefreshDiscover}/>} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 150, paddingBottom: 120 }}>
                {/* <TouchableOpacity style={styles.inviteButton}>
                    <Text style={styles.inviteButtonText}>Invite 5 People And Get $20 Through CashApp</Text>
                    <Text style={styles.inviteButtonSubtext}>Tap To Read Conditions</Text>
                </TouchableOpacity> */}

                <View style={styles.discoverContainer}>
                    <Text style={styles.discoverHeaderText}>{discoverable?.title}</Text>

                    <View style={styles.mediaContainer}>
                        { discoverable?.Convos?.files && (String(discoverable?.Convos?.files[0]).endsWith('.mp4') || String(discoverable?.Convos?.files[0]).endsWith('.mov') || String(discoverable?.Convos?.files[0]).endsWith('.avi')) ? 
                        <TouchableOpacity onPress={() => {
                                if(discoverable.Convos.files) handleShowFullScreen(String(discoverable?.Convos?.files[0]))
                            }} 
                            style={styles.videoContainer}>
                            <View style={styles.videoButtonOverlayContainer}>
                                { isPlaying?.index === String(discoverable?.Convos?.files[0]) && !isPlaying?.playState && <TouchableOpacity onPress={() => {
                                    if(discoverable.Convos.files) handlePlayPause(String(discoverable?.Convos?.files[0]))
                                    }}>
                                    <BlurView key={activeTab.name} style={styles.mediaControlButton}>
                                        <Image style={styles.mediaControlButtonImage} source={require('../../assets/images/play.png')}/>
                                    </BlurView>
                                </TouchableOpacity>}
                                { isPlaying?.index === String(discoverable?.Convos?.files[0]) && isPlaying?.playState && <TouchableOpacity onPress={() => {
                                    if(discoverable.Convos.files) handlePlayPause(String(discoverable?.Convos?.files[0]))
                                }}>
                                    <BlurView key={activeTab.name} style={styles.mediaControlButton}>
                                        <Image style={styles.mediaControlButtonImage} source={require('../../assets/images/pause.png')}/>
                                    </BlurView>
                                </TouchableOpacity>}
                                { isPlaying?.index !== String(discoverable?.Convos?.files[0]) && <TouchableOpacity onPress={() => {
                                    if(discoverable.Convos.files) handlePlayPause(String(discoverable?.Convos?.files[0]))
                                }}>
                                    <BlurView key={activeTab.name} style={styles.mediaControlButton}>
                                        <Image style={styles.mediaControlButtonImage} source={require('../../assets/images/play.png')}/>
                                    </BlurView>
                                </TouchableOpacity>}
                            </View>
                                <RemoteVideo 
                                resizeMode={ResizeMode.COVER} 
                                shouldPlay={isPlaying?.index === String(discoverable?.Convos?.files[0]) && isPlaying.playState === true ? true : false} 
                                path={String(discoverable?.Convos?.files[0])} 
                                style={styles.discoverImage}
                                />
                        </TouchableOpacity>
                         :
                        <TouchableOpacity onPress={() => {
                            if(discoverable && discoverable.Convos.files) handleShowFullScreen(String(discoverable?.Convos?.files[0]))
                            }}>
                            { discoverable?.Convos.files && <RemoteImage path={String(discoverable?.Convos?.files[0])} style={styles.discoverImage}/>}
                        </TouchableOpacity>
                    }

                        {Platform.OS === 'ios' ? (
                        <TouchableOpacity onPress={handleOpenLink} style={styles.mediaTextContainer}>
                            <BlurView key={activeTab.name} intensity={80}>
                                <Text style={styles.mediaText}>{discoverable?.Convos.convoStarter}</Text>
                                <Text style={styles.viewSourceText}>Tap To View Source</Text>
                            </BlurView>
                        </TouchableOpacity>
                        ) : (
                        <TouchableOpacity onPress={handleOpenLink} style={styles.mediaTextContainer}>
                            <View key={activeTab.name} style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
                                <Text style={styles.mediaText}>{discoverable?.Convos.convoStarter}</Text>
                                <Text style={styles.viewSourceText}>Tap To View Source</Text>
                            </View>
                        </TouchableOpacity>
                        )}
                    </View>

                    <View style={{ marginHorizontal: 10 }}>
                        <ExternalInputBox placeholder={'Send a chat...'} icon={<FontAwesome6 name={"arrow-right-long"} color={'white'} size={15}/>} inputValue={content} onChangeValue={(value) => setContent(value)} action={sendChat}/>
                    </View>
                    { authenticatedUserData?.username === 'callhimcollins' && <View style={styles.createDiscoverPostContainer}>
                        <TouchableOpacity onPress={handleDiscoverPostScreenNavigation} style={styles.createDiscoverPostButton}>
                            <Text style={styles.createDiscoverPostButtonText}>Create A Discover Post</Text>
                        </TouchableOpacity>
                    </View>}
                </View>

                <View style={styles.experienceContainer}>
                    <View style={styles.experienceHeaderTextContainer}>
                        <Text style={styles.experienceHeaderText}>Experience Check-In</Text>
                        <Text style={styles.experienceHeaderSubtext}>Let's Make Convo A Success. Leave A Feedback</Text>
                    </View>

                    <View style={styles.experienceInputContainer}>
                        <TextInput value={feedback} onChangeText={(feedback) => setFeedback(feedback)} placeholderTextColor={appearanceMode.textColor} style={[styles.experienceInput, Platform.OS === 'android' && { paddingVertical: 5 }]} placeholder='How has your experience been?'/>
                        <TouchableOpacity onPress={handleSendFeedback} style={[styles.sendButton, Platform.OS === 'android' && { paddingVertical: 12 }]}>
                            <Text style={styles.sendButtonText}>Send</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAwareScrollView>
            }
        </View>
    )
}

export default memo(Search)

// ... (rest of the file, including getStyles function, remains unchanged)

