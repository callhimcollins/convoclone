import { Platform, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur'
import getStyles from './styles'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'

const UserKeepUpsHeader = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)
    const renderHeader = () => {
        if(Platform.OS === 'android') {
            return (
                <View style={styles.container}>
                    <Text>People You're Keeping Up With</Text>
                </View>
            )
        } else {
            return (
                <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.container}>
                    <Text style={styles.headerText}>People You're Keeping Up With</Text>
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

export default UserKeepUpsHeader

