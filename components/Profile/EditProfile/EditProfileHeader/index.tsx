import { Platform, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import getStyles from './styles'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { BlurView } from 'expo-blur'
import { Entypo } from '@expo/vector-icons'
import { router } from 'expo-router'
const EditProfileHeader = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)

    const navigateBack = () => {
        router.back()
    }
    const renderHeader = () => {
        if(Platform.OS === 'android') {
            return (
                <View style={styles.container}>
                    <TouchableOpacity onPress={navigateBack}>
                        <Entypo name="chevron-left" size={26} color={appearanceMode.textColor} />
                    </TouchableOpacity>
                    <Text style={styles.text}>Edit Profile</Text>
                </View>
            )
        } else {
            return (
                <BlurView intensity={80} tint={appearanceMode.name === 'light' ? 'light' : 'dark'} style={styles.container}>
                    <TouchableOpacity onPress={navigateBack}>
                        <Entypo name="chevron-left" size={26} color={appearanceMode.textColor} />
                    </TouchableOpacity>

                    <Text style={styles.text}>Edit Profile</Text>
                    
                    <View/>
                </BlurView>
            )
        }
    }
    return (
        <>
            {renderHeader()}
        </>
    )
}

export default EditProfileHeader

