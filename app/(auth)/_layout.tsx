import React from 'react'
import { Redirect, router, Stack } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { supabase } from '@/lib/supabase'
import { setAuthenticatedUserID } from '@/state/features/userSlice'
const AuthLayout = () => {
    return (
        <Stack>
            <Stack.Screen name='LoginScreen' options={{ headerShown: false }}/>
            <Stack.Screen name='RegisterScreen' options={{ headerShown: false }}/>
            <Stack.Screen name='UsernameScreen' options={{ headerShown: false }}/>
            <Stack.Screen name='AddNameScreen' options={{ headerShown: false }}/>
            <Stack.Screen name='CompleteProfileScreen' options={{ headerShown: false }}/>
        </Stack>
    )
}
export default AuthLayout
