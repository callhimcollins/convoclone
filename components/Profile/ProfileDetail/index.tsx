import { Text, View, TouchableOpacity, Image, ScrollView, Linking, Dimensions, TextInput } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { Entypo } from '@expo/vector-icons'
import { setActiveProfileTab, setShowProfileModal } from '@/state/features/userSlice'
import { linkType, userType } from '@/types'
import { Link, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import RemoteImage from '@/components/RemoteImage'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const DEVICE_WIDTH = Dimensions.get('window').width
const ProfileDetail = ( user:userType) => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const [isKeepingUp, setIsKeepingUp] = useState(false)
    const [addLinkContainerDisplay, setAddLinkContainerDisplay] = useState(false)
    const [showLinkNameInput, setShowLinkNameInput] = useState(false)
    const [linkName, setLinkName] = useState('')
    const [linkUrl, setLinkUrl] = useState('')
    const [userLinks, setUserLinks] = useState<Array<linkType>>()
    const [validURL, setValidURL] = useState(true)
    const { profileID } = useLocalSearchParams()
    const styles = getStyles(appearanceMode)
    const userData = useSelector((state:RootState) => state.user.userData)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const tabs = useSelector((state:RootState) => state.user.tabs)
    const activeTab = useSelector((state:RootState) => state.user.activeTab)
    const dispatch = useDispatch()
    const usernameContainerWidth = useSharedValue(DEVICE_WIDTH * 0.65)
    const usernameContainerOpacity = useSharedValue(1)

    const handleActivetabButton = (index: Number) => {
        dispatch(setActiveProfileTab(index))
    }

    const openAddLinkContainer = () => {
        setAddLinkContainerDisplay(true)
        usernameContainerWidth.value = withTiming(0)
        usernameContainerOpacity.value = withTiming(0)
    }

    const closeAddLinkContainer = () => {
        setAddLinkContainerDisplay(false)
        usernameContainerWidth.value = withTiming(DEVICE_WIDTH * 0.65)
        usernameContainerOpacity.value = withTiming(1)
    }

    const onShowLinkNameInput = () => {
        setShowLinkNameInput(true)
    }

    const onHideLinkNameInput = () => {
        setShowLinkNameInput(false)
    }

    const onSaveLink = async () => {
        setShowLinkNameInput(false);
        setAddLinkContainerDisplay(false);
        usernameContainerOpacity.value = withTiming(1);
        usernameContainerWidth.value = withTiming(DEVICE_WIDTH * 0.65);
    
        try {
            const { data } = await supabase
                .from('Users')
                .select('*')
                .eq('user_id', String(profileID))
                .single();
        
            if (data) {
                // Update userLinks state
                const currentLinks = data.links || [];
                const newLink = { name: linkName, url: linkUrl };
                const updatedLinks = [...currentLinks, newLink];
                setUserLinks(updatedLinks);
                const { error: updateError } = await supabase
                .from('Users')
                .update({ links: updatedLinks })
                .eq('user_id', String(profileID));
        
                if(updateError) {
                    dispatch(setSystemNotificationState(true))
                    dispatch(setSystemNotificationData({message: "Link Not Added", type: "error"}))
                } else {
                    dispatch(setSystemNotificationState(true))
                    dispatch(setSystemNotificationData({message: "Link Added. Changes Will Not Reflect Instantly", type: "success"}))
                    setLinkName('')
                    setLinkUrl('')
                }
                
            } else {
                console.log("User data not found");
            }
        } catch (error) {
            console.log(error);
        }
    };


    const deleteLink = async (linkID:linkType) => {
        if(profileID !== authenticatedUserData?.user_id) {
            return;
        }
        try {
            const { data, error } = await supabase
            .from('Users')
            .select('*')
            .eq('user_id', String(authenticatedUserData?.user_id))
            .single();
            if(data) {
                const currentLinks = data.links || [];
                const updatedLinks = currentLinks.filter((link:linkType) => link.url !== linkID.url);
                setUserLinks(updatedLinks);
                const { error: updateError } = await supabase
                .from('Users')
                .update({ links: updatedLinks })
                .eq('user_id', String(authenticatedUserData?.user_id));
                if(updateError) {
                    dispatch(setSystemNotificationState(true))
                    dispatch(setSystemNotificationData({message: "Link Not Deleted", type: "error"}))
                } else {
                    dispatch(setSystemNotificationState(true))
                    dispatch(setSystemNotificationData({message: "Link Deleted. Changes Will Not Reflect Instantly", type: "success"}))
                }
            }
        } catch (error) {
            console.log("Error performing delete link operation", error)
        }
    }


    const animatedUsernameContainerStyles = useAnimatedStyle(() => {
        return {
            width: usernameContainerWidth.value,
            opacity: usernameContainerOpacity.value
        }
    })


    const validateURL = (url:string) => {
        const regex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/
        return regex.test(url)
    }

    const handleUrlChange = (text:string) => {
        setLinkUrl(text.toLowerCase())
        setValidURL(validateURL(text))
    }

    const handleOpenLink = async (url:string) => {
        try {
            if (!url.startsWith('https://') && !url.startsWith('http://')) {
                url = `https://${url}`;
            }
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                console.log(`Don't know how to open URL: ${url}`);
            }
        } catch (error) {
            console.error('Error opening link:', error);
        }
    };
    
    const handleShowProfileModal = () => {
        dispatch(setShowProfileModal(true))
    }

    const keepUpData = {
        user_id: authenticatedUserData?.user_id,
        keepup_user_id: profileID,
        keepUpUserData: userData
    }

    const notificationForKeepUp = {
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        data: userData,
        receiver_id: profileID,
        type: 'userkeepup',
    }

    const sendNotificationForKeepUp = async () => {
        const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('data->>user_id', String(profileID))
        .single()

        if(data) {
            console.log("Notification exists")
        } else {
            const { data, error } = await supabase
            .from('blockedUsers')
            .select('*')
            .eq('user_id', String(userData?.user_id))
            .eq('blockedUserID', String(authenticatedUserData?.user_id))
            .single()

            if(data) {
                console.log("User blocked so keep up notification will not be sent")
            } else {
                const { error } = await supabase
                .from('notifications')
                .insert([notificationForKeepUp])
                .single()
                if(!error) {
                    console.log("Notification sent successfully")
                } else {
                    console.log("Couldn't send notification", error.message)
                }
            }
        }

        if(error) {
            console.log("Couldn't fetch notification", error.message)
        }
    }

    const deleteNotificationForKeepUp = async () => {
        const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('data->>user_id', String(profileID))
        .single()

        if(!error) {
            console.log("Notification deleted")
        } else {
            console.log("Couldn't delete notification", error.message)
        }
    }

    const handleKeepUp = useCallback(async () => {
        const { data, error } = await supabase
        .from('userKeepUps')
        .select('*')
        .eq('keepup_user_id', String(profileID))
        .eq('user_id', String(authenticatedUserData?.user_id))
        .single()

        if(data) {
            console.log("Already keeping up")
        } else {
            const { error } = await supabase
            .from('userKeepUps')
            .insert([keepUpData])
            .single()
            if(!error) {
                console.log("Started keeping up")
                sendNotificationForKeepUp()
            } else {
                console.log("Couldn't keep up", error.message)
            }
        }
    }, [profileID, authenticatedUserData])

    const handleDrop = useCallback(async () => {
        const { error } = await supabase
        .from('userKeepUps')
        .delete()
        .eq('keepup_user_id', String(profileID))
        .eq('user_id', String(authenticatedUserData?.user_id))
        .single()

        if(!error) {
            console.log("Dropped")
            deleteNotificationForKeepUp()
        } else {
            console.log("Error dropping user", error.message)
        }
    }, [profileID, authenticatedUserData])

    const checkForKeepUp = useCallback(async () => {
        const { data, error } = await supabase
        .from('userKeepUps')
        .select('*')
        .eq('keepup_user_id', String(profileID))
        .eq('user_id', String(authenticatedUserData?.user_id))
        .single()

        if(data) {
            console.log("You are keeping up")
            setIsKeepingUp(true)
        }
        if(error) {
            console.log("Error checking for keep up", error.message)
        }
    }, [profileID, authenticatedUserData])

    useEffect(() => {
        checkForKeepUp()
    }, [checkForKeepUp, isKeepingUp])

    useEffect(() => {
        const channel = supabase.channel(`keep-up-channel-${profileID}-${authenticatedUserData?.user_id}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'userKeepUps' },
            (payload) => {
                if(payload.eventType === 'INSERT') {
                    setIsKeepingUp(true)
                } else if(payload.eventType === 'DELETE') {
                    setIsKeepingUp(false)
                }
            }
        ).subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [])


    return (
        <GestureHandlerRootView>
        <View style={styles.container}>
            <View style={styles.profileBackgroundImageContainer}>
                { !userData?.backgroundProfileImage && <Image
                source={{ uri: 'https://as1.ftcdn.net/v2/jpg/06/19/33/90/1000_F_619339097_kGKYaLzvVDstu1mFB733Y1unUlXBdpFO.jpg' }}
                style={styles.profileBackgroundImage}
                />}
                { userData?.backgroundProfileImage && <RemoteImage
                path={userData?.backgroundProfileImage}
                style={styles.profileBackgroundImage}
                />}
                <LinearGradient
                colors={appearanceMode.name === 'dark' ? [
                    'rgba(15, 14, 19, 0)',      // Fully transparent
                    'rgba(15, 14, 19, 0.02)',   // Very light opacity
                    'rgba(15, 14, 19, 0.04)',   // Very light opacity
                    'rgba(15, 14, 19, 0.06)',   // Very light opacity
                    'rgba(15, 14, 19, 0.08)',   // Very light opacity
                    'rgba(15, 14, 19, 0.1)',    // Light opacity
                    'rgba(15, 14, 19, 0.12)',   // Light opacity
                    'rgba(15, 14, 19, 0.14)',   // Light opacity
                    'rgba(15, 14, 19, 0.16)',   // Light opacity
                    'rgba(15, 14, 19, 0.18)',   // Light opacity
                    'rgba(15, 14, 19, 0.2)',    // Light opacity
                    'rgba(15, 14, 19, 0.22)',   // Light opacity
                    'rgba(15, 14, 19, 0.24)',   // Light opacity
                    'rgba(15, 14, 19, 0.26)',   // Light opacity
                    'rgba(15, 14, 19, 0.28)',   // Light opacity
                    'rgba(15, 14, 19, 0.3)',    // Light opacity
                    'rgba(15, 14, 19, 0.32)',   // Light opacity
                    'rgba(15, 14, 19, 0.34)',   // Light opacity
                    'rgba(15, 14, 19, 0.36)',   // Light opacity
                    'rgba(15, 14, 19, 0.38)',   // Light opacity
                    'rgba(15, 14, 19, 0.4)',    // Light opacity
                    'rgba(15, 14, 19, 0.42)',   // Light opacity
                    'rgba(15, 14, 19, 0.44)',   // Light opacity
                    'rgba(15, 14, 19, 0.46)',   // Light opacity
                    'rgba(15, 14, 19, 0.48)',   // Light opacity
                    'rgba(15, 14, 19, 0.5)',    // Light opacity
                    'rgba(15, 14, 19, 0.52)',   // Light opacity
                    'rgba(15, 14, 19, 0.54)',   // Light opacity
                    'rgba(15, 14, 19, 0.56)',   // Light opacity
                    'rgba(15, 14, 19, 0.58)',   // Light opacity
                    'rgba(15, 14, 19, 0.6)',    // Light opacity
                    'rgba(15, 14, 19, 0.62)',   // Light opacity
                    'rgba(15, 14, 19, 0.64)',   // Light opacity
                    'rgba(15, 14, 19, 0.66)',   // Light opacity
                    'rgba(15, 14, 19, 0.68)',   // Light opacity
                    'rgba(15, 14, 19, 0.7)',    // Light opacity
                    'rgba(15, 14, 19, 0.72)',   // Light opacity
                    'rgba(15, 14, 19, 0.74)',   // Light opacity
                    'rgba(15, 14, 19, 0.76)',   // Light opacity
                    'rgba(15, 14, 19, 0.78)',   // Light opacity
                    'rgba(15, 14, 19, 0.8)',    // Light opacity
                    'rgba(15, 14, 19, 0.82)',   // Light opacity
                    'rgba(15, 14, 19, 0.84)',   // Light opacity
                    'rgba(15, 14, 19, 0.86)',   // Light opacity
                    'rgba(15, 14, 19, 0.88)',   // Light opacity
                    'rgba(15, 14, 19, 0.9)',    // Light opacity
                    'rgba(15, 14, 19, 0.92)',   // Light opacity
                    'rgba(15, 14, 19, 0.94)',   // Light opacity
                    'rgba(15, 14, 19, 0.96)',   // Light opacity
                    'rgba(15, 14, 19, 0.98)',   // Light opacity
                    'rgba(15, 14, 19, 1)',  
                ] : [
                    'rgba(255, 255, 255, 0)',      // Fully transparent
                    'rgba(255, 255, 255, 0.1)',    // Very light opacity
                    'rgba(255, 255, 255, 0.2)',    // Very light opacity
                    'rgba(255, 255, 255, 0.3)',    // Very light opacity
                    'rgba(255, 255, 255, 0.4)',    // Semi-visible
                    'rgba(255, 255, 255, 0.5)',    // Semi-visible
                    'rgba(255, 255, 255, 0.6)',    // Semi-visible
                    'rgba(255, 255, 255, 0.7)',    // Visible
                    'rgba(255, 255, 255, 0.8)',    // Visible
                    'rgba(255, 255, 255, 0.9)',    // Visible
                    'rgba(255, 255, 255, 1)',  
                ]}
                start={{ x: 0, y:0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradient}
                />
            </View>
            <View style={styles.userDetailContainer}>
                {/* <RemoteImage style={styles.profileImage} path={authenticatedUserData?.profileImage}/> */}
                <Image source={require('@/assets/images/blankprofile.png')} style={styles.profileImage}/>
                <Animated.View style={[styles.usernameContainer, animatedUsernameContainerStyles]}>
                    <TouchableOpacity onPress={handleShowProfileModal}>
                      <Text style={styles.username}>{ user.username?.split('-')[0] }</Text>
                      <Text numberOfLines={3} style={styles.bio}>{user.bio}</Text>
                    </TouchableOpacity>
                    { user.links && user.links.length > 0 && <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, alignItems: 'center' }} horizontal>
                        {user.links.map((link) => {
                            return (
                                <TouchableOpacity key={link.url} onLongPress={() => deleteLink(link)} onPress={() => handleOpenLink(link.url)} style={styles.linkContainer}>
                                    <Text style={styles.linkText}>{link.name}</Text>
                                </TouchableOpacity>
                            )
                        })}
                        { profileID === authenticatedUserData?.user_id &&
                        <TouchableOpacity onPress={openAddLinkContainer} style={styles.linkContainer}>
                            <Entypo name='link' size={20} color={appearanceMode.secondary}/>
                            <Text style={styles.linkText}>Add A Link</Text>
                        </TouchableOpacity>
                        }
                        { profileID === authenticatedUserData?.user_id && <View>
                            <Text style={styles.linkText}>To Delete A Link, Long Press On The Link</Text>
                        </View>}
                    </ScrollView>}
                    { user.links === null && profileID === authenticatedUserData?.user_id &&
                        <TouchableOpacity onPress={openAddLinkContainer} style={styles.linkContainer}>
                            <Entypo name='link' size={20} color={appearanceMode.secondary}/>
                            <Text style={styles.linkText}>Add A Link</Text>
                        </TouchableOpacity>
                    }
                    { user.links && user.links.length === 0 && profileID === authenticatedUserData?.user_id &&
                        <TouchableOpacity onPress={openAddLinkContainer} style={styles.linkContainer}>
                            <Entypo name='link' size={20} color={appearanceMode.secondary}/>
                            <Text style={styles.linkText}>Add A Link</Text>
                        </TouchableOpacity>
                    }
                </Animated.View>

                <Animated.View>
                    { addLinkContainerDisplay && <View>
                        { !showLinkNameInput && <Animated.View>
                            <TextInput value={linkUrl} onChangeText={(text) => handleUrlChange(text)} style={{ backgroundColor: appearanceMode.faint, padding: 10, marginBottom: 10, borderRadius: 7, fontFamily: 'bold', color: appearanceMode.textColor }} placeholder='Link URL'/>
                        </Animated.View>}
                        { showLinkNameInput && <Animated.View>
                            <TextInput value={linkName} onChangeText={(text) => setLinkName(text)} style={{ backgroundColor: appearanceMode.faint, padding: 10, marginBottom: 10, borderRadius: 7, fontFamily: 'bold', color: appearanceMode.textColor }} placeholder='Link Name'/>
                        </Animated.View>}
                    </View>}
                    { addLinkContainerDisplay && <View style={{ flexDirection: 'row', width: DEVICE_WIDTH * 0.65, gap: 10, alignItems: 'center'}}>
                        { !showLinkNameInput && <TouchableOpacity onPress={closeAddLinkContainer} style={{ backgroundColor: 'rgba(227, 54, 41, 0.3)', paddingHorizontal: 20, paddingVertical: 7, borderRadius: 7 }}>
                            <Text style={{ fontFamily: 'extrabold', color: 'rgb(227, 54, 41)' }}>Cancel</Text>
                        </TouchableOpacity>}
                        { showLinkNameInput && <TouchableOpacity onPress={onHideLinkNameInput} style={{ backgroundColor: 'rgba(227, 54, 41, 0.3)', paddingHorizontal: 20, paddingVertical: 7, borderRadius: 7 }}>
                            <Text style={{ fontFamily: 'extrabold', color: 'rgb(227, 54, 41)' }}>Back</Text>
                        </TouchableOpacity>}
                        { !showLinkNameInput && validURL && <TouchableOpacity disabled={linkUrl === '' ? true : false } onPress={onShowLinkNameInput} style={{ backgroundColor: linkUrl === '' ? appearanceMode.faint : 'rgba(98, 95, 224, 0.3)', paddingHorizontal: 20, paddingVertical: 7, borderRadius: 7 }}>
                            <Text style={{ color: linkUrl === '' ? appearanceMode.textColor : 'rgb(98, 95, 224)', fontFamily: 'extrabold' }}>Next</Text>
                        </TouchableOpacity>}
                        { !validURL && <View><Text style={{ color: 'rgb(227, 54, 41)', fontFamily: 'extrabold' }}>URL not valid</Text></View>}
                        { showLinkNameInput && <TouchableOpacity onPress={onSaveLink} style={{ backgroundColor: 'rgba(98, 95, 224, 0.3)', paddingHorizontal: 20, paddingVertical: 7, borderRadius: 7 }}>
                            <Text style={{ color: 'rgb(98, 95, 224)', fontFamily: 'extrabold' }}>Save</Text>
                        </TouchableOpacity>}
                    </View>}
                </Animated.View>
            </View>

            <View style={[styles.actionContainer, { justifyContent: authenticatedUserData?.user_id === profileID ? 'center' : 'space-between',  }]}>
                <View style={styles.tabContainer}>
                    {
                        tabs.map((tab, index) => {
                            if(tabs[index] === activeTab) {
                                return (
                                    <TouchableOpacity onPress={() => handleActivetabButton(index)} key={index}>
                                        <Text style={styles.activeTabText}>{tab}</Text>
                                    </TouchableOpacity>
                                )
                            } else return (
                                <TouchableOpacity onPress={() => handleActivetabButton(index)} key={index}>
                                    <Text style={styles.inactiveTabText}>{tab}</Text>
                                </TouchableOpacity>
                            )
                        })
                    }
                </View>
                { authenticatedUserData && profileID !== authenticatedUserData.user_id && !isKeepingUp &&  <TouchableOpacity onPress={handleKeepUp} style={styles.keepUpButton}>
                    <Text style={styles.keepUpText}>Keep Up</Text>
                </TouchableOpacity>}

                { authenticatedUserData && profileID !== authenticatedUserData.user_id && isKeepingUp &&  <TouchableOpacity onPress={handleDrop} style={styles.dropButton}>
                    <Text style={styles.dropText}>Drop</Text>
                </TouchableOpacity>}
            </View>
        </View>
        </GestureHandlerRootView>
    )
}

export default ProfileDetail
