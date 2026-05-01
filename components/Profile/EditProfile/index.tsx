import { Text, View, Image, TouchableOpacity, TextInput, Dimensions } from 'react-native'
import getStyles from './styles'
import { useDispatch, useSelector } from 'react-redux'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { RootState } from '@/state/store'
import EditProfileHeader from './EditProfileHeader'
import RemoteImage from '@/components/RemoteImage'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { supabase } from '@/lib/supabase'
import { setAuthenticatedUserData } from '@/state/features/userSlice'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import {
  setSystemNotificationData,
  setSystemNotificationState,
} from '@/state/features/notificationSlice'
import SystemNotification from '@/components/Notifications/SystemNotifications'
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

const inputContainerWidth = Dimensions.get('window').width

const inputFields = [
  'Change Username',
  'Edit Name',
  'Edit Bio',
  'Change Email',
  'Change Password',
]

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

const EditProfile = () => {
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)

  const [activeInputField, setActiveInputField] = useState<string>()
  const [username, setUsername] = useState<string>('')
  const [usernames, setUsernames] = useState<string[]>([])
  const [usernameExists, setUsernameExists] = useState(false)
  const [emails, setEmails] = useState<string[]>([])
  const [emailExists, setEmailExists] = useState(false)
  const [name, setName] = useState<string>('')
  const [bio, setBio] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [selectedProfileImage, setSelectedProfileImage] = useState<SelectedImageType | null>(null)
  const [selectedProfileBackground, setSelectedProfileBackground] =
    useState<SelectedImageType | null>(null)
  const [passwordMatch, setPasswordMatch] = useState(true)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [recordingUri, setRecordingUri] = useState('')
  const [isRecordingState, setIsRecordingState] = useState(false)
  const [isPaused, setIsPaused] = useState(true)

  const styles = getStyles(appearanceMode)
  const dispatch = useDispatch()

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  })

  const recorderState = useAudioRecorderState(audioRecorder, 100)
  const player = useAudioPlayer(null)
  const playerStatus = useAudioPlayerStatus(player)

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

  const inputContainerVisibility = useSharedValue(1)
  const inputContainerPosition = useSharedValue(0)
  const inputVisibility = useSharedValue(0)
  const inputPosition = useSharedValue(0)

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

  const recordContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: recordContainerHeight.value,
      opacity: recordContainerOpacity.value,
    }
  })

  const animatedInputContainer = useAnimatedStyle(() => {
    return {
      opacity: inputContainerVisibility.value,
      transform: [{ translateY: inputContainerPosition.value }],
    }
  })

  const animatedInputStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: inputPosition.value }],
      opacity: inputVisibility.value,
    }
  })

  const notify = (type: 'neutral' | 'error' | 'success', message: string) => {
    dispatch(setSystemNotificationState(true))
    dispatch(setSystemNotificationData({ type, message }))
  }

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!')
      return false
    }

    return true
  }

  const startRecording = async () => {
    try {
      notify('neutral', 'For The Best Experience, Keep Your Recording Short')

      const permission = await AudioModule.requestRecordingPermissionsAsync()

      if (!permission.granted) {
        notify('error', 'Microphone permission is required.')
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
    try {
      if (!recordingUri) {
        notify('error', 'Nothing To Play')
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
    } catch (error) {
      notify('error', 'An Error Occurred')
    }
  }

  const pauseRecording = async () => {
    try {
      if (playerStatus.playing) {
        const paused = safePausePlayer()

        if (paused) {
          setIsPaused(true)
        }
      }
    } catch (error) {
      console.error('Error pausing the recording:', error)
    }
  }

  const uploadImage = async () => {
    if (!selectedProfileImage?.uri?.startsWith('file')) {
      return
    }

    if (authenticatedUserData) {
      const base64 = await FileSystem.readAsStringAsync(selectedProfileImage.uri, {
        encoding: 'base64',
      })

      const filepath = `${authenticatedUserData?.username}-profileImage`
      const contentType = 'image/png'

      const { data, error } = await supabase.storage
        .from('userfiles')
        .upload(filepath, decode(base64), {
          cacheControl: '3600',
          upsert: true,
          contentType,
        })

      if (data) {
        const { error: updateError } = await supabase
          .from('Users')
          .update({ profileImage: `${authenticatedUserData.username}-profileImage` })
          .eq('user_id', String(authenticatedUserData?.user_id))
          .single()

        if (!updateError) {
          notify('success', 'Profile Image Updated. Update Will Not Reflect Instantly')
          return data.path
        }

        console.log('An Error Occured In uploadImage Under EditProfile', updateError.message)
      } else if (error) {
        notify('error', 'An Error Occured')
      }
    }
  }

  const removeProfileImage = async () => {
    const { error } = await supabase.storage
      .from('userfiles')
      .remove([`${authenticatedUserData?.username}-profileImage`])

    if (!error) {
      const { error: databaseError } = await supabase
        .from('Users')
        .update({ profileImage: 'blankprofile.png' })
        .eq('user_id', String(authenticatedUserData?.user_id))
        .single()

      if (!databaseError) {
        notify('success', 'Profile Image Removed. Update Will Not Reflect Instantly')
        router.back()
      } else {
        notify('error', 'An Error Occured')
      }
    }
  }

  const removeProfileBackgroundImage = async () => {
    const { error } = await supabase.storage
      .from('userfiles')
      .remove([`${authenticatedUserData?.username}-backgroundProfileImage`])

    if (!error) {
      const { error: databaseError } = await supabase
        .from('Users')
        .update({ backgroundProfileImage: 'profileBackgroundFallBack.jpeg' })
        .eq('user_id', String(authenticatedUserData?.user_id))
        .single()

      if (!databaseError) {
        notify('success', 'Background Image Removed. Update Will Not Reflect Instantly')
        router.back()
      } else {
        notify('error', 'An Error Occured')
      }
    }
  }

  const uploadProfileBackground = async () => {
    if (!selectedProfileBackground?.uri?.startsWith('file')) {
      return
    }

    if (authenticatedUserData) {
      const base64 = await FileSystem.readAsStringAsync(selectedProfileBackground.uri, {
        encoding: 'base64',
      })

      const filepath = `${authenticatedUserData.username}-backgroundProfileImage`
      const contentType = 'image/png'

      const { data, error } = await supabase.storage
        .from('userfiles')
        .upload(filepath, decode(base64), {
          cacheControl: '3600',
          upsert: true,
          contentType,
        })

      if (data) {
        const { error: updateError } = await supabase
          .from('Users')
          .update({ backgroundProfileImage: `${authenticatedUserData.username}-backgroundProfileImage` })
          .eq('user_id', String(authenticatedUserData?.user_id))

        if (!updateError) {
          notify('success', 'Image Updated. Update Will Not Reflect Instantly')
        } else {
          notify('error', 'An Error Occured')
        }
      } else if (error) {
        console.log('error uploading profile background', error.message)
      }
    }
  }

  const uploadAudioProfile = async () => {
    if (!recordingUri?.startsWith('file')) {
      return
    }

    if (authenticatedUserData) {
      const base64 = await FileSystem.readAsStringAsync(recordingUri, {
        encoding: 'base64',
      })

      const filepath = `${authenticatedUserData.username}-audioProfile`
      const contentType = 'audio/mpeg'

      const { data, error } = await supabase.storage
        .from('userfiles')
        .upload(filepath, decode(base64), {
          cacheControl: '3600',
          upsert: true,
          contentType,
        })

      if (data) {
        const { error: updateError } = await supabase
          .from('Users')
          .update({ audio: `${authenticatedUserData.username}-audioProfile` })
          .eq('user_id', String(authenticatedUserData?.user_id))

        if (!updateError) {
          console.log('Updated profile audio in database')
        } else {
          console.log("Couldn't update profile audio in database")
        }
      } else if (error) {
        console.log('error uploading profile audio', error.message)
      }
    }
  }

  const pickProfileImage = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
    })

    if (!result.canceled) {
      setSelectedProfileImage({
        uri: result.assets[0].uri || '',
        type: result?.assets[0]?.type || '',
      })
    }
  }

  const pickProfileBackground = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
    })

    if (!result.canceled) {
      setSelectedProfileBackground({
        uri: result.assets[0].uri || '',
        type: result?.assets[0]?.type || '',
      })
    }
  }

  const handleUsernameChange = (text: string) => {
    const filteredText = text.replace(/\s/g, '')
    setUsername(filteredText.toLowerCase())
  }

  const setAllUsernames = async () => {
    try {
      const { data, error } = await supabase.from('Users').select('username')

      if (data) {
        setUsernames(data.map((username) => username.username))
      }

      if (error) {
        console.log(error)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const setAllEmails = async () => {
    try {
      const { data, error } = await supabase.from('Users').select('email')

      if (data) {
        setEmails(data.map((user) => user.email))
      }

      if (error) {
        console.log(error)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const checkUsername = () => {
    if (username === '') return

    const usernameFiltered = usernames.filter((item) => item !== authenticatedUserData?.username)
    const usernameCheck = usernameFiltered.includes(String(username))

    setUsernameExists(usernameCheck)
  }

  const checkEmail = () => {
    if (email === '') return

    const emailFiltered = emails.filter((item) => item !== authenticatedUserData?.email)
    const emailCheck = emailFiltered.includes(String(email))

    setEmailExists(emailCheck)
  }

  const toggleInputContainer = (index: number) => {
    setActiveInputField(inputFields[index])

    inputContainerVisibility.value = withTiming(0)
    inputVisibility.value = withTiming(1)
    inputContainerPosition.value = withTiming(inputContainerWidth)
    inputPosition.value = withTiming(-150)
  }

  const handleDone = () => {
    inputContainerVisibility.value = withTiming(1)
    inputContainerPosition.value = withTiming(0)
    inputPosition.value = withTiming(0)
    inputVisibility.value = withTiming(0)
  }

  const handleSaveChanges = async () => {
    try {
      if (bio !== '') {
        const { error } = await supabase
          .from('Users')
          .update({ bio })
          .eq('user_id', authenticatedUserData?.user_id)
          .single()

        if (error) console.log('Error updating bio', error.message)
      }

      if (name !== '') {
        const { error } = await supabase
          .from('Users')
          .update({ name })
          .eq('user_id', authenticatedUserData?.user_id)
          .single()

        if (error) console.log('Error updating name', error.message)
      }

      if (username !== '') {
        if (username === authenticatedUserData?.username) {
          return
        }

        const { error } = await supabase
          .from('Users')
          .update({ username })
          .eq('user_id', authenticatedUserData?.user_id)
          .single()

        if (error) console.log('Error updating username', error.message)
      }

      if (email !== '') {
        const { error } = await supabase.auth.updateUser({ email })
        if (error) console.log('Error updating email', error.message)
      }

      if (password !== '') {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) console.log('Error updating password', error.message)
      }

      if (selectedProfileImage !== null) {
        await uploadImage()
      }

      if (selectedProfileBackground !== null) {
        await uploadProfileBackground()
      }

      if (recordingUri !== '') {
        await uploadAudioProfile()
      }
    } catch (error) {
      console.log(error)
    } finally {
      const { data, error } = await supabase
        .from('Users')
        .select('*')
        .eq('user_id', authenticatedUserData?.user_id)
        .single()

      if (!error) {
        dispatch(setAuthenticatedUserData(data))
        router.back()
      }
    }
  }

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible)
  }

  useEffect(() => {
    setAllUsernames()
    setAllEmails()
  }, [])

  useEffect(() => {
    checkUsername()
  }, [username])

  useEffect(() => {
    checkEmail()
  }, [email])

  useEffect(() => {
    setPasswordMatch(password === confirmPassword)
  }, [password, confirmPassword])

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
      <EditProfileHeader />

      <View style={styles.notificationContainer}>
        <SystemNotification />
      </View>

      <KeyboardAwareScrollView style={styles.contentContainer}>
        <View>
          <View style={styles.profileBackgroundImageContainer}>
            <TouchableOpacity
              onPress={pickProfileBackground}
              style={styles.profileBackgroundImageButton}
            >
              <Text style={styles.profileBackgroundImageButtonText}>Change</Text>
            </TouchableOpacity>

            {!selectedProfileBackground && (
              <RemoteImage
                skeletonHeight={styles.profileBackgroundImage.height}
                skeletonWidth={Dimensions.get('window').width * 0.95}
                style={styles.profileBackgroundImage}
                path={authenticatedUserData?.backgroundProfileImage}
              />
            )}

            {selectedProfileBackground && (
              <Image
                style={styles.profileBackgroundImage}
                source={{ uri: selectedProfileBackground.uri }}
              />
            )}
          </View>

          <TouchableOpacity
            onPress={removeProfileBackgroundImage}
            style={[
              styles.removeImageButton,
              { marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
            ]}
          >
            <Text style={styles.removeImageButtonText}>Remove Image</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileImageContainer}>
          <View>
            <TouchableOpacity onPress={pickProfileImage} style={styles.profileImageButton}>
              <Text style={styles.profileImageButtonText}>Change</Text>
            </TouchableOpacity>

            {!selectedProfileImage && (
              <RemoteImage
                skeletonHeight={styles.profileImage.height}
                skeletonWidth={styles.profileImage.width}
                style={styles.profileImage}
                path={`${authenticatedUserData?.username}-profileImage`}
              />
            )}

            {selectedProfileImage && (
              <Image style={styles.profileImage} source={{ uri: selectedProfileImage.uri }} />
            )}
          </View>

          <TouchableOpacity onPress={removeProfileImage} style={styles.removeImageButton}>
            <Text style={styles.removeImageButtonText}>Remove Image</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.audioContainer}>
          {isPaused && (
            <TouchableOpacity onPress={playRecording} style={styles.playButtonContainer}>
              <View style={styles.playButton}>
                <Image
                  style={styles.playButtonImage}
                  source={require('@/assets/images/play.png')}
                />
              </View>

              <Text style={styles.playButtonText}>Play Audio Profile</Text>
            </TouchableOpacity>
          )}

          {!isPaused && (
            <TouchableOpacity onPress={pauseRecording} style={styles.playButtonContainer}>
              <View style={styles.playButton}>
                <Image
                  style={styles.playButtonImage}
                  source={require('@/assets/images/pause.png')}
                />
              </View>

              <Text style={styles.playButtonText}>Pause Audio Profile</Text>
            </TouchableOpacity>
          )}

          <View style={{ flexDirection: 'row', gap: 5 }}>
            <TouchableOpacity onPress={startRecording} style={styles.changeAudioProfileButton}>
              <Text style={styles.changeAudioProfileButtonText}>
                {isRecordingState ? 'Listening...' : 'Change Audio Profile'}
              </Text>
            </TouchableOpacity>

            {isRecordingState && (
              <TouchableOpacity
                onPress={stopAndSaveRecording}
                style={styles.changeAudioProfileButton}
              >
                <Image style={styles.playButtonImage} source={require('@/assets/images/stop.png')} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Animated.View style={[styles.visualizer, recordContainerAnimatedStyle]}>
          {audioLevels.map((sharedValue, index) => (
            <VisualizerBar key={index} sharedValue={sharedValue} styles={styles} />
          ))}
        </Animated.View>

        <Animated.View style={[styles.textInputContaniner, animatedInputContainer]}>
          {inputFields.map((input, index) => (
            <TouchableOpacity
              onPress={() => toggleInputContainer(index)}
              style={styles.inputButton}
              key={index}
            >
              <Text style={styles.inputButtonText}>{input}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {activeInputField === 'Change Username' && (
          <View>
            <Animated.View style={[styles.inputMainContainer, animatedInputStyle]}>
              <TextInput
                value={username}
                placeholderTextColor="gray"
                onChangeText={handleUsernameChange}
                style={styles.textInput}
                placeholder={String(authenticatedUserData?.username)}
              />

              {!usernameExists && (
                <View>
                  <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}

              {usernameExists && (
                <Text style={styles.usernameExistsText}>Username Exists</Text>
              )}
            </Animated.View>
          </View>
        )}

        {activeInputField === 'Edit Name' && (
          <Animated.View style={[styles.inputMainContainer, animatedInputStyle]}>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.textInput}
              placeholder={String(authenticatedUserData?.name) || 'Edit Name'}
            />

            <View>
              <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {activeInputField === 'Edit Bio' && (
          <Animated.View style={[styles.inputMainContainer, animatedInputStyle]}>
            <TextInput
              value={bio}
              onChangeText={setBio}
              style={styles.textInput}
              placeholder={String(authenticatedUserData?.bio) || 'Edit Bio'}
            />

            <View>
              <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {activeInputField === 'Change Email' && (
          <Animated.View style={[styles.inputMainContainer, animatedInputStyle]}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.textInput}
              placeholder={activeInputField}
            />

            {!emailExists && (
              <View>
                <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {emailExists && (
              <Text style={{ color: appearanceMode.textColor, fontFamily: 'extrabold' }}>
                Email Exists With Another Account
              </Text>
            )}
          </Animated.View>
        )}

        {activeInputField === 'Change Password' && (
          <Animated.View style={[animatedInputStyle]}>
            <View style={[styles.inputMainContainer]}>
              <TextInput
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                style={styles.textInput}
                placeholder={activeInputField}
              />

              <TextInput
                secureTextEntry={!passwordVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.textInput}
                placeholder="Confirm Password"
              />

              <TouchableOpacity onPress={togglePasswordVisibility}>
                {passwordVisible ? (
                  <Image
                    style={{ width: 35, height: 35 }}
                    source={require('@/assets/images/passwordunlock.png')}
                  />
                ) : (
                  <Image
                    style={{ width: 35, height: 35 }}
                    source={require('@/assets/images/passwordlock.png')}
                  />
                )}
              </TouchableOpacity>
            </View>

            <View style={{ marginHorizontal: 20, transform: [{ translateY: -40 }] }}>
              {!passwordMatch && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <Text style={styles.passwordsDontMatchText}>Passwords Don't Match</Text>

                  <TouchableOpacity
                    onPress={handleDone}
                    style={[
                      styles.removeImageButton,
                      { justifyContent: 'center', paddingHorizontal: 20 },
                    ]}
                  >
                    <Text style={styles.removeImageButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              )}

              {passwordMatch && (
                <View>
                  <TouchableOpacity
                    onPress={handleDone}
                    style={[styles.doneButton, { justifyContent: 'center', alignItems: 'center' }]}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </KeyboardAwareScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default EditProfile