import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  ScrollView,
} from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from '@/components/Chats/ChatFooter/styles'
import { AntDesign, Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import {
  addToInputState,
  setChatFiles,
  setReplyChat,
} from '@/state/features/chatSlice'
import { sendPushNotification } from '@/pushNotifications'
import { setFileUploading, setFiles } from '@/state/features/startConvoSlice'
import { decode } from 'base64-arraybuffer'
import { fileType } from '@/types'
import * as FileSystem from 'expo-file-system'
import { VideoView, useVideoPlayer } from 'expo-video'
import {
  setSystemNotificationData,
  setSystemNotificationState,
} from '@/state/features/notificationSlice'
import SystemNotification from '../Notifications/SystemNotifications'

interface VideoPlayingProps {
  index: number | null
  playing: boolean
}

interface VideoPreviewProps {
  uri: string
  index: number
  height: number
  isPlaying: boolean
  onPress: () => void
}

const DEVICE_WIDTH = Dimensions.get('window').width

const VideoPreview = ({ uri, height, isPlaying, onPress }: VideoPreviewProps) => {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = true
  })

  const safePlay = React.useCallback(() => {
    try {
      player?.play()
    } catch (error) {
      console.log('safe video play failed:', error)
    }
  }, [player])

  const safePause = React.useCallback(() => {
    try {
      player?.pause()
    } catch (error) {
      console.log('safe video pause failed:', error)
    }
  }, [player])

  useEffect(() => {
    if (isPlaying) {
      safePlay()
    } else {
      safePause()
    }
  }, [isPlaying, safePlay, safePause])

  useEffect(() => {
    return () => {
      safePause()
    }
  }, [safePause])

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity
        onPress={onPress}
        style={{
          position: 'absolute',
          zIndex: 100,
          backgroundColor: 'black',
          borderRadius: 15,
        }}
      >
        <BlurView style={{ padding: 20, borderRadius: 15, overflow: 'hidden' }}>
          {isPlaying ? (
            <Image
              source={require('../../assets/images/pause.png')}
              style={{ width: 30, height: 30 }}
            />
          ) : (
            <Image
              source={require('../../assets/images/play.png')}
              style={{ width: 30, height: 30 }}
            />
          )}
        </BlurView>
      </TouchableOpacity>

      <VideoView
        player={player}
        style={{
          width: DEVICE_WIDTH - 20,
          height,
          borderRadius: 15,
        }}
        nativeControls={false}
      />
    </View>
  )
}

const WithMedia = () => {
  const gesture = Gesture.Pan()
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
  const convoData = useSelector((state: RootState) => state.chat.convo)
  const replyChat = useSelector((state: RootState) => state.chat.replyChat)
  const inputStateForConvo = useSelector((state: RootState) => state.chat.inputState)
  const convoExists = useSelector((state: RootState) => state.chat.convoExists)
  const files = useSelector((state: RootState) => state.chat.chatFiles)

  const styles = getStyles(appearanceMode)
  const dispatch = useDispatch()
  const { convoID } = useLocalSearchParams()

  const [keyboardPaddingBottom, setKeyboardPaddingBottom] = useState(23)
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState<string>('')
  const [filePaths, setFilePaths] = useState<string[]>([])
  const [videoPlaying, setVideoPlaying] = useState<VideoPlayingProps>({
    index: null,
    playing: false,
  })

  const initialKeyboardWidth = Dimensions.get('window').width * 0.6
  const expansionWidth = useSharedValue(initialKeyboardWidth)
  const progressWidth = useSharedValue(0)
  const progressOpacity = useSharedValue(0)

  const chatData = useMemo(
    () => ({
      convo_id: convoID,
      user_id: authenticatedUserData?.user_id,
      content: !content ? 'Media' : content,
      files: null,
      audio: null,
      replyChat,
    }),
    [convoID, authenticatedUserData?.user_id, content, replyChat]
  )

  const notificationDataForReplyChat = {
    sender_id: authenticatedUserData?.user_id,
    senderUserData: authenticatedUserData,
    receiver_id: replyChat?.user_id,
    data: chatData,
    type: 'reply',
    convo: convoData,
  }

  const animatedProgressBar = useAnimatedStyle(() => ({
    opacity: progressOpacity.value,
    width: `${progressWidth.value * 100}%`,
  }))

  const keyboardExpansionAnimation = useAnimatedStyle(() => ({
    width: expansionWidth.value,
  }))

  const handleVideoPlaying = (index: number) => {
    setVideoPlaying((prev) => {
      if (prev.index === index) {
        return {
          index,
          playing: !prev.playing,
        }
      }

      return {
        index,
        playing: true,
      }
    })
  }

  const sendNotificationForReplyChatInApp = async () => {
    if (!replyChat) return

    if (
      activeUsers.includes(replyChat.user_id) ||
      replyChat.user_id === authenticatedUserData?.user_id
    ) {
      return
    }

    const { data } = await supabase
      .from('blockedUsers')
      .select('*')
      .eq('user_id', replyChat.user_id)
      .eq('blockedUserID', String(authenticatedUserData?.user_id))
      .single()

    if (data) return

    const { error } = await supabase
      .from('notifications')
      .insert([notificationDataForReplyChat])
      .single()

    if (!error) {
      const { data } = await supabase
        .from('Users')
        .select('pushToken')
        .eq('user_id', replyChat.user_id)
        .single()

      if (data && authenticatedUserData) {
        sendPushNotification(
          String(data.pushToken),
          `${authenticatedUserData.username} replied to your chat in: ${convoData.convoStarter}`,
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
    }
  }

  const updateConvoLastChat = async () => {
    const { error } = await supabase
      .from('Convos')
      .update({ lastChat: chatData })
      .eq('convo_id', String(convoID))
      .select()

    if (error) console.log(error.message)
  }

  const updateChatFiles = async (chat_id: string, paths: string[]) => {
    const { error } = await supabase
      .from('Chats')
      .update({ files: paths })
      .eq('chat_id', chat_id)
      .single()

    if (!error) console.log('Files updated successfully')
  }

  const uploadFile = async (
    file: fileType,
    index: number,
    chat_id: string
  ): Promise<string | null> => {
    const extension = file.uri.split('.').pop()?.toLowerCase()
    const filepath = `Chats/${chat_id}/${index}.${extension}`

    let contentType: string

    if (['jpg', 'jpeg', 'png', 'webp'].includes(String(extension))) {
      contentType = `image/${extension}`
    } else if (['mp4', 'mov', 'avi'].includes(String(extension))) {
      contentType = 'video/mp4'
    } else {
      throw new Error(`Unsupported file type: ${extension}`)
    }

    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: 'base64',
    })

    const arrayBuffer = decode(base64)

    const { error } = await supabase.storage
      .from('userfiles')
      .upload(filepath, arrayBuffer, {
        contentType,
        cacheControl: '31536000',
        upsert: true,
      })

    if (error) throw error

    return filepath
  }

  const uploadFiles = async (chat_id: string) => {
    if (files.length === 0) return

    dispatch(setFileUploading(true))
    progressOpacity.value = withTiming(1)

    const newFilePaths: string[] = []

    for (let i = 0; i < files.length; i++) {
      try {
        const filepath = await uploadFile(files[i], i, chat_id)

        if (filepath) {
          newFilePaths.push(filepath)

          progressWidth.value = withTiming((i + 1) / files.length, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        }
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }

    setFilePaths((prev) => {
      const updatedFilePaths = [...prev, ...newFilePaths]
      updateChatFiles(chat_id, updatedFilePaths)
      return updatedFilePaths
    })

    dispatch(setFileUploading(false))

    setTimeout(() => {
      progressWidth.value = withTiming(0)
      progressOpacity.value = withTiming(0)
    }, 2000)
  }

  const sendChat = async () => {
    const { data, error } = await supabase
      .from('Chats')
      .insert([chatData])
      .eq('convo_id', String(convoID))
      .select(`*, Users (user_id, username, profileImage, isRobot)`)
      .single()

    if (!error) {
      if (replyChat) {
        sendNotificationForReplyChatInApp()
        dispatch(setReplyChat(null))
      }

      dispatch(setSystemNotificationState(true))
      dispatch(
        setSystemNotificationData({
          type: 'neutral',
          message: `Please wait while your ${
            files.length === 1 ? 'file uploads' : 'files upload'
          }`,
        })
      )

      await uploadFiles(data.chat_id)

      setContent('')
      updateConvoLastChat()
      dispatch(addToInputState({ [convoID as string]: null }))
      dispatch(setChatFiles([]))
      router.back()
    } else {
      console.log('Error inserting chat:', error.message)
    }
  }

  const handleClose = () => {
    setVideoPlaying({ index: null, playing: false })
    dispatch(setFiles([]))
    dispatch(setChatFiles([]))
    router.back()
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
          return
        }

        await chatChannel.track(userState)
      })

    return () => {
      chatChannel.unsubscribe()
    }
  }, [convoID, authenticatedUserData?.user_id, authenticatedUserData?.username])

  useEffect(() => {
    if (!content) {
      expansionWidth.value = withTiming(initialKeyboardWidth, { duration: 300 })
      setExpanded(false)
    } else {
      expansionWidth.value = withTiming(Dimensions.get('window').width * 0.8, {
        duration: 300,
      })
      setExpanded(true)
    }
  }, [content, expansionWidth, initialKeyboardWidth])

  useEffect(() => {
    const savedInput = inputStateForConvo[convoID as string]

    if (savedInput) {
      setContent(savedInput)
    }
  }, [])

  useEffect(() => {
    dispatch(addToInputState({ [convoID as string]: content || null }))
  }, [content, convoID, dispatch])

  useEffect(() => {
    return () => {
      setVideoPlaying({ index: null, playing: false })
    }
  }, [])

  const renderChatFooter = () => {
    if (Platform.OS === 'android') {
      return (
        <KeyboardAvoidingView
          style={{ position: 'absolute', bottom: 0, width: '100%' }}
        >
          {replyChat && replyChat.convo_id === convoID && (
            <View
              style={[
                styles.replyChatContainer,
                { backgroundColor: 'rgb(180, 180, 180)' },
              ]}
            >
              <View style={styles.replyHeaderContainer}>
                <Text style={styles.replyTextHeader}>
                  Replying to{' '}
                  <Text style={styles.replyUsername}>
                    {replyChat.username.split('-')[0]}
                  </Text>
                </Text>

                <TouchableOpacity onPress={() => dispatch(setReplyChat(null))}>
                  <AntDesign
                    color={appearanceMode.textColor}
                    name="close"
                    size={25}
                  />
                </TouchableOpacity>
              </View>

              <Text
                numberOfLines={3}
                ellipsizeMode="tail"
                style={styles.replyChat}
              >
                {replyChat.content}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.container,
              { paddingBottom: keyboardPaddingBottom, backgroundColor: 'black' },
            ]}
          >
            <Animated.View style={[styles.inputContainer, keyboardExpansionAnimation]}>
              <TextInput
                value={content}
                onChangeText={setContent}
                onBlur={() => setKeyboardPaddingBottom(23)}
                onFocus={() => setKeyboardPaddingBottom(5)}
                style={styles.textInput}
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

            {!content && (
              <TouchableOpacity disabled={convoExists === false} onPress={sendChat}>
                <Text
                  style={[
                    styles.sendText,
                    convoExists === false && { color: appearanceMode.secondary },
                  ]}
                >
                  Send Just {files.length > 1 ? 'Files' : 'File'}
                </Text>
              </TouchableOpacity>
            )}
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
                <Text style={styles.replyUsername}>
                  {replyChat.username.split('-')[0]}
                </Text>
              </Text>

              <TouchableOpacity onPress={() => dispatch(setReplyChat(null))}>
                <AntDesign
                  color={appearanceMode.textColor}
                  name="close"
                  size={25}
                />
              </TouchableOpacity>
            </View>

            <Text
              numberOfLines={3}
              ellipsizeMode="tail"
              style={styles.replyChat}
            >
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
              {
                borderWidth: 1,
                borderColor: appearanceMode.faint,
                borderRadius: 50,
              },
            ]}
          >
            <TextInput
              value={content}
              onChangeText={setContent}
              onBlur={() => setKeyboardPaddingBottom(23)}
              onFocus={() => setKeyboardPaddingBottom(5)}
              style={styles.textInput}
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

          {!content && (
            <TouchableOpacity disabled={convoExists === false} onPress={sendChat}>
              <Text
                style={[
                  styles.sendText,
                  convoExists === false && { color: appearanceMode.secondary },
                ]}
              >
                Send Just {files.length > 1 ? 'Files' : 'File'}
              </Text>
            </TouchableOpacity>
          )}
        </BlurView>
      </View>
    )
  }

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={gesture}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <View
            style={{
              marginTop: 60,
              marginHorizontal: 15,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 400,
            }}
          >
            <View
              style={{
                backgroundColor: 'transparent',
                position: 'absolute',
                width: '100%',
                zIndex: 1000,
                borderRadius: 10,
              }}
            >
              <SystemNotification />
            </View>

            <Text
              style={{
                color: 'white',
                fontFamily: 'extrabold',
                fontSize: 20,
              }}
            >
              Send Files
            </Text>

            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={38} color="white" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
          >
            <ScrollView
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 10, gap: 5 }}
              horizontal
            >
              {files.map((file: any, index: number) => {
                const isVideo = file.uri.endsWith('.mp4')
                const mediaHeight = replyChat ? 610 : 700

                return (
                  <View key={`${file.uri}-${index}`}>
                    {isVideo ? (
                      <VideoPreview
                        uri={file.uri}
                        index={index}
                        height={mediaHeight}
                        isPlaying={
                          videoPlaying.index === index && videoPlaying.playing
                        }
                        onPress={() => handleVideoPlaying(index)}
                      />
                    ) : (
                      <TouchableOpacity
                        style={{
                          backgroundColor: 'black',
                          borderRadius: 15,
                        }}
                      >
                        <Image
                          resizeMode="contain"
                          source={{ uri: file.uri }}
                          style={{
                            width: DEVICE_WIDTH - 20,
                            height: mediaHeight,
                            borderRadius: 15,
                          }}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )
              })}
            </ScrollView>

            <Animated.View
              style={[
                {
                  height: 3,
                  backgroundColor: appearanceMode.primary,
                  borderRadius: 20,
                  marginBottom: 5,
                },
                animatedProgressBar,
              ]}
            />

            {renderChatFooter()}
          </KeyboardAvoidingView>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

export default WithMedia