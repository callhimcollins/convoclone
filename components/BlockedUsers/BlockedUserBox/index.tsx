import { Text, View, Image, TouchableOpacity } from 'react-native'
import getStyles from './styles'
import { useSelector } from 'react-redux'
import React from 'react'
import { RootState } from '@/state/store'
import { blockedUserType, userType } from '@/types'
import { supabase } from '@/lib/supabase'

const BlockedUserBox = ({blockedUserData, blockedUserID, user_id, id}: blockedUserType) => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const styles = getStyles(appearanceMode)

    const handleUnblock = async () => {
        const { error } = await supabase
        .from('blockedUsers')
        .delete()
        .eq('user_id', String(user_id))
        .eq('blockedUserID', String(blockedUserID))

        if(!error) {
            console.log("User unblocked")
            reviveUserInCircle()
        } else {
            console.log("Could not unblock user", error.message)
        }
    }

    const reviveUserInCircle = async () => {
        const { error } = await supabase
        .from('privateCircle')
        .update({ senderIsBlocked: false })
        .eq('sender_id', String(blockedUserID))
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .single()
        if(!error) {
            console.log("User successfully revived in private circle") 
        } else {
            console.log("Couldn't revive user in private circle", error.message)
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <Image style={styles.image} source={require('@/assets/images/blankprofile.png')}/>
                <Text style={styles.username}>{ blockedUserData?.username }</Text>
            </View>

            <TouchableOpacity onPress={handleUnblock} style={styles.right}>
                <Text style={styles.rightText}>Unblock</Text>
            </TouchableOpacity>
        </View>
    )
}

export default BlockedUserBox