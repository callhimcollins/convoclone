import React from 'react'
import { Stack } from 'expo-router'
const AuthLayout = () => {
    return (
        <Stack>
            <Stack.Screen name='LoginScreen' options={{ headerShown: false }}/>
            <Stack.Screen name='RegisterScreen' options={{ headerShown: false }}/>
            <Stack.Screen name='UsernameScreen' options={{ headerShown: false }}/>
            <Stack.Screen name='AddNameScreen' options={{ headerShown: false }}/>
            <Stack.Screen name='ResetPasswordScreen' options={{ headerShown: false }}/>
            <Stack.Screen name='CompleteProfileScreen' options={{ headerShown: false }}/>
        </Stack>
    )
}
export default AuthLayout
