import { Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import getStyles from './styles'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { privateCircleType } from '@/types'
import { getUserData } from '@/state/features/userSlice'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'

const YourRequestBox = ({receiverUserData, receiver_id, id}:privateCircleType) => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const dispatch = useDispatch()
    const styles = getStyles(appearanceMode)


    const handleNavigationToProfile = () => {
        dispatch(getUserData(receiverUserData))
        router.push({
            pathname: '/(profile)/[profileID]',
            params: {
                profileID: receiver_id
            }
        })
    }

    const cancelRequestForPrivateCircle = async () => {
        const { error } = await supabase
        .from('privateCircle')
        .delete()
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(receiver_id))
        if(!error) {
            console.log("private circle request deleted")
            const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('sender_id', String(authenticatedUserData?.user_id))
            .eq('receiver_id', String(receiver_id))
            .eq('type', 'privatecircle')
            if(!error) {
               console.log("Notification deleted!")
            } else {
                console.log("Problem deleting notification", error.message)
            }
        } else {
            console.log("Problem deleting private circle request", error.message)
        }
    }

    return (
        <TouchableOpacity onPress={handleNavigationToProfile} style={styles.container}>
            <View style={styles.left}>
                <Image style={styles.profileImage} source={require('@/assets/images/blankprofile.png')}/>
                <Text style={styles.username}>{receiverUserData.username}</Text>
            </View>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelRequestForPrivateCircle}>
                <Text style={styles.cancelButtonText}>Cancel Request</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    )
}

export default YourRequestBox

