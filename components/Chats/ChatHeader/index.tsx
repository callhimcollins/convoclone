import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { BlurView } from 'expo-blur'
import getStyles from './styles'
import { Entypo, Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { getUserData } from '@/state/features/userSlice'
import { supabase } from '@/lib/supabase'
import RemoteImage from '@/components/RemoteImage'
import { userType } from '@/types'
import { setShowModal } from '@/state/features/chatSlice'

const ChatHeader = () => {
  const gesture = Gesture.Pan()
  const convoData = useSelector((state:RootState) => state.chat.convo)
  const [userData, setUserData] = useState<userType>()
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
  const dispatch = useDispatch()
  const styles = getStyles(appearanceMode)
  const router = useRouter()

  const handleBackButton = () => {
    router.back()
  }

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase
      .from('Users')
      .select('*')
      .eq('user_id', convoData?.user_id)
      .single()
      if(!error) {
        setUserData(data)
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const handleProfileNavigation = () => {
    dispatch(getUserData(userData))
    if(userData) {
      router.push({
        pathname: '/(profile)/[profileID]',
        params: {
          profileID: String(userData?.user_id)
        }
      })
    }
  }

  const handleShowModal = () => {
    dispatch(setShowModal(true))
  }

  const renderHeader = () => {
    if(Platform.OS === 'android' || appearanceMode.name === 'light') {
      return <View style={[styles.container, { elevation: 10, backgroundColor: appearanceMode.backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleProfileNavigation} style={styles.usernameContainer}>
            <RemoteImage path={userData?.profileImage} style={styles.profileImage}/>
            <Text style={styles.username}>{ userData?.username }</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBackButton}>
            <Entypo name="chevron-left" size={26} color={appearanceMode.textColor} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShowModal} style={styles.convoStartContainer}>
            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.footerText}>{convoData.convoStarter}</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text>Keep Up</Text>
          </TouchableOpacity>
        </View>
    
      </View>
    } else {
      return <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'}  intensity={80} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleProfileNavigation} style={styles.usernameContainer}>
            <RemoteImage path={userData?.profileImage} style={styles.profileImage}/>
            <Text style={styles.username}>{ userData?.username }</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBackButton}>
            <Entypo name="chevron-left" size={26} color={appearanceMode.textColor} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShowModal} style={styles.convoStartContainer}>
            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.footerText}>{convoData.convoStarter}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShowModal}>
            <Feather name="more-vertical" size={26} color={appearanceMode.textColor} />
          </TouchableOpacity>
        </View>
      </BlurView>
    }
  }
  
  return (
    <GestureDetector gesture={gesture}>
      { renderHeader() }
    </GestureDetector>
   
  )
}

export default ChatHeader

