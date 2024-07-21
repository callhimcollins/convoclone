import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { Entypo } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { getUserData, setAuthenticatedUserData, setAuthenticatedUserID } from '@/state/features/userSlice'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import SystemNotification from '@/components/Notifications/SystemNotifications'
import * as AppleAuthentication from 'expo-apple-authentication'
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import * as WebBrowser from "expo-web-browser";
import { registerForPushNotificationsAsync } from '@/pushNotifications'


WebBrowser.maybeCompleteAuthSession(); // required for web only


const Login = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const styles = getStyles(appearanceMode)
    const dispatch = useDispatch()


    const handleLogin = async () => {
      setLoading(true)
      const { data: { session }, error } = await supabase.auth.signInWithPassword({ email, password })
      if(session) {
        const { data, error } = await supabase
        .from('Users')
        .select(`*`)
        .eq('user_id', String(session.user.id))
        .single()

        if(data) {
          setAuthenticatedUserData(data)
          registerForPushNotificationsAsync(String(session.user?.id));
          router.replace('(tabs)')
        }

        if(error) {
          dispatch(setSystemNotificationState(true))
          dispatch(setSystemNotificationData({ type: 'error', message: `A Problem Occured. Restart App` }))
          return;
        }
      }
      if(error) {
        dispatch(setSystemNotificationState(true))
        dispatch(setSystemNotificationData({ type: 'error', message: error.message }))
        return;
      } 
    }




    const handleSignInWithApple = async () => {
      try {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        })
        // Sign in via Supabase Auth.
        if (credential.identityToken) {
          const {
            error,
            data: { user },
          } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: credential.identityToken,
          })
          if (!error) {
            dispatch(setAuthenticatedUserID(user?.id))
            const { data, error } = await supabase
            .from('Users')
            .select('*')
            .eq('user_id', user?.id)
            .single()
            if(data) {
              if(data.username === null) {
                registerForPushNotificationsAsync(String(user?.id));
                router.replace('/(auth)/UsernameScreen')
              } else {
                dispatch(setAuthenticatedUserData(data))
                registerForPushNotificationsAsync(String(user?.id));
                router.replace('/(tabs)/')
              }
            } else {
              const { error } = await supabase
              .from('Users')
              .insert([{ user_id: user?.id, email: user?.email }])
              .single()
              dispatch(setAuthenticatedUserID(user?.id))
              if(error) {
                dispatch(setSystemNotificationState(true))
                dispatch(setSystemNotificationData({ type: 'error', message: 'Something went wrong' }))
                return;
              } else {
                registerForPushNotificationsAsync(String(user?.id));
                router.replace('/(auth)/UsernameScreen')
              }
            }
          }
        } else {
          throw new Error('No identityToken.')
        }
      } catch (error) {
        console.log(error)
      }
    }

    // GoogleSignin.configure({
    //   scopes: ['https://www.googleapis.com/auth/userinfo.email'],
    //   webClientId: '443950013750-75qg755cirs7m07algdosu0lngd8qm4r.apps.googleusercontent.com',
    // })

    // const signInWithGoogle = async () => {
    //   console.log("Pressed")
    //   try {
    //     await GoogleSignin.hasPlayServices();
    //     const user = await GoogleSignin.signIn();
    //     if(user.idToken) {
    //       const { data, error } = await supabase.auth.signInWithIdToken({
    //         provider: 'google',
    //         token: user.idToken,
    //       })
    //       console.log(data.session?.user.id)
    //       if(!error) {
    //         dispatch(setAuthenticatedUserID(data.session?.user.id))
    //         const { data:userData, error } = await supabase
    //         .from('Users')
    //         .select(`*`)
    //         .eq('user_id', data.session?.user.id)
    //         .single()
    //         if(userData) {
    //           if(userData.username === null) {
    //             router.replace('/(auth)/UsernameScreen')
    //           } else {
    //             dispatch(setAuthenticatedUserData(userData))
    //             router.replace('/(tabs)')
    //           }
    //         } else if (error) {
    //           const { error:userError } = await supabase
    //           .from('Users')
    //           .insert([{ user_id: data.session?.user.id, email: data.session?.user.email }])
    //           dispatch(setAuthenticatedUserID(data.session?.user.id))
    //           if(userError) {
    //             dispatch(setSystemNotificationState(true))
    //             dispatch(setSystemNotificationData({ type: 'error', message: 'Something went wrong' }))
    //             return;
    //           } else {
    //             router.replace('/(auth)/UsernameScreen')
    //           }
    //         }
    //       }
    //     }
    //   } catch (error:any) {
    //     if(error.code === statusCodes.SIGN_IN_CANCELLED) {
    //       console.log("User cancelled login flow")
    //     } else if(error.code === statusCodes.IN_PROGRESS) {
    //       console.log("sign in operation in progress")
    //     } else if(error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    //       console.log("Play services not available or outdated")
    //     } else {
    //       console.log(error)
    //     }
    //   }
    // }



    return (
      <View style={styles.container}>
        <View style={styles.notificationContainer}>
            <SystemNotification/>
        </View>
        <View style={styles.header}>
          <Text style={styles.mainText}>Login</Text>
          <Text style={styles.subText}>Jump back in!</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput autoCapitalize='none' value={email} onChangeText={(email) => setEmail(email)} placeholder='Email Address' style={[styles.input, Platform.OS === 'android' && { paddingVertical: 12 }]} />
          <TextInput autoCapitalize='none' value={password} onChangeText={(password) => setPassword(password)} secureTextEntry placeholder='Password' style={[styles.input,Platform.OS === 'android' && { paddingVertical: 12 }]} />
        </View>

        <View style={styles.continueContainer}>
          <TouchableOpacity onPress={handleLogin} style={styles.continueButton}>
            <Text style={styles.continueText}>Log In</Text>
            <Entypo name='chevron-right' size={20} color={appearanceMode.primary}/>
          </TouchableOpacity>
        </View>

        <View style={styles.navigateContainer}>
          <Text style={styles.navigateText}>Don't Have An Account?</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/RegisterScreen')}>
            <Text style={styles.navigateButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/ResetPasswordScreen')} style={styles.forgottenPasswordButton}>
            <Text style={styles.forgottenPasswordText}>Forgotten Password</Text>
          </TouchableOpacity>

        <View style={styles.footer}>

          { Platform.OS === 'android' && <TouchableOpacity style={styles.googleContainer}>
            <Image style={styles.footerImage} source={require('../../../assets/images/google.png')}/>
            <Text style={styles.googleText}>Continue With Google</Text>
          </TouchableOpacity>}

          { Platform.OS === 'ios' && <TouchableOpacity onPress={handleSignInWithApple} style={styles.appleContainer}>
            { appearanceMode.name === 'dark' && <Image style={styles.footerImage} source={require('../../../assets/images/applelightmode.png')}/>}
            { appearanceMode.name === 'light' && <Image style={styles.footerImage} source={require('../../../assets/images/appledarkmode.png')}/>}
            <Text style={styles.appleText}>Continue With Apple</Text>
          </TouchableOpacity>}
        </View>
      </View>
    )
}

export default Login

