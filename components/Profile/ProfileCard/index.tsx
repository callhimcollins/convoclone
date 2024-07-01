import { Image, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { userType } from '@/types'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { getUserData } from '@/state/features/userSlice'

const ProfileCard = ({name, username, profileImage, user_id, id, email, bio, audio, convos, dateCreated, lastUpdated, backgroundProfileImage, links, isRobot}:userType) => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)
    const dispatch = useDispatch()

    const handleProfileNavigation = () => {
        dispatch(getUserData({
            id,
            user_id,
            email,
            profileImage,
            username,
            name,
            bio,
            audio,
            dateCreated,
            lastUpdated,
            backgroundProfileImage,
            links,
            isRobot
        }))
        router.push({
          pathname: '/(profile)/[profileID]',
          params: {
            profileID: user_id
          }
        })
      }

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
                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.username}>{username?.split('-')[0]}</Text>
            </View>

            <TouchableOpacity onPress={handleProfileNavigation} style={styles.viewButton}>
                <Text style={styles.viewText}>View</Text>
            </TouchableOpacity>
        </View>
    )
}

export default ProfileCard

