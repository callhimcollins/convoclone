import { Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import getStyles from './styles'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { privateCircleType } from '@/types'
import { getUserData } from '@/state/features/userSlice'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { sendPushNotification } from '@/pushNotifications'

const IncomingRequestBox = ({senderUserData, sender_id, type,}:privateCircleType) => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const dispatch = useDispatch()
    const styles = getStyles(appearanceMode)


    const notificationForPrivateRequestAcceptance = {
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        receiver_id: senderUserData?.user_id,
        type: 'privatecircleacceptance',
    }

    const notificationForInviteToPrivateCircleAcceptance = {
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        receiver_id: senderUserData?.user_id,
        type: 'invitetoprivatecircleacceptance',
    }

1
    const handleNavigateToProfile = () => {
        dispatch(getUserData(senderUserData))
        router.push({
            pathname: '/(profile)/[profileID]',
            params: { profileID: sender_id }
        })
    }

    const handleAcceptPrivateRequest = async () => {
        const { data, error } = await supabase
        .from('privateCircle')
        .update({ status: 'accepted' })
        .eq('sender_id', String(senderUserData?.user_id))
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .single()

        if(!error) {
            console.log("successfully accepted")
        } else {
            console.log("Couldn't accept request", error.message)
        }
    }

    const sendNotificationForInviteToPrivateCircleAcceptance = async () => {
        const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(senderUserData?.user_id))
        .eq('type', 'invitetoprivatecircleacceptance')
        .single()
        if(data) {
            console.log("Notification for invite acceptance exists")
        } else {
            const { error } = await supabase
            .from('notifications')
            .insert([notificationForInviteToPrivateCircleAcceptance])
            .single()
            if(!error) {
                console.log("Invite Acceptance notification sent")
                const { data } = await supabase
                .from('Users')
                .select('pushToken')
                .eq('user_id', senderUserData?.user_id)
                .single()
                if(data) {
                    sendPushNotification(data.pushToken, 'Private', `${authenticatedUserData?.username} is now a part of your Private Circle`)
                }
            } else {
                console.log("Couldn't send invite acceptance notification", error.message)
            }
        }
        if(error) {
            console.log("Couldn't fetch invite acceptance notification", error.message)
        }
    }

    const sendNotificationForPrivateCircleAcceptance = async () => {
        const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(senderUserData?.user_id))
        .eq('type', 'privatecircleacceptance')
        .single()
        if(data) {
            console.log("Notification for acceptance exists")
        } else {
            const { error } = await supabase
            .from('notifications')
            .insert([notificationForPrivateRequestAcceptance])
            .single()
            if(!error) {
                console.log("Acceptance notification sent")
                const { data } = await supabase
                .from('Users')
                .select('pushToken')
                .eq('user_id', senderUserData?.user_id)
                .single()
                if(data) {
                    console.log(data)
                    sendPushNotification(data.pushToken, 'Private', `You are now a part of ${authenticatedUserData?.username}'s Private Circle`)
                }
            } else {
                console.log("Couldn't send acceptance notification", error.message)
            }
        }
        if(error) {
            console.log("Couldn't fetch acceptance notification", error.message)
        }
    }

    useEffect(() => {
        const channel = supabase.channel(`send-notification-for-acceptance-${sender_id}`)
        .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "privateCircle" },
            (payload) => {
                if(payload.new.type === 'requesttojoin') {
                    sendNotificationForPrivateCircleAcceptance()
                } else if(payload.new.type === 'invite') {
                    sendNotificationForInviteToPrivateCircleAcceptance()
                }
            }
        ).subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [])

    return (
        <TouchableOpacity onPress={handleNavigateToProfile} style={{ padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomColor: appearanceMode.faint, borderBottomWidth: 1 }}>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={require('@/assets/images/blankprofile.png')} style={{ width: 50, height: 50, borderRadius: 10 }}/>
                <Text style={{ marginLeft: 10, color: appearanceMode.textColor, fontFamily: 'bold' }}>{senderUserData.username}</Text>
            </View>

            <TouchableOpacity onPress={handleAcceptPrivateRequest} style={{ backgroundColor: 'rgba(98, 95, 224, 0.3)', padding: 5, borderRadius: 7 }}>
                { type === 'requesttojoin' && <Text style={{ color: appearanceMode.primary, fontFamily: 'extrabold',fontSize: 15 }}>Allow To Join</Text>}
                { type === 'invite' && <Text style={{ color: appearanceMode.primary, fontFamily: 'extrabold',fontSize: 15 }}>Accept Invite</Text>}
            </TouchableOpacity>
        </TouchableOpacity>
    )
}

export default IncomingRequestBox
