import { Text, View, Image, TouchableOpacity } from 'react-native'
import getStyles from './styles'
import { useSelector } from 'react-redux'
import React from 'react'
import { RootState } from '@/state/store'
import { userKeepUpType, userType } from '@/types'
import { supabase } from '@/lib/supabase'

const UserKeepUpBox = ({keepUpUserData, keepup_user_id, user_id}: userKeepUpType) => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)

    const handleDrop = async () => {
        const { error } = await supabase
        .from('userKeepUps')
        .delete()
        .eq('user_id', String(user_id))
        .eq('keepup_user_id', String(keepup_user_id))

        if(!error) {
            console.log("User dropped")
        } else {
            console.log("Couldn't drop user", error.message)
        }
    }


    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <Image style={styles.image} source={require('@/assets/images/blankprofile.png')}/>
                <Text style={styles.username}>{ keepUpUserData?.username }</Text>
            </View>

            <TouchableOpacity onPress={handleDrop} style={styles.right}>
                <Text style={styles.rightText}>Drop</Text>
            </TouchableOpacity>
        </View>
    )
}

export default UserKeepUpBox

