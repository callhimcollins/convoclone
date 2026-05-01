import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Gesture, GestureDetector, TextInput } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import {
  addToBotContext,
  addToInputState,
  setReplyChat,
  setChatFiles,
} from '@/state/features/chatSlice'
import { openai } from '@/lib/openAIInitializer'
import { sendPushNotification } from '@/pushNotifications'
import { useDebouncedCallback } from 'use-debounce'
import { ChatCompletionMessageParam } from 'openai/resources'
import * as ImagePicker from 'expo-image-picker'
import {
  setSystemNotificationData,
  setSystemNotificationState,
} from '@/state/features/notificationSlice'
import { decode } from 'base64-arraybuffer'
import * as FileSystem from 'expo-file-system'
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio'

const BOT_COOLDOWN = 5000

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

const ChatFooter = () => {
  const gesture = Gesture.Pan()
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
  const convoData = useSelector((state: RootState) => state.chat.convo)
  const replyChat = useSelector((state: RootState) => state.chat.replyChat)
  const contextForBotState = useSelector((state: RootState) => state.chat.contextForBotState)
  const inputStateForConvo = useSelector((state: RootState) => state.chat.inputState)
  const convoExists = useSelector((state: RootState) => state.chat.convoExists)

  const styles = getStyles(appearanceMode)
  const dispatch = useDispatch()
  const { convoID } = useLocalSearchParams()

  const [keyboardPaddingBottom, setKeyboardPaddingBottom] = useState(23)
  const [activeUsers, setActiveUsers] = useState<Array<string>>([])
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState<string>()
  const [lastBotResponseTime, setLastBotResponseTime] = useState(0)
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

  const audioLevels = Array(10)
    .fill(0)
    .map(() => useSharedValue(0.1))

  const initialKeyboardWidth = convoData.dialogue
    ? Dimensions.get('window').width * 0.7
    : Dimensions.get('window').width * 0.5

  const expansionWidth = useSharedValue(initialKeyboardWidth)
  const recordContainerHeight = useSharedValue(0)
  const recordContainerOpacity = useSharedValue(0)

  const recordContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: recordContainerHeight.value,
      opacity: recordContainerOpacity.value,
    }
  })

  const keyboardExpansionAnimation = useAnimatedStyle(() => {
    return {
      width: expansionWidth.value,
    }
  })

  const chatData = useMemo(
    () => ({
      convo_id: convoID,
      user_id: authenticatedUserData?.user_id,
      content,
      files: null,
      audio: null,
      replyChat,
    }),
    [convoID, authenticatedUserData, content, replyChat]
  )

  const robotData = useMemo(
    () => ({
      user_id: convoID,
      username: `Dialogue Robot-${convoID}`,
      name: `Dialogue Robot`,
      bio: `I was created to talk in room: ${convoData?.convoStarter}`,
      profileImage: '',
      isRobot: true,
    }),
    [convoID, convoData?.convoStarter]
  )

  const notificationDataForReplyChat = {
    sender_id: authenticatedUserData?.user_id,
    senderUserData: authenticatedUserData,
    receiver_id: replyChat?.user_id,
    data: chatData,
    type: 'reply',
    convo: convoData,
  }

  const notify = (type: 'neutral' | 'error', message: string) => {
    dispatch(setSystemNotificationState(true))
    dispatch(setSystemNotificationData({ type, message }))
  }

  const isContentEmpty = (text: string) => {
    return !text || text.trim() === ''
  }

  const sendChatByRobot = async (
    convo_id: string,
    robot: any,
    robot_id: string,
    content: string
  ) => {
    const robotChatData = {
      convo_id,
      user_id: robot_id,
      content,
      files: null,
      audio: null,
      userData: robot,
    }

    const { error } = await supabase.from('Chats').insert([robotChatData]).select()

    if (!error) {
      const { error } = await supabase
        .from('Convos')
        .update({ lastChat: chatData })
        .eq('convo_id', String(convo_id))
        .select()

      if (error) {
        console.log("Couldn't update last chat by robot", error.message)
      }
    } else {
      console.log("Couldn't send chat", error.message)
    }
  }

  const completeBotResponse = useDebouncedCallback(
    async (messages: ChatCompletionMessageParam[]) => {
      try {
        const systemMessage: ChatCompletionMessageParam = {
          role: 'system',
          content: `You Are Dialogue Robot. Be The Character In This Role: ${convoData?.convoStarter}. Keep it as natural as the character in the role. Use Emojis Only When ABSOLUTELY Necessary. !!! DO NOT DIVERT TO ANOTHER ROLE !!!. Treat usernames as their own individual character and only mention their usernames when ABSOLUTELY NECESSARY. Make sure to keep your words to less than 50 words`,
        }

        const chatCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [systemMessage, ...messages],
          max_tokens: 100,
        })

        const botResponse = chatCompletion.choices[0].message.content

        await sendChatByRobot(String(convoID), robotData, `${convoID}`, String(botResponse))
      } catch (error) {
        console.error('Error in completeBotResponse:', error)
      }
    },
    1000,
    { maxWait: 5000 }
  )

  const updateConvoLastChat = async () => {
    const { error } = await supabase
      .from('Convos')
      .update({ lastChat: chatData })
      .eq('convo_id', String(convoID))
      .select()

    if (error) {
      console.log(error.message)
    }
  }

  const sendNotificationForReplyChatInApp = async () => {
    if (!replyChat) return

    if (activeUsers.includes(replyChat.user_id)) {
      return
    }

    const { data } = await supabase
      .from('blockedUsers')
      .select('*')
      .eq('user_id', replyChat.user_id)
      .eq('blockedUserID', String(authenticatedUserData?.user_id))
      .single()

    if (data) {
      return
    }

    const { error } = await supabase.from('notifications').insert([notificationDataForReplyChat]).single()

    if (!error) {
      const { data } = await supabase
        .from('Users')
        .select('pushToken')
        .eq('user_id', replyChat.user_id)
        .single()

      if (data && authenticatedUserData) {
        sendPushNotification(
          String(data.pushToken),
          `${authenticatedUserData?.username} replied to your chat in: ${convoData.convoStarter}`,
          String(content),
          'reply',
          convoData,
          {
            user_id: authenticatedUserData.user_id,
            username: authenticatedUserData.username,
            content,
            convo_id: convoData.convo_id,
          },
          replyChat.user_id
        )
      }
    } else {
      console.log('Send notification error', error.message)
    }
  }

  const sendChat = async () => {
    if (isContentEmpty(String(content))) {
      return
    }

    if (content) {
      dispatch(addToBotContext({ role: 'user', content }))

      const { data, error } = await supabase
        .from('Chats')
        .insert([chatData])
        .eq('convo_id', String(convoID))
        .select(
          `
          *,
          Users (
            user_id,
            username,
            profileImage,
            isRobot
          )
        `
        )
        .single()

      if (!error) {
        setContent('')
        updateConvoLastChat()
        dispatch(addToInputState({ [convoID as string]: null }))

        if (convoData.dialogue) {
          if (!data.Users.isRobot) {
            const newChatForRobot = {
              role: 'user',
              content:
                replyChat && replyChat.username.includes('Dialogue Robot')
                  ? `I'm(${authenticatedUserData?.name?.split(' ')[0]}) replying to your chat: ${replyChat.content}, reply to my own chat: ${content} using my reply and the past messages up until the reply to your chat as context. Don't Start Your Reply With "Dialogue Robot: "`
                  : `${authenticatedUserData?.name?.split(' ')[0]}: ${content}. Don't Start Your Reply With "Dialogue Robot: "`,
            }

            const now = Date.now()

            if (now - lastBotResponseTime > BOT_COOLDOWN) {
              completeBotResponse([...contextForBotState, newChatForRobot])
              setLastBotResponseTime(now)
            }
          }
        }

        if (replyChat) {
          sendNotificationForReplyChatInApp()
          dispatch(setReplyChat(null))
        }
      } else {
        console.log('Error inserting chat:', error.message)
      }
    }
  }

  const handleKeyPress = () => {}

  const pickFiles = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      videoMaxDuration: 60,
      selectionLimit: 2,
    })

    if (!result.canceled) {
      if (result.assets.length > 2) {
        notify('error', 'You can only select up to 4 files.')
        return
      }

      dispatch(setChatFiles(result.assets))

      router.push({
        pathname: '/(chat)/WithMediaScreen',
        params: { convoID },
      })
    }
  }

  const startRecording = async () => {
    try {
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
    setKeyboardPaddingBottom(23)

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

  const handleRecording = async () => {
    if (isRecordingState || recorderState.isRecording) {
      await stopAndSaveRecording()
    } else {
      await startRecording()
    }
  }

  const handlePlayPause = async () => {
    if (isPaused) {
      await playRecording()
    } else {
      await pauseRecording()
    }
  }

  const clearRecording = () => {
    safePausePlayer()
    setRecordingUri('')
    setIsPaused(true)
  }

  const sendAudio = async () => {
    if (!recordingUri?.startsWith('file')) {
      return
    }

    if (authenticatedUserData) {
      const chatAudioData = {
        convo_id: convoID,
        user_id: authenticatedUserData?.user_id,
        content: replyChat?.content ? `Voice reply to ${replyChat.username}` : `Voice Note`,
        files: null,
        audio: null,
        replyChat,
      }

      const { data: chatInsertData, error: chatInsertError } = await supabase
        .from('Chats')
        .insert(chatAudioData)
        .select('chat_id')
        .single()

      if (!chatInsertError) {
        const base64 = await FileSystem.readAsStringAsync(recordingUri, {
          encoding: 'base64',
        })

        const filepath = `Chats/${chatInsertData.chat_id}`
        const contentType = 'audio/mpeg'

        const { data, error } = await supabase.storage
          .from('userfiles')
          .upload(filepath, decode(base64), {
            cacheControl: '31536000',
            upsert: true,
            contentType,
          })

        if (data) {
          console.log('Uploaded in database')

          const { error: updateError } = await supabase
            .from('Chats')
            .update({ audio: filepath })
            .eq('chat_id', String(chatInsertData.chat_id))

          if (!updateError) {
            console.log('Audio uploaded in database')
            clearRecording()
            setContent('')
          } else {
            console.log('Could not upload audio in database', updateError.message)
          }
        } else if (error) {
          console.log('error uploading audio', error.message)
        }
      } else {
        console.log('Could not insert chat data', chatInsertError.message)
      }
    }
  }

  useEffect(() => {
    const userState = {
      user_id: authenticatedUserData?.user_id,
      username: authenticatedUserData?.username,
    }

    const chatChannel = supabase.channel(`custom-checkusers-channel-${convoID}`)

    chatChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = chatChannel.presenceState()
        const usersInRoom = Object.values(newState)
        const activeUserIDList = usersInRoom.flatMap((user) => user)

        setActiveUsers(activeUserIDList.map((userID: any) => userID.user_id))
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') {
          chatChannel.untrack()
          console.log('Status changed')
          return
        }

        const presenceTrackStatus = await chatChannel.track(userState)
        console.log('user tracking...', presenceTrackStatus)
      })

    return () => {
      chatChannel.unsubscribe()
    }
  }, [convoID, authenticatedUserData])

  useEffect(() => {
    if (!content) {
      expansionWidth.value = withTiming(initialKeyboardWidth, { duration: 300 })
      setExpanded(false)
    } else {
      expansionWidth.value = withTiming(
        convoData.dialogue_robot
          ? Dimensions.get('window').width * 0.9
          : Dimensions.get('window').width * 0.8,
        { duration: 300 }
      )
      setExpanded(true)
    }
  }, [content])

  useEffect(() => {
    if (inputStateForConvo[convoID as string]) {
      setContent(inputStateForConvo[convoID as string])
    }
  }, [])

  useEffect(() => {
    if (content) {
      dispatch(addToInputState({ [convoID as string]: content }))
    }
  }, [content])

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
  }, [safePausePlayer])

  const renderVisualizer = (extraStyle?: any) => {
    return (
      <Animated.View style={[styles.visualizer, recordContainerAnimatedStyle, extraStyle]}>
        {audioLevels.map((sharedValue, index) => (
          <VisualizerBar key={index} sharedValue={sharedValue} styles={styles} />
        ))}
      </Animated.View>
    )
  }

  const renderAudioPreview = () => {
    if (!recordingUri || isRecordingState) return null

    return (
      <View style={styles.audioPlayContainer}>
        <View style={styles.innerAudioPlayContainer}>
          <TouchableOpacity onPress={handlePlayPause}>
            <Image
              style={styles.playButtonImage}
              source={
                isPaused
                  ? require('@/assets/images/play.png')
                  : require('@/assets/images/pause.png')
              }
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={clearRecording}>
            <Ionicons name="close" size={38} color="white" />
          </TouchableOpacity>

          <TouchableOpacity onPress={sendAudio} style={styles.sendAudioButton}>
            <Text style={styles.sendAudioText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderChatFooter = () => {
    if (Platform.OS === 'android') {
      return (
        <KeyboardAvoidingView style={{ position: 'absolute', bottom: 0, width: '100%' }}>
          {replyChat && replyChat.convo_id === convoID && (
            <View style={styles.replyChatContainer}>
              <View style={styles.replyHeaderContainer}>
                <Text style={styles.replyTextHeader}>
                  Replying to{' '}
                  <Text style={styles.replyUsername}>{replyChat.username.split('-')[0]}</Text>
                </Text>

                <TouchableOpacity onPress={() => dispatch(setReplyChat(null))}>
                  <AntDesign color={appearanceMode.textColor} name="close" size={25} />
                </TouchableOpacity>
              </View>

              <Text numberOfLines={3} ellipsizeMode="tail" style={styles.replyChat}>
                {replyChat.content}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.container,
              {
                paddingBottom: keyboardPaddingBottom,
                backgroundColor: appearanceMode.backgroundColor,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.inputContainer,
                keyboardExpansionAnimation,
                {
                  borderWidth: 1,
                  borderColor: appearanceMode.faint,
                },
              ]}
            >
              <TextInput
                multiline
                value={content}
                onChangeText={setContent}
                onKeyPress={handleKeyPress}
                onBlur={() => setKeyboardPaddingBottom(23)}
                onFocus={() => setKeyboardPaddingBottom(5)}
                style={styles.textInput}
                placeholderTextColor={appearanceMode.secondary}
                placeholder="Type something..."
              />

              {expanded && (
                <TouchableOpacity disabled={convoExists === false} onPress={sendChat}>
                  <Text
                    style={[
                      styles.sendText,
                      convoExists === false && { color: appearanceMode.secondary },
                    ]}
                  >
                    Send
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>

            {renderVisualizer()}

            <View style={styles.middleContainer}>
              {!expanded && (
                <TouchableOpacity
                  onPress={handleRecording}
                  disabled={convoExists === false}
                  style={[
                    styles.recordButton,
                    convoExists === false && {
                      backgroundColor: appearanceMode.secondary,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="microphone" color="white" size={24} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={pickFiles}
              disabled={convoExists === false}
              style={styles.attachButton}
            >
              <Ionicons
                name="attach"
                color={convoExists === false ? appearanceMode.secondary : appearanceMode.textColor}
                size={24}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )
    }

    return (
      <View>
        {replyChat && replyChat.convo_id === convoID && (
          <Animated.View style={styles.replyChatContainer}>
            <View style={styles.replyHeaderContainer}>
              <Text style={styles.replyTextHeader}>
                Replying to{' '}
                <Text style={styles.replyUsername}>{replyChat.username.split('-')[0]}</Text>
              </Text>

              <TouchableOpacity onPress={() => dispatch(setReplyChat(null))}>
                <AntDesign color={appearanceMode.textColor} name="close" size={25} />
              </TouchableOpacity>
            </View>

            <Text numberOfLines={3} ellipsizeMode="tail" style={styles.replyChat}>
              {replyChat.content}
            </Text>
          </Animated.View>
        )}

        <BlurView
          tint={appearanceMode.name === 'light' ? 'light' : 'dark'}
          intensity={80}
          style={[styles.container, { paddingBottom: keyboardPaddingBottom }]}
        >
          <Animated.View
            style={[
              styles.inputContainer,
              keyboardExpansionAnimation,
              !isRecordingState &&
                !recordingUri && {
                  borderWidth: 1,
                  borderColor: appearanceMode.faint,
                },
            ]}
          >
            {!isRecordingState && !recordingUri && (
              <TextInput
                multiline
                value={content}
                onChangeText={setContent}
                onKeyPress={handleKeyPress}
                onBlur={() => setKeyboardPaddingBottom(23)}
                onFocus={() => setKeyboardPaddingBottom(5)}
                blurOnSubmit={false}
                style={styles.textInput}
                placeholder="Type something..."
                placeholderTextColor={appearanceMode.faint}
              />
            )}

            {renderVisualizer({ display: isRecordingState ? 'flex' : 'none' })}

            {renderAudioPreview()}

            {expanded && (
              <TouchableOpacity disabled={convoExists === false} onPress={sendChat}>
                <Text
                  style={[
                    styles.sendText,
                    convoExists === false && { color: appearanceMode.secondary },
                  ]}
                >
                  Send
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {!convoData.dialogue && (
            <View style={styles.middleContainer}>
              {!expanded && (
                <TouchableOpacity
                  onPress={handleRecording}
                  disabled={convoExists === false}
                  style={[
                    styles.recordButton,
                    convoExists === false && {
                      backgroundColor: appearanceMode.secondary,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="microphone" color="white" size={24} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {!convoData.dialogue && (
            <TouchableOpacity
              onPress={pickFiles}
              style={styles.attachButton}
              disabled={convoExists === false}
            >
              <Ionicons
                name="attach"
                color={convoExists === false ? appearanceMode.secondary : appearanceMode.textColor}
                size={24}
              />
            </TouchableOpacity>
          )}
        </BlurView>
      </View>
    )
  }

  return (
    <GestureDetector gesture={gesture}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {renderChatFooter()}
      </KeyboardAvoidingView>
    </GestureDetector>
  )
}

export default ChatFooter