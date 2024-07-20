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
            <Stack.Screen name='EulaScreen' options={{ presentation: 'modal', headerTitle: 'End User License Agreement'}}/>
            <Stack.Screen name='AudioProfileInfoScreen' options={{ presentation: 'modal', headerTitle: 'Experience The Best Of Convo', headerTintColor: '#625FE0' }}/>
        </Stack>
    )
}
export default AuthLayout
