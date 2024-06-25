import { Image, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { userType } from '@/types'
import { Feather } from '@expo/vector-icons'

const ProfileCard = ({name, username, profileImage}:userType) => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)
    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Image source={require('@/assets/images/blankprofile.png')} style={styles.image}/>

                <TouchableOpacity style={styles.audioButton}>
                    <Feather name='volume-2' size={25} color={'white'}/>
                </TouchableOpacity>  
            </View>

            <View style={styles.middleContainer}>
                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.name}>{name}</Text>
                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.username}>{username}</Text>
            </View>

            <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewText}>View</Text>
            </TouchableOpacity>
        </View>
    )
}

export default ProfileCard

