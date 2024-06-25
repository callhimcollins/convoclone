import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur'
import { userType } from '@/types'
import { Entypo, Feather } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { router, useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { getUserData } from '@/state/features/userSlice'


const ProfileHeader = ({ name }:userType) => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const userData = useSelector((state:RootState) => state.user.userData)
    const styles = getStyles(appearanceMode)
    const { profileID } = useLocalSearchParams()
    const dispatch = useDispatch()
    
    const handleBackButton = () => {
        router.back()
        dispatch(getUserData(null))
    }


    const handleAuthenticatedProfileSettings = () => {
        if(profileID === authenticatedUserData?.user_id) router.push({
            pathname: '/(profile)/profilesettings',
            params: {
                profileID: authenticatedUserData?.user_id
            }
        })
    }

    const handleGuestProfileSettings = () => {
        if(profileID !== authenticatedUserData?.user_id) router.push({
            pathname: '/(profile)/profilesettings',
            params: {
                profileID
            }
        })
    }

    const renderProfileHeader = () => {
        if(Platform.OS === 'android') {
            return <View style={[styles.container, {backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                <TouchableOpacity onPress={handleBackButton}>
                    <Entypo name="chevron-left" size={26} color={appearanceMode.textColor} />
                </TouchableOpacity>

                <Text style={styles.name}>{name}</Text>

                { profileID === authenticatedUserData?.user_id &&  <TouchableOpacity onPress={handleAuthenticatedProfileSettings}>
                    <Feather name="more-vertical" size={26} color="white" />
                </TouchableOpacity>}

                { profileID !== authenticatedUserData?.user_id &&  <TouchableOpacity onPress={handleGuestProfileSettings}>
                    <Feather name="more-vertical" size={26} color={appearanceMode.textColor} />
                </TouchableOpacity>}
            </View>
        } else {
            return <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.container}>
                
                <TouchableOpacity onPress={handleBackButton}>
                    <Entypo name="chevron-left" size={26} color={appearanceMode.textColor} />
                </TouchableOpacity>

                <Text style={styles.name}>{name}</Text>

                { profileID === authenticatedUserData?.user_id &&  <TouchableOpacity onPress={handleAuthenticatedProfileSettings}>
                    <Feather name="more-vertical" size={26} color={appearanceMode.textColor} />
                </TouchableOpacity>}

                { profileID !== authenticatedUserData?.user_id &&  <TouchableOpacity onPress={handleGuestProfileSettings}>
                    <Feather name="more-vertical" size={26} color={appearanceMode.textColor} />
                </TouchableOpacity>}
            </BlurView>
        }
    }

    return (
        <>
        {renderProfileHeader()}
        </>
    )
}

export default ProfileHeader

