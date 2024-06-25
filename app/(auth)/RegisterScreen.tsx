import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Register from '@/components/Auth/Register'

const RegisterScreen = () => {
  return (
    <View style={styles.container}>
        <Register/>
    </View>
  )
}

export default RegisterScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})