import { StyleSheet, View } from 'react-native'
import React from 'react'
import ProfileSettings from '@/components/Profile/ProfileSettings'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'

const ProfileSettingsScreen = () => {
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  return (
    <View style={[styles.container, { backgroundColor: appearanceMode.backgroundColor }]}>
        <ProfileSettings/>
    </View>
  )
}

export default ProfileSettingsScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})