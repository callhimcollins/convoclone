import {
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Image,
  ScrollView,
  Platform,
} from 'react-native'
import getStyles from './styles'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { BlurView } from 'expo-blur'
import Animated, {
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SlideOutDown,
  FadeIn,
  withSpring,
  Easing,
} from 'react-native-reanimated'
import { toggleConvoStarterButton } from '@/state/features/navigationSlice'
import { Octicons } from '@expo/vector-icons'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { getConvoForChat, setReplyChat } from '@/state/features/chatSlice'
import * as ImagePicker from 'expo-image-picker'
import {
  setDialogue,
  setFileUploading,
  setPrivate,
} from '@/state/features/startConvoSlice'
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio'
import { VideoView, useVideoPlayer } from 'expo-video'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { convoType, fileType, userType } from '@/types'
import {
  setNotificationState,
  setSystemNotificationData,
  setSystemNotificationState,
} from '@/state/features/notificationSlice'
import UrlPreview from '../UrlPreview'
import { openai } from '@/lib/openAIInitializer'
import { sendPushNotification } from '@/pushNotifications'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height
const PICK_ACTION_DATA = ['Sing', 'Talk', 'Act', 'Write']

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

const LocalVideoPreview = ({
  uri,
  index,
  isPlaying,
  onPlay,
  onPause,
  styles,
  filesLength,
}: {
  uri: string
  index: number
  isPlaying: boolean
  onPlay: (index: number) => void
  onPause: (index: number) => void
  styles: any
  filesLength: number
}) => {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = true
  })

  const safePlayVideo = useCallback(() => {
    try {
      player?.play()
    } catch (error) {
      console.log('LocalVideoPreview safePlayVideo failed:', error)
    }
  }, [player])

  const safePauseVideo = useCallback(() => {
    try {
      player?.pause()
    } catch (error) {
      console.log('LocalVideoPreview safePauseVideo failed:', error)
    }
  }, [player])

  useEffect(() => {
    if (isPlaying) {
      safePlayVideo()
    } else {
      safePauseVideo()
    }
  }, [isPlaying, safePlayVideo, safePauseVideo])

  useEffect(() => {
    return () => {
      safePauseVideo()
    }
  }, [safePauseVideo])

  return (
    <View>
      <View style={styles.videoContainer}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => (isPlaying ? onPause(index) : onPlay(index))}
        >
          <BlurView style={styles.playButtonIcon}>
            <Image
              style={styles.playButtonImage}
              source={
                isPlaying
                  ? require('@/assets/images/pause.png')
                  : require('@/assets/images/play.png')
              }
            />
          </BlurView>
        </TouchableOpacity>
      </View>

      <VideoView
        player={player}
        style={[styles.video, filesLength === 1 && { width: DEVICE_WIDTH - 40 }]}
        nativeControls={false}
        contentFit="cover"
      />
    </View>
  )
}

const BottomSheet = () => {
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const convoStarterState = useSelector((state: RootState) => state.navigation.convoStarter)
  const authenticatedUserID = useSelector((state: RootState) => state.user.authenticatedUserID)
  const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
  const privateConvo = useSelector((state: RootState) => state.startConvo.private)
  const dialogue = useSelector((state: RootState) => state.startConvo.dialogue)

  const [files, setFiles] = useState<fileType[]>([])
  const [convoStarter, setConvoStarter] = useState('')
  const [filePaths, setFilePaths] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [linkURL, setLinkURL] = useState('')
  const [validURL, setValidURL] = useState(false)
  const [linkInputActive, setLinkInputActive] = useState(false)
  const [selectedAction, setSelectedAction] = useState('')
  const [dialogueCharacter, setDialogueCharacter] = useState('')
  const [currentPlayingVideoIndex, setCurrentPlayingVideoIndex] = useState<number | null>(null)
  const [recordingUri, setRecordingUri] = useState('')
  const [isRecordingState, setIsRecordingState] = useState(false)
  const [isPaused, setIsPaused] = useState(true)
  const [url, setUrl] = useState('')

  const dispatch = useDispatch()

  const height = files.length > 0 ? DEVICE_HEIGHT * 0.8 : DEVICE_HEIGHT * 0.55
  const styles = getStyles(appearanceMode, height)

  const mainInputInitialWidth = useSharedValue(DEVICE_WIDTH * 0.4)
  const recordButtonInitialWidth = useSharedValue(DEVICE_WIDTH * 0.4)
  const opacityForRecordButton = useSharedValue(1)
  const opacityForWidthInput = useSharedValue(1)
  const opacityForLinkInput = useSharedValue(0)
  const widthForLinkInput = useSharedValue(DEVICE_WIDTH * 0.8)
  const opacityForLinkButton = useSharedValue(1)
  const widthForLinkButton = useSharedValue(DEVICE_WIDTH * 0.9)
  const progressWidth = useSharedValue(0)
  const progressOpacity = useSharedValue(0)

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
  const audioLevel11 = useSharedValue(0.1)
  const audioLevel12 = useSharedValue(0.1)
  const audioLevel13 = useSharedValue(0.1)
  const audioLevel14 = useSharedValue(0.1)
  const audioLevel15 = useSharedValue(0.1)

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
      audioLevel11,
      audioLevel12,
      audioLevel13,
      audioLevel14,
      audioLevel15,
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
      audioLevel11,
      audioLevel12,
      audioLevel13,
      audioLevel14,
      audioLevel15,
    ]
  )

  const dialogueConversation = `Dialogue Robot ${selectedAction}s Like ${dialogueCharacter}`

  const player = useAudioPlayer(recordingUri ? { uri: recordingUri } : null)
  const playerStatus = useAudioPlayerStatus(player)

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
    if (status.metering !== undefined) {
      const level = Math.min(Math.max((status.metering + 160) / 160, 0), 1)

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
  })

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

  const convoData = {
    convoStarter: convoStarter === '' ? dialogueConversation : convoStarter,
    user_id: authenticatedUserID,
    userData: authenticatedUserData,
    files: filePaths,
    private: privateConvo,
    link: url,
    location,
    dialogue,
  }

  const animatedStylesForInput = useAnimatedStyle(() => ({
    width: mainInputInitialWidth.value,
    opacity: opacityForWidthInput.value,
  }))

  const animatedStylesForRecord = useAnimatedStyle(() => ({
    width: recordButtonInitialWidth.value,
    opacity: opacityForRecordButton.value,
  }))

  const animatedStylesForLinkButton = useAnimatedStyle(() => ({
    opacity: opacityForLinkButton.value,
    width: widthForLinkButton.value,
  }))

  const animatedStylesForLinkInput = useAnimatedStyle(() => ({
    opacity: opacityForLinkInput.value,
    width: widthForLinkInput.value,
  }))

  const animatedProgressBar = useAnimatedStyle(() => ({
    opacity: progressOpacity.value,
    width: `${progressWidth.value * 100}%`,
  }))

  const notify = (type: 'neutral' | 'error' | 'success', message: string) => {
    dispatch(setSystemNotificationState(true))
    dispatch(setSystemNotificationData({ type, message }))
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync()

      if (!permission.granted) {
        notify('error', 'Microphone permission is required.')
        return
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      })

      safePausePlayer()
      setIsPaused(true)

      await recorder.record()
      setIsRecordingState(true)
    } catch (error) {
      console.log('Failed To Start Recording', error)
      notify('error', 'Failed To Start Recording')
    }
  }

  const stopAndSaveRecording = async () => {
    try {
      await recorder.stop()

      const uri = recorder.uri

      if (uri) {
        setRecordingUri(uri)
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      })

      setIsPaused(true)
      setIsRecordingState(false)
    } catch (error) {
      console.error('Error stopping the recording:', error)
      notify('error', 'Error stopping the recording')
    }
  }

  const playRecording = async () => {
    if (!recordingUri) {
      notify('error', 'Nothing To Play')
      return
    }

    safeSeekPlayer(0)

    const played = safePlayPlayer()

    if (played) {
      setIsPaused(false)
    } else {
      notify('error', 'An Error Occurred')
    }
  }

  const pauseRecording = async () => {
    safePausePlayer()
    setIsPaused(true)
  }

  const pickAction = (action: string) => setSelectedAction(action)

  const addLinkButton = () => {
    setLinkInputActive(true)
    opacityForLinkInput.value = withTiming(1)
    widthForLinkInput.value = withTiming(DEVICE_WIDTH, { duration: 300 })
    opacityForLinkButton.value = withTiming(0)
    widthForLinkButton.value = withTiming(DEVICE_WIDTH * 0.9)
  }

  const extractLink = (link: string) => {
    const urlRegex = /(https?:\/\/)?([^\s]+)/i
    const match = link.match(urlRegex)

    if (match && match[0]) {
      let extractedUrl = match[0]

      if (!extractedUrl.startsWith('http://') && !extractedUrl.startsWith('https://')) {
        extractedUrl = 'https://' + extractedUrl
      }

      setUrl(extractedUrl)
      return true
    }

    setUrl('')
    return false
  }

  const handleUrlChange = (text: string) => {
    setLinkURL(text.toLowerCase())
    setValidURL(extractLink(text))
  }

  const togglePrivateButton = () => dispatch(setPrivate(!privateConvo))

  const sendNotificationToUsersKeepingUp = async (convoData: convoType) => {
    try {
      const { data } = await supabase
        .from('userKeepUps')
        .select('user_id')
        .eq('keepup_user_id', authenticatedUserData?.user_id)
        .limit(1000)

      if (data && data.length > 0) {
        const notifications = data.map((user) => ({
          sender_id: authenticatedUserData?.user_id,
          senderUserData: authenticatedUserData,
          receiver_id: user.user_id,
          type: 'convoforuserskeepingup',
          data: convoData,
        }))

        const { error: insertError } = await supabase.from('notifications').insert(notifications)

        if (!insertError) {
          const userIdsToGet = data.map((user) => user.user_id)

          const { data: userData } = await supabase
            .from('Users')
            .select('user_id, pushToken')
            .in('user_id', userIdsToGet)

          if (userData) {
            userData.map((user: userType) => {
              sendPushNotification(
                String(user?.pushToken),
                `${authenticatedUserData?.username} started a ${dialogue ? 'Dialogue' : 'Convo'}`,
                dialogue ? dialogueConversation : convoStarter,
                'convoStart',
                convoData,
                null,
                user?.user_id
              )
            })
          }
        }
      }
    } catch (error) {
      console.error('Error in sendNotificationToUsersKeepingUp:', error)
    }
  }

  const sendNotificationToUsersInPrivateCircle = async (user_id: string, convoData: convoType) => {
    try {
      const { error } = await supabase.from('notifications').insert({
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        receiver_id: user_id,
        type: 'convoforuserskeepingup',
        data: convoData,
      })

      if (!error) console.log('private convo notification sent successfully')
    } catch {}
  }

  const handleSendNotificationToUsersInPrivateCircle = async (convoData: convoType) => {
    try {
      const { data } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', authenticatedUserData?.user_id)
        .eq('type', 'invite')
        .eq('status', 'accepted')
        .eq('senderIsBlocked', false)

      if (data) {
        data.map((privateData) => {
          sendNotificationToUsersInPrivateCircle(privateData.receiver_id, convoData)
          sendPushNotification(
            String(privateData.senderUserData.pushToken),
            `${authenticatedUserData?.username} started a Private ${dialogue ? 'Dialogue' : 'Convo'}`,
            dialogue ? dialogueConversation : convoStarter,
            'convoStart',
            convoData,
            null,
            privateData.senderUserData.pushToken
          )
        })
      }

      const { data: data2 } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('receiver_id', authenticatedUserData?.user_id)
        .eq('type', 'requesttojoin')
        .eq('status', 'accepted')
        .eq('senderIsBlocked', false)

      if (data2) {
        data2.map((privateData: any) => {
          sendNotificationToUsersInPrivateCircle(privateData.sender_id, convoData)
          sendPushNotification(
            String(privateData.senderUserData.pushToken),
            `${authenticatedUserData?.username} started a Private ${dialogue ? 'Dialogue' : 'Convo'}`,
            dialogue ? dialogueConversation : convoStarter,
            'convoStart',
            convoData,
            privateData.senderUserData.user_id
          )
        })
      }
    } catch {}
  }

  const sendChatByRobot = async (convo_id: string, robot: any, robot_id: string) => {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You Are Dialogue Robot. Perform this role: ${convoData?.convoStarter}. Keep it chat-like and as natural as the role. Use Emojis When Necessary. !!! DO NOT DIVERT TO ANOTHER ROLE !!!. Keep your words to less than 100 words`,
        },
      ],
      model: 'gpt-3.5-turbo',
      max_tokens: 100,
    })

    const chatData = {
      convo_id,
      user_id: robot_id,
      content: chatCompletion.choices[0].message.content,
      files: null,
      audio: null,
      userData: robot,
    }

    const { data } = await supabase
      .from('Chats')
      .insert(chatData)
      .eq('convo_id', String(convo_id))
      .select()

    if (data) {
      await supabase.from('Convos').update({ lastChat: chatData }).eq('convo_id', String(convo_id)).select()
    }
  }

  const activateDialogueRobot = async (convo_id: string) => {
    const robotData = {
      user_id: convo_id,
      username: `Dialogue Robot-${convo_id}`,
      name: `Dialogue Robot`,
      bio: `I was created to talk in a room: ${dialogueConversation} created by ${authenticatedUserData?.username}`,
      profileImage: '',
      isRobot: true,
    }

    const { error } = await supabase.from('Users').insert(robotData).single()

    if (!error) {
      notify('neutral', 'Please Wait...')
      await sendChatByRobot(convo_id, robotData, robotData.user_id)
      dispatch(setNotificationState(false))
    }
  }

  const uploadFile = async (
    file: fileType,
    index: number,
    convo_id: string
  ): Promise<string | null> => {
    const extension = file.uri.split('.').pop()?.toLowerCase()
    const filepath = `Convos/${convo_id}/${index}.${extension}`

    let contentType: string

    if (['jpg', 'jpeg', 'png', 'webp'].includes(String(extension))) {
      contentType = `image/${extension === 'jpg' ? 'jpeg' : extension}`
    } else if (['mp4', 'mov', 'avi'].includes(String(extension))) {
      contentType = `video/${extension}`
    } else {
      throw new Error(`Unsupported file type: ${extension}`)
    }

    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    const arrayBuffer = decode(base64)

    const { error } = await supabase.storage.from('userfiles').upload(filepath, arrayBuffer, {
      contentType,
      cacheControl: '31536000',
      upsert: true,
    })

    if (error) throw error

    return filepath
  }

  const updateConvoFiles = async (convo_id: string, paths: string[]) => {
    const { error } = await supabase.from('Convos').update({ files: paths }).eq('convo_id', convo_id).single()

    if (!error) console.log('Files updated successfully')
    else console.log('Problem updating files', error.message)
  }

  const uploadFiles = async (convo_id: string) => {
    if (files.length === 0) return

    dispatch(setFileUploading(true))
    progressOpacity.value = withTiming(1)

    const newFilePaths: string[] = []

    for (let i = 0; i < files.length; i++) {
      try {
        const filepath = await uploadFile(files[i], i, convo_id)

        if (filepath) {
          newFilePaths.push(filepath)

          const newProgress = (i + 1) / files.length

          progressWidth.value = withTiming(newProgress, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        }
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }

    if (newFilePaths.length > 0) {
      setFilePaths(newFilePaths)
      await updateConvoFiles(convo_id, newFilePaths)
    }

    dispatch(setFileUploading(false))

    setTimeout(() => {
      progressWidth.value = withTiming(0)
      progressOpacity.value = withTiming(0)
    }, 3000)
  }

  const handleConvoStarter = async () => {
    if (convoStarter === '' && !(dialogueCharacter && selectedAction !== '')) {
      notify('neutral', 'Type or Record A Conversation Starter. No Dialogues Either.')
      return
    }

    try {
      const { data, error } = await supabase
        .from('Convos')
        .insert(convoData)
        .eq('user_id', String(authenticatedUserData?.user_id))
        .select()
        .single()

      if (error || !data) {
        console.log(error)
        return
      }

      dispatch(setReplyChat(null))
      dispatch(getConvoForChat(data))
      setLocation('')

      if (data.private === true) {
        if (data.dialogue === true) await activateDialogueRobot(data.convo_id)
        handleSendNotificationToUsersInPrivateCircle(data)
      } else {
        if (data.dialogue === true) await activateDialogueRobot(data.convo_id)
        sendNotificationToUsersKeepingUp(data)
      }

      if (files.length > 0) {
        notify(
          'neutral',
          `Please wait while your ${files.length === 1 ? 'file uploads' : 'files upload'}`
        )

        await uploadFiles(data.convo_id)
        await sleep(1200)

        router.push({
          pathname: '(chat)/[convoID]',
          params: { convoID: data.convo_id },
        })

        setConvoStarter('')
        setFiles([])
        dispatch(toggleConvoStarterButton())
        return
      }

      setConvoStarter('')
      router.push({
        pathname: '(chat)/[convoID]',
        params: { convoID: data.convo_id },
      })
      dispatch(setPrivate(false))
      dispatch(toggleConvoStarterButton())
    } catch (error) {
      console.log(error)
    }
  }

  const activateDialogue = async () => dispatch(setDialogue(!dialogue))

  const pickFiles = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions!')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      videoMaxDuration: 60,
      selectionLimit: 3,
    })

    if (!result.canceled) {
      if (result.assets.length > 3) {
        notify('error', 'You can only select up to 3 files.')
        return
      }

      setFiles(result.assets as fileType[])
      setCurrentPlayingVideoIndex(null)
    }
  }

  const playVideo = (index: number) => {
    setCurrentPlayingVideoIndex(index)
  }

  const pauseVideo = (index: number) => {
    if (currentPlayingVideoIndex === index) {
      setCurrentPlayingVideoIndex(null)
    }
  }

  const handleStartRecording = async () => {
    if (isRecordingState) {
      await stopAndSaveRecording()
    } else {
      recordButtonInitialWidth.value = withSpring(DEVICE_WIDTH * 0.9, {
        damping: 12,
        stiffness: 100,
        mass: 1,
        overshootClamping: false,
      })

      opacityForWidthInput.value = withTiming(0)
      mainInputInitialWidth.value = withTiming(0)

      await startRecording()
    }
  }

  const handleDeleteRecording = async () => {
    safePausePlayer()

    recordButtonInitialWidth.value = withSpring(DEVICE_WIDTH * 0.4, {
      damping: 12,
      stiffness: 100,
      mass: 1,
      overshootClamping: false,
    })

    opacityForWidthInput.value = withTiming(1)
    mainInputInitialWidth.value = withTiming(DEVICE_WIDTH * 0.4)

    setRecordingUri('')
    setIsPaused(true)
  }

  const handleCloseBottomSheet = async () => {
    dispatch(toggleConvoStarterButton())
    dispatch(setDialogue(false))
    dispatch(setPrivate(false))

    safePausePlayer()
    setCurrentPlayingVideoIndex(null)

    if (isRecordingState) await stopAndSaveRecording()
  }

  const sendConvoWithAudio = async () => {
    if (!recordingUri?.startsWith('file')) return

    if (authenticatedUserData) {
      const convoDataWithAudio = {
        convoStarter: 'Voice Note',
        user_id: authenticatedUserID,
        userData: authenticatedUserData,
        files: filePaths,
        private: privateConvo,
        link: linkURL,
        location,
        dialogue,
      }

      const { data: convoInsertData, error: convoInsertError } = await supabase
        .from('Convos')
        .insert(convoDataWithAudio)
        .select()
        .single()

      if (!convoInsertError && convoInsertData) {
        const base64 = await FileSystem.readAsStringAsync(recordingUri, {
          encoding: FileSystem.EncodingType.Base64,
        })

        const filepath = `Convos/${convoInsertData.convo_id}`
        const contentType = 'audio/mpeg'

        const { data } = await supabase.storage.from('userfiles').upload(filepath, decode(base64), {
          cacheControl: '31536000',
          upsert: true,
          contentType,
        })

        if (data) {
          notify(
            'neutral',
            `Please wait while your ${files.length === 1 ? 'file uploads' : 'files upload'}`
          )

          dispatch(getConvoForChat(convoInsertData))

          const { error: updateError } = await supabase
            .from('Convos')
            .update({ audio: filepath })
            .eq('convo_id', String(convoInsertData.convo_id))

          if (!updateError) {
            if (files.length > 0) {
              await uploadFiles(String(convoInsertData.convo_id))
              await sleep(1200)

              router.push({
                pathname: '(chat)/[convoID]',
                params: { convoID: convoInsertData.convo_id },
              })

              setFiles([])
              dispatch(toggleConvoStarterButton())
            } else {
              router.push({
                pathname: '(chat)/[convoID]',
                params: { convoID: String(convoInsertData.convo_id) },
              })

              dispatch(setPrivate(false))
              dispatch(toggleConvoStarterButton())
            }
          }
        }
      }
    }
  }

  const removeMedia = (file: fileType) => {
    setCurrentPlayingVideoIndex(null)
    setFiles((prev) => prev.filter((item) => item.assetId !== file.assetId && item.uri !== file.uri))
  }

  useEffect(() => {
    if (playerStatus.didJustFinish) {
      safeSeekPlayer(0)
      setIsPaused(true)
    }
  }, [playerStatus.didJustFinish, safeSeekPlayer])

  useEffect(() => {
    if (convoStarter !== '') {
      recordButtonInitialWidth.value = withTiming(0)
      opacityForRecordButton.value = withTiming(0)
      mainInputInitialWidth.value = withTiming(DEVICE_WIDTH * 0.9)
    } else {
      recordButtonInitialWidth.value = withTiming(DEVICE_WIDTH * 0.4)
      opacityForRecordButton.value = withTiming(1)
      mainInputInitialWidth.value = withTiming(DEVICE_WIDTH * 0.4)
    }
  }, [convoStarter])

  useEffect(() => {
    return () => {
      safePausePlayer()
      setCurrentPlayingVideoIndex(null)
    }
  }, [safePausePlayer])

  const renderContent = () => (
    <>
      <Animated.View style={[styles.progressBar, animatedProgressBar]} />

      <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerInfoContainer}>
            <Text style={styles.headerText}>What's on your mind today?</Text>

            <TouchableOpacity onPress={handleCloseBottomSheet}>
              <Text style={styles.headerText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.locationInputContainer}>
            <Octicons name="location" color={appearanceMode.faint} size={20} />

            <TextInput
              value={location}
              onChangeText={setLocation}
              style={styles.locationInput}
              placeholderTextColor={appearanceMode.faint}
              placeholder="Location"
            />
          </View>

          <View style={styles.mainContainer}>
            <Animated.View style={[animatedStylesForRecord, { display: convoStarter !== '' ? 'none' : 'flex' }]}>
              {!recordingUri && !isRecordingState && !dialogue && (
                <TouchableOpacity onPress={handleStartRecording} style={styles.recordButton}>
                  <Image source={require('../../assets/images/record.png')} style={styles.iconImage} />
                  <Text style={styles.recordText}>Record</Text>
                </TouchableOpacity>
              )}

              {recordingUri && !dialogue && (
                <View style={styles.afterRecordContainer}>
                  <TouchableOpacity onPress={isPaused ? playRecording : pauseRecording} style={styles.playRecord}>
                    <Text style={styles.playText}>{isPaused ? 'Play Recording' : 'Pause Recording'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteRecordingButton} onPress={handleDeleteRecording}>
                    <Image source={require('@/assets/images/bin.png')} style={styles.delete} />
                  </TouchableOpacity>
                </View>
              )}

              <View
                style={{
                  flexDirection: 'row',
                  width: DEVICE_WIDTH - 60,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Animated.View
                  style={[
                    styles.visualizer,
                    {
                      display: isRecordingState ? 'flex' : 'none',
                      width: '90%',
                    },
                  ]}
                >
                  {audioLevels.map((sharedValue, index) => (
                    <VisualizerBar key={index} sharedValue={sharedValue} styles={styles} />
                  ))}
                </Animated.View>

                {isRecordingState && (
                  <TouchableOpacity style={{ paddingVertical: 20 }} onPress={handleStartRecording}>
                    <Text
                      style={{
                        color: appearanceMode.textColor,
                        fontFamily: 'bold',
                        fontSize: 16,
                        marginLeft: 5,
                      }}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            {!dialogue && !recordingUri && (
              <Animated.View style={[animatedStylesForInput]}>
                <TextInput
                  value={convoStarter}
                  placeholderTextColor={appearanceMode.faint}
                  onChangeText={setConvoStarter}
                  style={[styles.mainInput]}
                  placeholder="Type Something..."
                />
              </Animated.View>
            )}
          </View>

          {!dialogue && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 25 }}>
              {!linkInputActive && (
                <Animated.View style={[styles.linkContainer, animatedStylesForLinkButton]}>
                  <TouchableOpacity onPress={addLinkButton} style={styles.addLinkButton}>
                    <Octicons name="link" color={appearanceMode.secondary} size={20} />
                    <Text style={styles.addLinkText}>Add Link</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {linkInputActive && (
                <Animated.View style={[styles.linkContainer, animatedStylesForLinkInput]}>
                  <TextInput
                    value={linkURL}
                    onChangeText={handleUrlChange}
                    style={styles.linkInput}
                    placeholder="Type/Paste Link"
                  />
                </Animated.View>
              )}
            </View>
          )}

          {!validURL && linkURL !== '' && <Text style={styles.urlInfo}>URL not valid</Text>}
          {validURL && linkURL !== '' && !dialogue && <UrlPreview url={`${url}`} />}

          {dialogue && (
            <View>
              <Text style={styles.pickRoleText}>Pick An Action</Text>

              <ScrollView
                horizontal
                contentContainerStyle={{ width: '100%', gap: 10, marginBottom: 20, marginTop: 10 }}
              >
                {PICK_ACTION_DATA.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => pickAction(action)}
                    style={selectedAction === action ? styles.actionButtonSelected : styles.actionButton}
                  >
                    <Text style={selectedAction === action ? styles.actionButtonTextSelected : styles.actionButtonText}>
                      {action}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Animated.View style={[animatedStylesForInput, { marginBottom: 15 }]}>
                <TextInput
                  value={dialogueCharacter}
                  placeholderTextColor={appearanceMode.faint}
                  onChangeText={setDialogueCharacter}
                  style={[styles.mainInput, { height: 40 }]}
                  placeholder="Type Character..."
                />
              </Animated.View>

              {selectedAction !== '' && dialogueCharacter !== '' && (
                <Text style={styles.dialogueCompletionText}>
                  Dialogue Robot {selectedAction}s Like {dialogueCharacter}
                </Text>
              )}

              {selectedAction !== '' && dialogueCharacter === '' && (
                <Text style={styles.dialogueCompletionText}>Dialogue Robot {selectedAction}s Like Who?</Text>
              )}
            </View>
          )}

          <View style={styles.mediaContainer}>
            {!dialogue && (
              <View style={styles.mediaLeft}>
                <TouchableOpacity onPress={pickFiles}>
                  {appearanceMode.name === 'light' && (
                    <Image style={styles.iconImage} source={require('../../assets/images/medialightmode.png')} />
                  )}

                  {appearanceMode.name === 'dark' && (
                    <Image style={styles.iconImage} source={require('../../assets/images/mediadarkmode.png')} />
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.specialContainer}>
              <TouchableOpacity onPress={togglePrivateButton} style={privateConvo ? styles.privateButtonSelected : styles.privateButton}>
                <Text style={[styles.privateText, privateConvo && { color: 'white' }]}>Private</Text>
              </TouchableOpacity>

              {!dialogue && !recordingUri && (
                <TouchableOpacity onPress={activateDialogue}>
                  {appearanceMode.name === 'dark' && (
                    <Image source={require('@/assets/images/dialoguerobotinactivedarkmode.png')} style={styles.dialogueRobot} />
                  )}

                  {appearanceMode.name === 'light' && (
                    <Image source={require('@/assets/images/dialoguerobotinactivelightmode.png')} style={styles.dialogueRobot} />
                  )}
                </TouchableOpacity>
              )}

              {dialogue && !recordingUri && (
                <TouchableOpacity onPress={activateDialogue}>
                  {appearanceMode.name === 'dark' && (
                    <Image source={require('@/assets/images/dialoguerobotactivedarkmode.png')} style={styles.dialogueRobot} />
                  )}

                  {appearanceMode.name === 'light' && (
                    <Image source={require('@/assets/images/dialoguerobotactivelightmode.png')} style={styles.dialogueRobot} />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {!dialogue && (
              <TouchableOpacity
                disabled={linkURL !== '' ? !validURL : validURL}
                onPress={recordingUri ? sendConvoWithAudio : handleConvoStarter}
              >
                <Text style={[styles.startConvoText, linkURL !== '' && { color: validURL ? appearanceMode.primary : appearanceMode.secondary }]}>
                  {privateConvo ? 'Start Private Convo' : 'Start Convo'}
                </Text>
              </TouchableOpacity>
            )}

            {dialogue && (
              <TouchableOpacity
                disabled={linkURL !== '' ? !validURL : validURL}
                onPress={recordingUri ? sendConvoWithAudio : handleConvoStarter}
              >
                <Text
                  style={[
                    styles.startConvoText,
                    { fontSize: privateConvo ? 13 : 14 },
                    linkURL !== '' && { color: validURL ? appearanceMode.primary : appearanceMode.secondary },
                  ]}
                >
                  {privateConvo ? 'Start Private Dialogue' : 'Start Dialogue'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: 20 }} horizontal>
            {files.map((file, index) => {
              if (file.type === 'image') {
                return (
                  <TouchableOpacity onPress={() => removeMedia(file)} key={`${file.uri}-${index}`}>
                    <Image source={{ uri: file.uri }} style={styles.image} />
                  </TouchableOpacity>
                )
              }

              if (file.type === 'video') {
                return (
                  <TouchableOpacity onPress={() => removeMedia(file)} key={`${file.uri}-${index}`}>
                    <LocalVideoPreview
                      uri={file.uri}
                      index={index}
                      isPlaying={currentPlayingVideoIndex === index}
                      onPlay={playVideo}
                      onPause={pauseVideo}
                      styles={styles}
                      filesLength={files.length}
                    />
                  </TouchableOpacity>
                )
              }

              return null
            })}
          </ScrollView>

          {files.length !== 0 && <Text style={styles.removeMediaText}>Tap Media To Remove</Text>}
        </View>
      </KeyboardAwareScrollView>
    </>
  )

  const renderBottomSheet = () => {
    if (Platform.OS === 'android') {
      return (
        <View style={[styles.backgroundContainer, { elevation: 10 }]}>
          <TouchableOpacity onPress={handleCloseBottomSheet} style={styles.close} />

          {convoStarterState && (
            <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.bottomSheetContainer]}>
              {renderContent()}
            </Animated.View>
          )}
        </View>
      )
    }

    return (
      <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.backgroundContainer}>
        <TouchableOpacity onPress={handleCloseBottomSheet} style={styles.close} />

        {convoStarterState && (
          <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.bottomSheetContainer]}>
            {renderContent()}
          </Animated.View>
        )}
      </BlurView>
    )
  }

  return <>{renderBottomSheet()}</>
}

export default BottomSheet