import { StyleSheet, View } from 'react-native'
import React from 'react'
import Login from '@/components/Auth/Login'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'


const LoginScreen = () => {
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  return (
    <View style={styles.container}>
        <Login/>
    </View>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})