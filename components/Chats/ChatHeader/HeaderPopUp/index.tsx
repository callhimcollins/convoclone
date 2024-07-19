import { Image, Text, ScrollView, Linking, Dimensions, Platform, View } from 'react-native'
import { BlurView } from 'expo-blur'
import React, { useCallback, useEffect, useState } from 'react'
import getStyles from './styles'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import UrlPreview from '@/components/UrlPreview'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import { supabase } from '@/lib/supabase'
import { userType } from '@/types'
import { addToUserCache } from '@/state/features/chatSlice'
import { sendPushNotification } from '@/pushNotifications'
import RemoteImage from '@/components/RemoteImage'
import RemoteVideo from '@/components/RemoteVideo'
import { setShowFullScreen, setFullScreenSource, togglePlayPause } from '@/state/features/mediaSlice'
import { randomUUID } from 'expo-crypto'
import { ResizeMode } from 'expo-av'


const HeaderPopUp = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const convo = useSelector((styles: RootState) => styles.chat.convo)
    const userCache = useSelector((state:RootState) => state.chat.userCache)
    const [keepingUp, setKeepingUp] = useState(false)
    const styles = getStyles(appearanceMode)
    const dispatch = useDispatch()

    const convoKeepUpData = {
        user_id: authenticatedUserData?.user_id,
        convo_id: convo?.convo_id,
        userData: authenticatedUserData,
        convoData: convo
    }

    const notificationForKeepUp = {
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        receiver_id: convo?.Users?.user_id,
        convo,
        type: 'keepup',
    }


    const handleShowFullScreen = (file:string) => {
        dispatch(setShowFullScreen(true))
        dispatch(setFullScreenSource({file, convoStarter: String(convo.convoStarter)}))
        dispatch(togglePlayPause({ index: file + String(randomUUID()) }))
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


    const sendNotificationForKeepUp = useCallback(async () => {
        if(notificationForKeepUp.receiver_id === notificationForKeepUp.sender_id){
            return;
        }
        const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(convo?.user_id))
        .eq('convo->>convo_id', String(convo?.convo_id))
        .eq('type', 'keepup')
        .single()
        
        if(data) {
            console.log("Notification exists")
        } else {
            console.log("Trying now")
            const { data: blockedUserData, error: blockedUserError } = await supabase
            .from('blockedUsers')
            .select('*')
            .eq('user_id', String(convo?.user_id))
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
                    const { data } = await supabase
                    .from('Users')
                    .select('pushToken, user_id')
                    .eq('user_id', String(convo?.user_id))
                    .single()
                    if(data) {
                        sendPushNotification(data.pushToken, 'Keep Up', `${authenticatedUserData?.username} started keeping up with your Convo: ${convo?.convoStarter}`, 'profile', authenticatedUserData, null, data.user_id)
                    }
                }
            }
            
            if(blockedUserError) {
                console.log("Error checking for blocked user")
            }
        }

        if(error) {
            console.log("Couldn't fetch notification")
        }
        
    }, [notificationForKeepUp, convo?.user_id, authenticatedUserData?.user_id])
    
    const handleKeepUp = useCallback(async () => {
        const { error } = await supabase
        .from('convoKeepUps')
        .insert([convoKeepUpData])
        .select()
        if(error) {
            console.log('Keep up not added', error.message)
        } else {
            sendNotificationForKeepUp()
            setKeepingUp(true)
        }
    }, [convoKeepUpData])

    const handleDrop = useCallback(async () => {
        const { error } = await supabase
        .from('convoKeepUps')
        .delete()
        .eq('convo_id', convo?.convo_id)
        .eq('user_id', String(authenticatedUserData?.user_id))

        if(error) {
            console.log("Couldn't drop convo")
            setKeepingUp(true)
        } else {
            setKeepingUp(false)
        }
    }, [convo?.convo_id, authenticatedUserData?.user_id])

    const checkIsKeepingUp = useCallback(async () => {
        const { data, error } = await supabase
        .from('convoKeepUps')
        .select('*')
        .eq('convo_id', convo?.convo_id)
        .eq('user_id', String(authenticatedUserData?.user_id))
        .single()
        if(error) {
            setKeepingUp(false)
        } else {
            setKeepingUp(true)
        }
    }, [convo?.convo_id, authenticatedUserData?.user_id])

    useEffect(() => {
        checkIsKeepingUp()
    }, [])
    
    return (
        <BlurView intensity={80} tint={appearanceMode.name === 'dark' ? 'dark' : 'light'} style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                <Text style={styles.convoStarter}>{convo.convoStarter}</Text>
                { !convo.isHighlight && !convo.isDiscoverable && <View>
                    { keepingUp && <TouchableOpacity onPress={handleDrop} style={ keepingUp ? styles.dropConversation : styles.keepUpWithConversation}>
                        <Text style={styles.keepUpWithConversationText}>Drop Conversation</Text>
                    </TouchableOpacity>}
                    { !keepingUp && <TouchableOpacity onPress={handleKeepUp} style={ keepingUp ? styles.dropConversation : styles.keepUpWithConversation}>
                        <Text style={styles.keepUpWithConversationText}>Keep Up With This Conversation</Text>
                    </TouchableOpacity>}
                </View>}

                { convo?.link && 
                    <TouchableOpacity onPress={handleOpenLink}>
                        <UrlPreview url={convo.link} />
                    </TouchableOpacity>
                }

                { Platform.OS === 'ios' && <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {convo?.files?.map((file:any, index:number) => (
                        <View key={index}>
                            { file.endsWith('.mp4') ? 
                            <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center' }} onPress={() => handleShowFullScreen(file)}>
                                <View style={{ zIndex: 100, position: 'absolute', justifyContent: 'center' }}>
                                    <BlurView style={{  borderRadius: 15, overflow: 'hidden', paddingHorizontal: 30, paddingVertical: 10 }}>
                                        <Text style={{ color: 'white', textAlign: 'center', fontFamily: 'extrabold', fontSize: 15 }}>Video</Text>
                                    </BlurView>
                                </View>
                                <RemoteVideo resizeMode={ResizeMode.COVER} shouldPlay={false} path={ file } key={index} style={styles.media}/> 
                            </TouchableOpacity>
                            : <RemoteImage path={ file } key={index} style={styles.media}/>}
                        </View>
                    ))}
                </ScrollView>}
                {Platform.OS === 'android' && 
                    <View style={styles.androidMediaContainer}>
                        {convo.files.map((file, index) => (
                            <View>
                                <TouchableOpacity style={styles.androidMediaButton}>
                                    
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                }
            </ScrollView>
        </BlurView>
    )
}

export default HeaderPopUp
