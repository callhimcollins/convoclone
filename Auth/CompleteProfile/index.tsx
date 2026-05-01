import {
  Image,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { Link, router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { setAuthenticatedUserData } from '@/state/features/userSlice'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {
  setSystemNotificationData,
  setSystemNotificationState,
} from '@/state/features/notificationSlice'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio'

interface SelectedImageType {
  uri: string
  type: string
}

const CompleteProfile = () => {
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const userId = useSelector((state: RootState) => state.user.authenticatedUserID)
  const dispatch = useDispatch()

  const [bio, setBio] = useState('')
  const [selectedImage, setSelectedImage] = useState<SelectedImageType | null>(null)
  const [recordingUri, setRecordingUri] = useState('')
  const [isPaused, setIsPaused] = useState(true)

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  })

  const recorderState = useAudioRecorderState(audioRecorder, 100)
  const player = useAudioPlayer(null)
  const playerStatus = useAudioPlayerStatus(player)

  const audioLevels = Array(10)
    .fill(0)
    .map(() => useSharedValue(0.1))

  const recordContainerHeight = useSharedValue(0)
  const recordContainerOpacity = useSharedValue(0)

  const styles = getStyles(appearanceMode)

  const safePausePlayer = () => {
    try {
      player?.pause()
    } catch {}
  }

  const safeReplacePlayer = (uri: string) => {
    try {
      player?.replace(uri)
    } catch {}
  }

  const safePlayPlayer = () => {
    try {
      player?.play()
    } catch {}
  }

  const safeSeekPlayer = (seconds: number) => {
    try {
      player?.seekTo(seconds)
    } catch {}
  }

  const animatedRecordContainerstyle = useAnimatedStyle(() => {
    return {
      height: recordContainerHeight.value,
      opacity: recordContainerOpacity.value,
    }
  })

  const notify = (type: 'neutral' | 'error', message: string) => {
    dispatch(setSystemNotificationState(true))
    dispatch(setSystemNotificationData({ type, message }))
  }

  const requestImagePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!')
      return false
    }

    return true
  }

  const updateAudioVisualizer = (metering?: number | null) => {
    const safeMetering = typeof metering === 'number' ? metering : -120
    const level = Math.min(Math.max((safeMetering + 160) / 160, 0), 1)

    audioLevels.forEach((sharedValue) => {
      if (Math.random() > 0.5) {
        const newValue = Math.max(Math.random() * (level + 0.2), 0.1)

        sharedValue.value = withSpring(newValue, {
          damping: 10,
          stiffness: 80,
        })
      }
    })
  }

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync()

      if (!permission.granted) {
        Alert.alert('Permission required', 'Microphone permission is needed to record audio.')
        return
      }

      safePausePlayer()
      setIsPaused(true)

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      })

      await audioRecorder.prepareToRecordAsync()
      audioRecorder.record()

      setRecordingUri('')

      recordContainerHeight.value = withTiming(50)
      recordContainerOpacity.value = withTiming(1)
    } catch (error) {
      console.log('Failed To Start Recording', error)
      notify('error', 'Failed To Start Recording')
    }
  }

  const stopAndSaveRecording = async () => {
    try {
      if (!recorderState.isRecording) return

      await audioRecorder.stop()

      const uri = audioRecorder.uri

      if (uri) {
        setRecordingUri(uri)
        safeReplacePlayer(uri)
        setIsPaused(true)
      }

      recordContainerHeight.value = withTiming(0)
      recordContainerOpacity.value = withTiming(0)

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      })
    } catch (error) {
      console.error('Error stopping the recording:', error)
      notify('error', 'Error stopping the recording')
    }
  }

  const playRecording = async () => {
    try {
      if (!recordingUri) {
        notify('neutral', 'Nothing To Play')
        return
      }

      if (playerStatus.playing) {
        return
      }

      safeReplacePlayer(recordingUri)
      safePlayPlayer()
      setIsPaused(false)
    } catch (error) {
      console.log(error)
      notify('error', 'An Error Occurred')
    }
  }

  const pauseRecording = async () => {
    if (playerStatus.playing) {
      safePausePlayer()
      setIsPaused(true)
    }
  }

  const deleteRecording = async () => {
    safePausePlayer()
    setRecordingUri('')
    setIsPaused(true)
  }

  const pickImage = async () => {
    const hasPermission = await requestImagePermissions()
    if (!hasPermission) return

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
    }

    const result = await ImagePicker.launchImageLibraryAsync(options)

    if (!result.canceled) {
      setSelectedImage({
        uri: result.assets[0].uri || '',
        type: result.assets[0].type || '',
      })
    }
  }

  const uploadImage = async () => {
    if (!selectedImage?.uri?.startsWith('file')) {
      return
    }

    const username = await AsyncStorage.getItem('username')

    if (username) {
      const base64 = await FileSystem.readAsStringAsync(selectedImage.uri, {
        encoding: 'base64',
      })

      const filepath = `${username}-profileImage`
      const contentType = 'image/png'

      const { data } = await supabase.storage
        .from('userfiles')
        .upload(filepath, decode(base64), {
          contentType,
          cacheControl: '31536000',
          upsert: true,
        })

      if (data) {
        return data.path
      }

      notify('error', 'Failed To Upload Image')
    }
  }

  const uploadAudioProfile = async () => {
    if (!recordingUri?.startsWith('file')) {
      return
    }

    const username = await AsyncStorage.getItem('username')

    if (username && recordingUri) {
      const base64 = await FileSystem.readAsStringAsync(recordingUri, {
        encoding: 'base64',
      })

      const filepath = `${username}-audioProfile`
      const contentType = 'audio/mpeg'

      const { data, error } = await supabase.storage
        .from('userfiles')
        .upload(filepath, decode(base64), {
          cacheControl: '3600',
          upsert: true,
          contentType,
        })

      if (data) {
        console.log('Uploaded in database')

        const { error: updateError } = await supabase
          .from('Users')
          .update({ audio: `${username}-audioProfile` })
          .eq('user_id', String(userId))

        if (!updateError) {
          console.log('Updated profile audio in database')
        } else {
          console.log("Couldn't update profile audio in database")
        }
      } else if (error) {
        console.log('error uploading profile audio', error.message)
      }
    } else {
      console.log('No Audio')
    }
  }

  const dispatchUserData = async () => {
    const { data, error } = await supabase
      .from('Users')
      .select('*')
      .eq('user_id', String(userId))
      .single()

    if (data) {
      dispatch(setAuthenticatedUserData(data))
    } else if (error) {
      console.log("Couldn't set user")
    }
  }

  const handleCompleteProfile = async () => {
    try {
      if (selectedImage) {
        const username = await AsyncStorage.getItem('username')

        try {
          const imageUpload = await uploadImage()

          if (imageUpload) {
            const { error } = await supabase
              .from('Users')
              .update({ profileImage: `${username}-profileImage` })
              .eq('user_id', String(userId))

            if (!error) {
              console.log('image updated in db successfully')
            }
          }
        } catch (error) {
          console.log(error)
          return
        }
      }

      if (bio !== '') {
        try {
          const { error } = await supabase
            .from('Users')
            .update({ bio })
            .eq('user_id', String(userId))
            .select()

          if (error) {
            return
          }

          console.log('Profile completed')
        } catch (error) {
          console.log(error)
          return
        }
      }

      await uploadAudioProfile()
      await dispatchUserData()
      router.replace('/(tabs)/')
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (recorderState.isRecording) {
      updateAudioVisualizer(recorderState.metering)
    }
  }, [recorderState.isRecording, recorderState.metering])

  useEffect(() => {
    if (!playerStatus.playing && !isPaused) {
      const finished =
        playerStatus.duration > 0 &&
        Math.abs(playerStatus.duration - playerStatus.currentTime) < 0.3

      if (finished) {
        safeSeekPlayer(0)
        setIsPaused(true)
      }
    }
  }, [playerStatus.playing, playerStatus.currentTime, playerStatus.duration])

  useEffect(() => {
    return () => {
      safePausePlayer()
    }
  }, [])

  return (
    // render body stays the same
  )
}

export default CompleteProfile