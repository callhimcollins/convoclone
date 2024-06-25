import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const ProfileScreen = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='profilesettings' options={{ presentation: 'modal' }}/>
      <Stack.Screen name='requestotherstojoincirclescreen' options={{ presentation: 'modal' }}/>
    </Stack>
  )
}

export default ProfileScreen

