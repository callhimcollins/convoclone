import { Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { userType } from '@/types'
import { FontAwesome } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { getUserData } from '@/state/features/userSlice'
import { router } from 'expo-router'

const RequestUserList = (user: userType) => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const [sentOrAcceptedToPrivateCircle, setSentOrAcceptedToPrivateCircle] = useState(false)
    const [userIsBlocked, setUserIsBlocked] = useState(false)
    const dispatch = useDispatch()
    const styles = getStyles(appearanceMode)


    const privateCircleData = {
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        senderIsBlocked: false,
        receiverUserData: user,
        receiver_id: user.user_id,
        type: 'invite'
    }


    const inviteToPrivatCircleNotification = {
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        receiver_id: user.user_id,
        type: 'invitetoprivatecircle',
    }

    const handleNavigateToProfile = () => {
        dispatch(getUserData(user))
        router.replace({
            pathname: '(profile)/[profileID]',
            params: {
                profileID: user.user_id
            }
        })
    }

    const sendInviteToPrivateCircle = async () => {
        const { data } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(user.user_id))
        .single()
        if(data) {
            console.log("Request sent earlier")
        } else {
            const { error } = await supabase
            .from('privateCircle')
            .insert([privateCircleData])
            .single()

            if(!error) {
                sendNotificationInviteToPrivateCircle()
                setSentOrAcceptedToPrivateCircle(true)
                console.log("Private circle request sent")
            } else {
                console.log("Problem sending private circle request", error.message)
            }
        }
    }

    const sendNotificationInviteToPrivateCircle = async () => {
        const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(user.user_id))
        .eq('type', 'invitetoprivatecircle')
        .single()
        if(data) {
            console.log("request notification already exists")
        } else {
            const { error } = await supabase
            .from('notifications')
            .insert([inviteToPrivatCircleNotification])
            .single()
            if(!error) {
                console.log("Request notification sent")
            } else {
                console.log("Problem sending notification")
            }
        } 

        if(error) {
            console.log("Couldn't fetch notification", error.message)
        }
    }

    const checkIfSentOrAccepted = async () => {
        const { data, error } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(user.user_id))
        .single()
        if(data) {
            setSentOrAcceptedToPrivateCircle(true)
        } else {
            setSentOrAcceptedToPrivateCircle(false)
        }

        if(error) {
            console.log("error checking if user is in private circle", error.message)
        }
    }

    const checkUserIsBlocked = async () => {
        const { data, error } = await supabase
        .from('blockedUsers')
        .select('*')
        .eq('user_id', String(authenticatedUserData?.user_id))
        .eq('blockedUserID', String(user.user_id))
        .single()
        if(data) {
            setUserIsBlocked(true)
        } else {
            setUserIsBlocked(false)
        }
    }

    useEffect(() => {
        checkIfSentOrAccepted()
        checkUserIsBlocked()
    }, [])

    return (
        <TouchableOpacity onPress={handleNavigateToProfile} style={{ padding: 15, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: .5, borderBottomColor: appearanceMode.faint }}>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image style={{ width: 50, height: 50, borderRadius: 10 }} source={require('@/assets/images/blankprofile.png')}/>
                <Text style={{ color: 'white', marginLeft: 10, fontFamily: 'bold' }}>{user.username}</Text>
            </View>

            { !sentOrAcceptedToPrivateCircle && !userIsBlocked && <TouchableOpacity onPress={sendInviteToPrivateCircle} style={{ backgroundColor: appearanceMode.primary, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, borderRadius: 10 }}>
                <FontAwesome name='paper-plane' color={'white'} size={24}/>
            </TouchableOpacity>}

            { userIsBlocked && 
                <View style={{ justifyContent: 'center', alignItems: 'center'  }}>
                    <Image style={{ width: 45, height: 45, borderRadius: 10 }} source={require('@/assets/images/alreadyblocked.png')}/>
                </View>
                }
        </TouchableOpacity>
    )
}

export default RequestUserList

