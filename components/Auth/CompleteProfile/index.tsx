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
import React, { useCallback, useEffect, useMemo, useState } from 'react'
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

const VisualizerBar = ({ sharedValue, styles }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    const height = Math.max(sharedValue.value * 50, 5)

    return {
      height,
      backgroundColor: `rgba(98, 95, 224, ${Math.max(sharedValue.value, 0.2)})`,
    }
  })

  return <Animated.View entering={FadeIn} style={[styles.bar, animatedStyle]} />
}

const CompleteProfile = () => {
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const userId = useSelector((state: RootState) => state.user.authenticatedUserID)

  const dispatch = useDispatch()
  const styles = getStyles(appearanceMode)

  const [bio, setBio] = useState('')
  const [selectedImage, setSelectedImage] = useState<SelectedImageType | null>(null)
  const [recordingUri, setRecordingUri] = useState('')
  const [isRecordingState, setIsRecordingState] = useState(false)
  const [isPaused, setIsPaused] = useState(true)

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  })

  const recorderState = useAudioRecorderState(audioRecorder, 100)
  const player = useAudioPlayer(null)
  const playerStatus = useAudioPlayerStatus(player)

  const audioLevel1 = useSharedValue(0.1)
  const audioLevel2 = useSharedValue(0.1)
  const audioLevel3 = useSharedValue(0.1)
  const audioLevel4 = useSharedValue(0.1)
  const audioLevel5 = useSharedValue(0.1)
  const audioLevel6 = useSharedValue(0.1)
  const audioLevel7 = useSharedValue(0.1)
  const audioLevel8 = useSharedValue(0.1)
  const audioLevel9 = useSharedValue(0.1)
  const audioLevel10 = useSharedValue(0.1)

  const audioLevels = useMemo(
    () => [
      audioLevel1,
      audioLevel2,
      audioLevel3,
      audioLevel4,
      audioLevel5,
      audioLevel6,
      audioLevel7,
      audioLevel8,
      audioLevel9,
      audioLevel10,
    ],
    [
      audioLevel1,
      audioLevel2,
      audioLevel3,
      audioLevel4,
      audioLevel5,
      audioLevel6,
      audioLevel7,
      audioLevel8,
      audioLevel9,
      audioLevel10,
    ]
  )

  const recordContainerHeight = useSharedValue(0)
  const recordContainerOpacity = useSharedValue(0)

  const safePausePlayer = useCallback(() => {
    try {
      player?.pause()
      return true
    } catch (error) {
      console.log('safePausePlayer failed:', error)
      return false
    }
  }, [player])

  const safePlayPlayer = useCallback(() => {
    try {
      player?.play()
      return true
    } catch (error) {
      console.log('safePlayPlayer failed:', error)
      return false
    }
  }, [player])

  const safeReplacePlayer = useCallback(
    (uri: string) => {
      try {
        player?.replace(uri)
        return true
      } catch (error) {
        console.log('safeReplacePlayer failed:', error)
        return false
      }
    },
    [player]
  )

  const safeSeekPlayer = useCallback(
    (seconds: number) => {
      try {
        player?.seekTo(seconds)
        return true
      } catch (error) {
        console.log('safeSeekPlayer failed:', error)
        return false
      }
    },
    [player]
  )

  const animatedRecordContainerstyle = useAnimatedStyle(() => {
    return {
      height: recordContainerHeight.value,
      opacity: recordContainerOpacity.value,
    }
  })

  const notify = useCallback(
    (type: 'neutral' | 'error', message: string) => {
      dispatch(setSystemNotificationState(true))
      dispatch(setSystemNotificationData({ type, message }))
    },
    [dispatch]
  )

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!')
      return false
    }

    return true
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
      setIsRecordingState(true)

      recordContainerHeight.value = withTiming(50)
      recordContainerOpacity.value = withTiming(1)
    } catch (error) {
      console.log('Failed To Start Recording', error)
      notify('error', 'Failed To Start Recording')
    }
  }

  const stopAndSaveRecording = async () => {
    if (!recorderState.isRecording) return

    try {
      await audioRecorder.stop()

      const uri = audioRecorder.uri

      if (uri) {
        setRecordingUri(uri)
        safeReplacePlayer(uri)
        setIsPaused(true)
      }

      setIsRecordingState(false)

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
    if (!recordingUri) {
      notify('neutral', 'Nothing To Play')
      return
    }

    const replaced = safeReplacePlayer(recordingUri)

    if (!replaced) {
      notify('error', 'An Error Occurred')
      return
    }

    const played = safePlayPlayer()

    if (played) {
      setIsPaused(false)
    } else {
      notify('error', 'An Error Occurred')
    }
  }

  const pauseRecording = async () => {
    if (playerStatus.playing) {
      const paused = safePausePlayer()

      if (paused) {
        setIsPaused(true)
      }
    }
  }

  const deleteRecording = async () => {
    safePausePlayer()
    setRecordingUri('')
    setIsPaused(true)
  }

  const pickImage = async () => {
    const hasPermission = await requestPermissions()
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
      const metering = recorderState.metering ?? -120
      const level = Math.min(Math.max((metering + 160) / 160, 0), 1)

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
  }, [recorderState.isRecording, recorderState.metering, audioLevels])

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
  }, [
    playerStatus.playing,
    playerStatus.currentTime,
    playerStatus.duration,
    isPaused,
    safeSeekPlayer,
  ])

  useEffect(() => {
    return () => {
      safePausePlayer()
    }
  }, [safePausePlayer])

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Complete Profile</Text>

        <Text style={styles.subHeaderText}>
          Add audio to create an{' '}
          <Link style={styles.link} href={'/(auth)/AudioProfileInfoScreen'}>
            Audio Profile
          </Link>
        </Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.contentTop}>
          <View>
            {selectedImage && <Image style={styles.image} source={{ uri: selectedImage.uri }} />}

            {!selectedImage && (
              <Image style={styles.image} source={require('@/assets/images/blankprofile.png')} />
            )}

            <TouchableOpacity onPress={pickImage} style={styles.imageOverlayContainer}>
              <Text style={styles.imageOverlayText}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recordingContainer}>
            {!isRecordingState && (
              <TouchableOpacity onPress={startRecording} style={styles.recordButton}>
                <Text style={styles.buttonText}>Record Audio</Text>
              </TouchableOpacity>
            )}

            {isRecordingState && (
              <TouchableOpacity onPress={stopAndSaveRecording} style={styles.recordButton}>
                <Text style={styles.buttonText}>Stop Recording</Text>
              </TouchableOpacity>
            )}

            {recordingUri && (
              <View style={styles.mediaActionContainer}>
                {isPaused && (
                  <TouchableOpacity onPress={playRecording} style={styles.mediaButton}>
                    <Image source={require('@/assets/images/play.png')} style={styles.iconImage} />
                    <Text style={styles.mediaText}>Play</Text>
                  </TouchableOpacity>
                )}

                {!isPaused && (
                  <TouchableOpacity onPress={pauseRecording} style={styles.mediaButton}>
                    <Image source={require('@/assets/images/pause.png')} style={styles.iconImage} />
                    <Text style={styles.mediaText}>Pause</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={deleteRecording} style={styles.deleteButton}>
                  <Image source={require('@/assets/images/bin.png')} style={styles.iconImage} />
                </TouchableOpacity>
              </View>
            )}

            <Animated.View style={[styles.visualizer, animatedRecordContainerstyle]}>
              {audioLevels.map((sharedValue, index) => (
                <VisualizerBar key={index} sharedValue={sharedValue} styles={styles} />
              ))}
            </Animated.View>
          </View>
        </View>

        <View style={styles.bioContainer}>
          <TextInput
            placeholderTextColor={appearanceMode.faint}
            value={bio}
            onChangeText={setBio}
            placeholder="Write a Bio"
            style={styles.bioInput}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.footer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity onPress={handleCompleteProfile} style={styles.createProfileButton}>
          <Text style={styles.createProfileText}>Create Profile</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  )
}

export default CompleteProfile