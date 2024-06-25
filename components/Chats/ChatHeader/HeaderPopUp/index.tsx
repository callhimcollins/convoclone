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


const images = ["https://www.rollingstone.com/wp-content/uploads/2024/06/kendrick-lamar-not-like-us.jpg?w=1581&h=1054&crop=1", "https://image-cdn.hypb.st/https%3A%2F%2Fhypebeast.com%2Fimage%2F2024%2F06%2F20%2Fkendrick-lamar-the-pop-out-1.jpg?cbr=1&q=90", "https://img.buzzfeed.com/buzzfeed-static/complex/images/kiao5opbibefbkhqcyab/kendrick-lamar-the-heart-part-5.jpg?output-format=jpg&output-quality=auto", "https://www.rollingstone.com/wp-content/uploads/2024/06/kendrick-lamar-not-like-us.jpg?w=1581&h=1054&crop=1", "https://image-cdn.hypb.st/https%3A%2F%2Fhypebeast.com%2Fimage%2F2024%2F06%2F20%2Fkendrick-lamar-the-pop-out-1.jpg?cbr=1&q=90",  ]
const HeaderPopUp = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const convo = useSelector((styles: RootState) => styles.chat.convo)
    const [userData, setUserData] = useState<userType>()
    // const userData = useSelector((state:RootState) => state.user.userData)
    const [keepingUp, setKeepingUp] = useState(false)
    const styles = getStyles(appearanceMode)
    const dispatch = useDispatch()

    const convoKeepUpData = {
        user_id: authenticatedUserData?.user_id,
        convo_id: convo.convo_id,
        userData: authenticatedUserData,
        convoData: convo
    }

    const notificationForKeepUp = {
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        receiver_id: userData?.user_id,
        convo,
        type: 'keepup',
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
    }, [])

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
        .eq('receiver_id', String(convo.user_id))
        .eq('convo->>convo_id', String(convo.convo_id))
        .eq('type', 'keepup')
        .single()
        
        if(data) {
            console.log("Notification exists")
        } else {
            console.log("Trying now")
            const { data: blockedUserData, error: blockedUserError } = await supabase
            .from('blockedUsers')
            .select('*')
            .eq('user_id', String(convo.user_id))
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
        .eq('convo_id', convo.convo_id)
        .eq('user_id', String(authenticatedUserData?.user_id))

        if(error) {
            console.log("Couldn't drop convo")
            setKeepingUp(true)
        } else {
            setKeepingUp(false)
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
            setKeepingUp(false)
        } else {
            setKeepingUp(true)
        }
    }, [convo.convo_id, authenticatedUserData?.user_id])

    useEffect(() => {
        checkIsKeepingUp()
        fetchUserData()
    }, [])
    
    return (
        <BlurView intensity={80} tint={appearanceMode.name === 'dark' ? 'dark' : 'light'} style={styles.container}>
            <ScrollView>
                { keepingUp && <TouchableOpacity onPress={handleDrop} style={ keepingUp ? styles.dropConversation : styles.keepUpWithConversation}>
                    <Text style={styles.keepUpWithConversationText}>Drop Conversation</Text>
                </TouchableOpacity>}
                { !keepingUp && <TouchableOpacity onPress={handleKeepUp} style={ keepingUp ? styles.dropConversation : styles.keepUpWithConversation}>
                    <Text style={styles.keepUpWithConversationText}>Keep Up With This Conversation</Text>
                </TouchableOpacity>}
                <Text style={styles.convoStarter}>{ convo.convoStarter }</Text>
                { convo.link && 
                    <TouchableOpacity onPress={handleOpenLink}>
                        <UrlPreview url={convo.link} />
                    </TouchableOpacity>
                }

                { Platform.OS === 'ios' && <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {images.map((image, index) => (
                        <Image source={{ uri: image }} key={index} style={styles.media}/>
                    ))}
                </ScrollView>}
                {Platform.OS === 'android' && 
                    <View style={styles.androidMediaContainer}>
                        {images.map((image, index) => (
                            <TouchableOpacity style={styles.androidMediaButton}>
                                <Image source={{ uri: image }} style={styles.androidMedia}/>
                            </TouchableOpacity>
                        ))}
                    </View>
                }
            </ScrollView>
        </BlurView>
    )
}

export default HeaderPopUp
