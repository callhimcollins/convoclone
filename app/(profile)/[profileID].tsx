import { StyleSheet, View } from 'react-native'
import React from 'react'
import Profile from '@/components/Profile'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'

const ProfileScreen = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    return (
        <View style={[styles.container, {backgroundColor: appearanceMode.backgroundColor}]}>
            <Profile/>
        </View>
    )
}

export default ProfileScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})