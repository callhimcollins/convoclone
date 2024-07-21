import { Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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
import { addToUserCache, getConvoForChat, setShowModal } from '@/state/features/chatSlice'
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av'
import { setAudioState } from '@/state/features/mediaSlice'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'

const ChatHeader = () => {
  const gesture = Gesture.Pan()
  const convoData = useSelector((state:RootState) => state.chat.convo)
  const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const [convoAudio, setConvoAudio] = useState<string | null>(null)
  const audioState = useSelector((state:RootState) => state.media.audioState)
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPaused, setIsPaused] = useState(true)
  const dispatch = useDispatch()
  const styles = getStyles(appearanceMode)
  const router = useRouter()

  const handleBackButton = () => {
    router.back()
  }

  const handleProfileNavigation = () => {
    dispatch(getUserData(convoData.userData || convoData.Users))
    if(convoData.userData || convoData.Users) {
      router.push({
        pathname: '/(profile)/[profileID]',
        params: {
          profileID: String(convoData.userData?.user_id || convoData.Users?.user_id)
        }
      })
    }
  }

  const handleShowModal = () => {
    dispatch(setShowModal(true))
  }

  const fetchConvoAudio = async () => {
    try {
      const { data } = await supabase.storage
      .from('userfiles')
      .getPublicUrl(String(convoData.audio));
      if(data) {
        setConvoAudio(data.publicUrl)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const playPauseAudio = async (audioType: 'profile' | 'convo', audioSource: string, convo_id?: string) => {
    if(convoData.audio) {
    try {
      // Configure audio session
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });
  
      // Stop all other playing sounds
      await Audio.setIsEnabledAsync(false);
      await Audio.setIsEnabledAsync(true);
  
      // Unload any existing sound
      if (sound) {
        // Check if switching between profile and chat
        if ((audioType === 'convo' && audioState.currentlyPlayingAudioID === 'profile') ||
            (audioType === 'profile' && audioState.currentlyPlayingAudioID !== 'profile')) {
          dispatch(setAudioState({ currentlyPlayingAudioID: audioType === 'convo' ? convo_id : 'profile', isPaused: true }));
          await sound.unloadAsync();
          setSound(null);
        } else if (audioType === 'convo' && audioState.currentlyPlayingAudioID !== convo_id) {
          await sound.unloadAsync();
          setSound(null);
        } else if ((audioType === 'convo' && audioState.currentlyPlayingAudioID === convo_id) ||
                   (audioType === 'profile' && audioState.currentlyPlayingAudioID === 'profile')) {
          if (isPaused) {
            await sound.playAsync();
            setIsPaused(false);
            dispatch(setAudioState({ currentlyPlayingAudioID: audioType === 'convo' ? convo_id : 'profile', isPaused: false }));
          } else {
            await sound.pauseAsync();
            setIsPaused(true);
            dispatch(setAudioState({ currentlyPlayingAudioID: audioType === 'convo' ? convo_id : 'profile', isPaused: true }));
          }
          return; // Exit the function here as we've handled the play/pause
        }
      }
  
      if (audioSource) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioSource },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPaused(false);
  
        if (audioType === 'convo' && convo_id) {
          dispatch(setAudioState({ currentlyPlayingAudioID: convo_id, isPaused: false }));
        }
  
        newSound.setOnPlaybackStatusUpdate(async (status: any) => {
          if (status.didJustFinish) {
            setIsPaused(true);
            await newSound.setPositionAsync(0);
            if (audioType === 'convo' && convo_id) {
              dispatch(setAudioState({ currentlyPlayingAudioID: convo_id, isPaused: true }));
            }
          }
        });
      } else {
        dispatch(setSystemNotificationState(true));
        dispatch(setSystemNotificationData({ type: 'neutral', message: 'Nothing To Play' }));
      }
    } catch (error) {
      dispatch(setSystemNotificationState(true));
      dispatch(setSystemNotificationData({ type: 'error', message: `An Error Occured` }));
    }}
    else {
      dispatch(setSystemNotificationState(true));
      dispatch(setSystemNotificationData({ type: 'neutral', message: 'This Convo Has No Audio' }));
    }
  };


  useEffect(() => {
    if(convoData.audio) {
      console.log('fetching audio')
      fetchConvoAudio()
    }
  }, [])

  const renderHeader = () => {
    if(Platform.OS === 'android' || appearanceMode.name === 'light') {
      return <View style={[styles.container, { elevation: 10, backgroundColor: appearanceMode.backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleProfileNavigation} style={styles.usernameContainer}>
            { convoData?.Users === undefined && <RemoteImage skeletonHeight={styles.profileImage.height} skeletonWidth={styles.profileImage.width} path={convoData.userData?.profileImage} style={styles.profileImage}/> }
            { convoData?.userData === undefined && <RemoteImage skeletonHeight={styles.profileImage.height} skeletonWidth={styles.profileImage.width} path={convoData.Users?.profileImage} style={styles.profileImage}/> }
            <Text style={styles.username}>{ convoData?.userData?.username || convoData?.Users?.username }</Text>
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
      </View>
    } else {
      return <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'}  intensity={80} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleProfileNavigation} style={styles.usernameContainer}>
            { convoData?.Users === undefined && <RemoteImage 
            skeletonHeight={styles.profileImage.height} 
            skeletonWidth={styles.profileImage.width} 
            path={convoData.userData?.profileImage} 
            style={styles.profileImage}
            /> }
            { convoData?.userData === undefined && <RemoteImage 
            skeletonHeight={styles.profileImage.height} 
            skeletonWidth={styles.profileImage.width} 
            path={convoData.Users?.profileImage} 
            style={styles.profileImage}/> }
            <Text style={styles.username}>{ convoData?.userData?.username || convoData?.Users?.username }</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBackButton}>
            <Entypo name="chevron-left" size={26} color={appearanceMode.textColor} />
          </TouchableOpacity>
          <TouchableOpacity onLongPress={() => playPauseAudio('convo', String(convoAudio), String(convoData?.convo_id))} onPress={handleShowModal} style={styles.convoStartContainer}>
            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.footerText}>{convoData?.convoStarter}</Text>
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

