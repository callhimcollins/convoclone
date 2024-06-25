import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import CompleteProfile from '@/components/Auth/CompleteProfile'

const CompleteProfileScreen = () => {
  return (
    <View style={styles.container}>
        <CompleteProfile/>
    </View>
  )
}

export default CompleteProfileScreen

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})