import { StyleSheet, View } from 'react-native'
import React from 'react'
import ResetPassword from '@/components/Auth/ResetPassword'

const ResetPasswordScreen = () => {
  return (
    <View style={styles.container}>
        <ResetPassword/>
    </View>
  )
}

export default ResetPasswordScreen


const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})