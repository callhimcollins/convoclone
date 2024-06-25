import { Platform, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'

const KeepUpHeader = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)
    const renderHeader = () => {
        if(Platform.OS === 'android' || appearanceMode.name === 'light') {
            return (
                <View style={[styles.container, {backgroundColor: appearanceMode.backgroundColor }]}>
                    <Text style={styles.headerText}>Keep Ups</Text>
                </View>
            )
        } else {
            return (
                <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.container}>
                    <Text style={styles.headerText}>Keep Ups</Text>
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

export default KeepUpHeader
