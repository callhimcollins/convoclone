import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import getStyles from './styles'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { supabase } from '@/lib/supabase'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { setAuthenticatedUserData, setAuthenticatedUserID } from '@/state/features/userSlice'
import { router } from 'expo-router'
import * as Linking from "expo-linking";
import SystemNotification from '@/components/Notifications/SystemNotifications'


const redirectTo = makeRedirectUri();


const ResetPassword = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)
    const [email, setEmail] = useState('')
    const [emailList, setEmailList] = useState<Array<any>>([])
    const [emailExists, setEmailExists] = useState<boolean>(false)
    const dispatch = useDispatch()
    const createSessionFromUrl = async (url: string) => {
        const { params, errorCode } = QueryParams.getQueryParams(url);
      
        if (errorCode) throw new Error(errorCode);
        const { access_token, refresh_token } = params;
      
        if (!access_token) return;
      
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })
        if (error) throw error;
        if(data.session) {
          const { data:userData, error:userError } = await supabase
          .from('Users')
          .select(`*`)
          .eq('user_id', String(data.session.user?.id))
          .single()
          if(data) {
            dispatch(setAuthenticatedUserData(userData))
            dispatch(setAuthenticatedUserID(data.session.user?.id))
            url = ''
            router.replace('(tabs)')
          }
        }
        return data.session;
      };
    let url = Linking.useURL();
    if(url) createSessionFromUrl(url);

    useEffect(() => {
        (async() => {
            const { data, error } = await supabase
            .from('Users')
            .select(`email`)
            if(data) {
                setEmailList(data.map((email) => email.email))
            }
        })()
    }, [])

    useEffect(() => {
        if(emailList.includes(email.toLowerCase())) {
            setEmailExists(true)
        } else {
            setEmailExists(false)
        }
    }, [emailList, email])



    const sendMagicLink = async () => {
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectTo,
          },
        });
      
        if(data) {
          console.log("Data from magic link", data)
          dispatch(setSystemNotificationState(true))
          dispatch(setSystemNotificationData({ type:'neutral', message: 'An Email Has Been Sent. Update Your Password When You Are Logged In' }))
        }
        if (error) throw error;
        // Email sent.
      };
    return (
        <View style={styles.container}>
            <View style={styles.notificationContainer}>
                <SystemNotification/>
            </View>
            <Text style={styles.mainText}>Reset Password</Text>
            <View style={styles.textInputContainer}>
                <TextInput autoCapitalize='none' value={email} onChangeText={(text) => setEmail(text.trim())} placeholder='Email' style={styles.textInput}/>
            </View>
            <TouchableOpacity onPress={sendMagicLink} disabled={!emailExists} style={[styles.resetPasswordButton, !emailExists && { backgroundColor: appearanceMode.secondary }]}>
                { email !== '' && <Text style={[styles.resetPasswordButtonText, !emailExists && { color: appearanceMode.textColor }]}> {emailExists ? 'Send Login Link To Email' : 'Email Not Found'}</Text>}
                { email === '' && <Text style={[styles.resetPasswordButtonText, !emailExists && { color: appearanceMode.textColor }]}>Start Typing To Validate Email</Text>}
            </TouchableOpacity>
        </View>
    )
}

export default ResetPassword
