import { Image, Platform, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { userType } from '@/types'
import { BlurView } from 'expo-blur'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { getStyles } from './styles'
import { router } from 'expo-router'
import { getUserData } from '@/state/features/userSlice'
import RemoteImage from '@/components/RemoteImage'
import { Entypo } from '@expo/vector-icons'


const PrivateConvosHeader = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)



    const renderHeader = () => {
        if(Platform.OS === 'android') {
            return <View style={[styles.headerContainer, { backgroundColor: appearanceMode.backgroundColor }]}>
                <View style={styles.contentContainer}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Entypo name="chevron-left" size={26} color={appearanceMode.textColor} />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Private Convos</Text>
                    <View/>
                </View>
            </View>
        } else {
            return <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.headerContainer}>
                <View style={styles.contentContainer}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Entypo name="chevron-left" size={26} color={appearanceMode.textColor} />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Private Convos</Text>
                    <View/>
                </View>
            </BlurView>
        }
    }
    
    return (
        <>
        {renderHeader()}
        </>
    )
}

export default PrivateConvosHeader

