import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Username from '@/components/Auth/Username'

const UsernameScreen = () => {
  return (
    <View style={styles.container}>
        <Username/>
    </View>
  )
}

export default UsernameScreen

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})