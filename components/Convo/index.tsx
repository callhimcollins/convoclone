import {
  Image,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Share,
  ScrollView,
  Dimensions,
} from 'react-native'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { chatType, convoType, userType } from '@/types'
import { AntDesign, Feather, FontAwesome6, Ionicons } from '@expo/vector-icons'
import { getStyles } from './styles'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import ExternalInputBox from '../ExternalInputBox'
import { useRootNavigationState, useRouter } from 'expo-router'
import {
  addToBotContext,
  getConvoForChat,
  setBotContext,
  setConvoExists,
  setReplyChat,
} from '@/state/features/chatSlice'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import moment from 'moment'
import { supabase } from '@/lib/supabase'
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler'
import { getUserData } from '@/state/features/userSlice'
import RemoteImage from '../RemoteImage'
import RemoteVideo from '../RemoteVideo'
import { BlurView } from 'expo-blur'
import {
  setSystemNotificationData,
  setSystemNotificationState,
} from '@/state/features/notificationSlice'
import UrlPreview from '../UrlPreview'
import { Skeleton } from 'moti/skeleton'
import { sendPushNotification } from '@/pushNotifications'
import { openai } from '@/lib/openAIInitializer'
import { useDebouncedCallback } from 'use-debounce'
import { ChatCompletionMessageParam } from 'openai/resources'
import { createURL } from 'expo-linking'
import {
  setAudioState,
  setFullScreenSource,
  setShowFullScreen,
  togglePlayPause,
} from '@/state/features/mediaSlice'
import { VisibilityAwareView } from 'react-native-visibility-aware-view'
import { randomUUID } from 'expo-crypto'
import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio'

const BOT_COOLDOWN = 5000

const Convo = (convo: convoType) => {
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
  const replyChat = useSelector((state: RootState) => state.chat.replyChat)
  const contextForBotState = useSelector((state: RootState) => state.chat.contextForBotState)
  const isPlaying = useSelector((state: RootState) => state.media.playState)
  const activeTab = useSelector((state: RootState) => state.navigation.activeTab)
  const audioState = useSelector((state: RootState) => state.media.audioState)

  const [lastChat, setLastChat] = useState<chatType | null>()
  const [isKeepingUp, setIsKeepingUp] = useState(false)
  const [numberOfEngagedUsers, setNumberOfEngagedUsers] = useState<Array<string>>([])
  const [content, setContent] = useState('')
  const [optionsVisible, setOptionsVisible] = useState(false)
  const [lastBotResponseTime, setLastBotResponseTime] = useState(0)
  const [audio, setAudio] = useState<string | null>(null)
  const [convoAudio, setConvoAudio] = useState<string | null>(null)
  const [urlPresent, setUrlPresent] = useState(false)
  const [url, setUrl] = useState('')

  const router = useRouter()
  const dispatch = useDispatch()
  const styles = getStyles(appearanceMode)
  const navigationState = useRootNavigationState() as any
  const currentRoute = navigationState?.routes?.[navigationState.index]?.name ?? undefined

  const widthValue = useSharedValue(0)
  const paddingValuePopup = useSharedValue(0)
  const opacityValue = useSharedValue(0)
  const mediaOpacity = useSharedValue(1)

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
    (source: string) => {
      try {
        player?.replace(source)
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

  const animatedMediaButtonStyles = useAnimatedStyle(() => {
    return {
      opacity: mediaOpacity.value,
    }
  })

  const animatedPopupStyles = useAnimatedStyle(() => {
    return {
      width: widthValue.value,
      padding: paddingValuePopup.value,
      opacity: opacityValue.value,
    }
  })

  const SkeletonCommonProps = {
    colorMode: appearanceMode.name === 'light' ? 'light' : 'dark',
    transition: { type: 'timing', duration: 2000 },
  } as const

  const chatData = useMemo(
    () => ({
      convo_id: convo.convo_id,
      user_id: authenticatedUserData?.user_id,
      content,
      files: null,
      audio: null,
    }),
    [convo.convo_id, content, authenticatedUserData]
  )

  const convoKeepUpData = {
    user_id: authenticatedUserData?.user_id,
    convo_id: convo.convo_id,
    userData: authenticatedUserData,
    convoData: convo,
  }

  const notificationForKeepUp = {
    sender_id: authenticatedUserData?.user_id,
    senderUserData: authenticatedUserData,
    receiver_id: convo?.Users?.user_id,
    convo,
    type: 'keepup',
  }

  const robotData = useMemo(
    () => ({
      user_id: convo.convo_id,
      username: `Dialogue Robot-${convo.convo_id}`,
      name: `Dialogue Robot`,
      bio: `I was created to talk in room: ${convo?.convoStarter}`,
      profileImage: '',
      isRobot: true,
    }),
    [convo.convo_id, convo?.convoStarter]
  )

  const notify = (type: 'neutral' | 'error' | 'success', message: string) => {
    dispatch(setSystemNotificationState(true))
    dispatch(setSystemNotificationData({ type, message }))
  }

  const isVideoFile = (file: string) => {
    const lowerFile = file.toLowerCase()

    return (
      lowerFile.endsWith('.mp4') ||
      lowerFile.endsWith('.mov') ||
      lowerFile.endsWith('.avi')
    )
  }

  const extractLink = (text: string) => {
    if (!text) return null

    const urlRegex =
      /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)/i

    const match = text.match(urlRegex)

    if (!match?.[0]) return null

    const extracted = match[0]

    return extracted.startsWith('http://') || extracted.startsWith('https://')
      ? extracted
      : `https://${extracted}`
  }

  const handleOpenLink = async () => {
    if (!url) return

    const supported = await Linking.canOpenURL(url)

    if (supported) {
      await Linking.openURL(url)
    } else {
      notify('error', "Couldn't open link")
    }
  }

  const fetchChatToGetUsers = async () => {
    const { data, error } = await supabase
      .from('Chats')
      .select('user_id')
      .eq('convo_id', convo?.convo_id)

    if (!error && data) {
      const uniqueUsers = new Set(data.map((chat) => chat.user_id))
      setNumberOfEngagedUsers(Array.from(uniqueUsers))
    } else {
      console.log('Error fetching chat data')
    }
  }

  const handleShare = async () => {
    const shareUrl = createURL(`(chat)/${convo?.convo_id}`)

    try {
      await Share.share({
        message: `Join The Chat on Convo (${convo?.convoStarter}): ${shareUrl}`,
      })
    } catch (error) {
      notify('error', "An Error Occured. Couldn't share")
    }
  }

  const handleGuestProfile = useCallback(() => {
    if (currentRoute === '(profile)/[profileID]') return

    if (convo.Users) {
      dispatch(getUserData(convo.Users))

      router.push({
        pathname: '/(profile)/[profileID]/',
        params: {
          profileID: String(convo.user_id),
        },
      })
    }
  }, [currentRoute, router, convo.user_id, convo.Users, dispatch])

  const handleChatNavigation = useCallback(() => {
    dispatch(getConvoForChat(convo))
    dispatch(setBotContext(null))
    dispatch(setConvoExists(null))

    if (replyChat && replyChat.convo_id !== convo.convo_id) {
      dispatch(setReplyChat(null))
    }

    router.push({
      pathname: '/(chat)/[convoID]',
      params: {
        convoID: String(convo.convo_id),
      },
    })
  }, [convo, router, dispatch, replyChat])

  const toggleOptionsVisibility = useCallback(() => {
    setOptionsVisible((prev) => !prev)
  }, [])

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
          content: `You Are Dialogue Robot. Be The Character In This Role: ${convo?.convoStarter}. Keep it as natural as the character in the role. Use Emojis Only When ABSOLUTELY Necessary. !!! DO NOT DIVERT TO ANOTHER ROLE !!!. Treat usernames as their own individual character and only mention their usernames when ABSOLUTELY NECESSARY. Make sure to keep your words to less than 50 words`,
        }

        const chatCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [systemMessage, ...messages],
          max_tokens: 100,
        })

        const botResponse = chatCompletion.choices[0].message.content

        await sendChatByRobot(
          String(convo.convo_id),
          robotData,
          `${convo.convo_id}`,
          String(botResponse)
        )
      } catch (error) {
        console.error('Error in completeBotResponse:', error)
      }
    },
    1000,
    { maxWait: 5000 }
  )

  const updateConvoLastChat = useCallback(async () => {
    const { error } = await supabase
      .from('Convos')
      .update({ lastChat: chatData })
      .eq('convo_id', String(convo.convo_id))
      .select()

    if (error) {
      console.log(error.message)
    }
  }, [chatData, convo.convo_id])

  const sendChat = async () => {
    if (!content) {
      handleChatNavigation()
      return
    }

    dispatch(addToBotContext({ role: 'user', content }))

    const { data, error } = await supabase
      .from('Chats')
      .insert([chatData])
      .eq('convo_id', Number(convo.convo_id))
      .select()

    if (data) {
      setContent('')
      updateConvoLastChat()
      handleChatNavigation()

      if (convo.dialogue) {
        const newChatForRobot = {
          role: 'user',
          content:
            replyChat && replyChat.username.includes('Dialogue Robot')
              ? `I'm(${authenticatedUserData?.username?.split('-')[0]}) replying to your chat: ${replyChat.content}, reply to my own chat: ${content} using my reply and the past messages up until the reply to your chat as context. Don't Start Your Reply With "Dialogue Robot: "`
              : `${authenticatedUserData?.username?.split('-')[0]}: ${content}. Don't Start Your Reply With "Dialogue Robot: "`,
        }

        const now = Date.now()

        if (now - lastBotResponseTime > BOT_COOLDOWN) {
          completeBotResponse([...contextForBotState, newChatForRobot])
          setLastBotResponseTime(now)
        }
      }
    }

    if (error) {
      console.log(error.message)
    }
  }

  const handleDelete = useCallback(async () => {
    const { data, error } = await supabase
      .from('Convos')
      .delete()
      .eq('convo_id', String(convo.convo_id))
      .eq('user_id', String(authenticatedUserData?.user_id))
      .select()
      .single()

    if (error) {
      notify('error', "Couldn't Delete Convo")
      console.log(error.message)
    } else {
      notify('success', 'Convo deleted successfully')
    }

    if (data) {
      if (data.audio !== null) {
        const { error: storageError } = await supabase.storage
          .from('userfiles')
          .remove(data.audio)

        if (!storageError) {
          console.log('Removed successfully')
        } else {
          console.log("Couldn't remove")
        }
      }

      if (data.files !== null) {
        data.files.map(async (file: any) => {
          const { error: storageError } = await supabase.storage.from('userfiles').remove(file)

          if (!storageError) {
            console.log('File Removed successfully')
          } else {
            console.log('File Not Removed')
          }
        })
      }
    } else {
      console.log('No Data')
    }
  }, [convo.convo_id, authenticatedUserData?.user_id])

  const getLastChat = useCallback(async () => {
    const { data } = await supabase
      .from('Chats')
      .select('*, Users(username)')
      .eq('convo_id', String(convo.convo_id))
      .order('dateCreated', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setLastChat({ lastChat: data })
    }
  }, [convo.convo_id])

  const renderLastChat = useCallback(() => {
    return lastChat?.lastChat?.content
  }, [lastChat])

  const renderLastChatUsername = useCallback(() => {
    return (
      lastChat?.Users?.username?.split('-')[0] ||
      lastChat?.lastChat?.Users?.username?.split('-')[0]
    )
  }, [lastChat])

  const rightSwipe = useCallback(() => {
    return (
      <>
        {authenticatedUserData?.user_id === convo.user_id && (
          <TouchableOpacity
            onPress={handleDelete}
            style={{
              backgroundColor: '#E33629',
              paddingHorizontal: 10,
              justifyContent: 'center',
              alignItems: 'center',
              borderTopLeftRadius: 15,
              borderBottomLeftRadius: 15,
            }}
          >
            <Image style={{ width: 30, height: 30 }} source={require('@/assets/images/bin.png')} />
          </TouchableOpacity>
        )}
      </>
    )
  }, [handleDelete, authenticatedUserData?.user_id, convo.user_id])

  const sendNotificationForKeepUp = useCallback(async () => {
    if (notificationForKeepUp.receiver_id === notificationForKeepUp.sender_id) {
      return
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('sender_id', String(authenticatedUserData?.user_id))
      .eq('receiver_id', String(convo.user_id))
      .eq('convo->>convo_id', String(convo?.convo_id))
      .eq('type', 'keepup')
      .single()

    if (data) {
      console.log('Notification exists')
      return
    }

    const { data: blockedUserData, error: blockedUserError } = await supabase
      .from('blockedUsers')
      .select('*')
      .eq('user_id', String(convo.user_id))
      .eq('blockedUserID', String(authenticatedUserData?.user_id))
      .single()

    if (blockedUserData) {
      console.log('User is blocked so convo keep up notification will not be sent')
      return
    }

    const { error: insertError } = await supabase
      .from('notifications')
      .insert([notificationForKeepUp])
      .single()

    if (!insertError) {
      console.log('Notification sent successfully')

      const { data } = await supabase
        .from('Users')
        .select('pushToken, user_id')
        .eq('user_id', String(convo?.user_id))
        .single()

      if (data) {
        sendPushNotification(
          data.pushToken,
          'Keep Up',
          `${authenticatedUserData?.username} started keeping up with your Convo: ${convo?.convoStarter}`,
          'profile',
          authenticatedUserData,
          null,
          data.user_id
        )
      }
    } else {
      console.log(insertError)
    }

    if (blockedUserError) {
      console.log('Error checking for blocked user')
    }

    if (error) {
      console.log(error)
      console.log("Couldn't fetch notification")
    }
  }, [notificationForKeepUp, convo?.user_id, authenticatedUserData?.user_id])

  const handleKeepUp = useCallback(async () => {
    const { error } = await supabase.from('convoKeepUps').insert([convoKeepUpData]).select()

    if (error) {
      console.log('Keep up not added', error.message)
    } else {
      sendNotificationForKeepUp()
      setOptionsVisible(false)
      setIsKeepingUp(true)
    }
  }, [convoKeepUpData, sendNotificationForKeepUp])

  const handleDrop = useCallback(async () => {
    const { error } = await supabase
      .from('convoKeepUps')
      .delete()
      .eq('convo_id', convo.convo_id)
      .eq('user_id', String(authenticatedUserData?.user_id))

    if (error) {
      console.log("Couldn't drop convo")
      setIsKeepingUp(true)
    } else {
      setIsKeepingUp(false)
      setOptionsVisible(false)
    }
  }, [convo.convo_id, authenticatedUserData?.user_id])

  const checkIsKeepingUp = useCallback(async () => {
    const { error } = await supabase
      .from('convoKeepUps')
      .select('*')
      .eq('convo_id', convo.convo_id)
      .eq('user_id', String(authenticatedUserData?.user_id))
      .single()

    setIsKeepingUp(!error)
  }, [convo.convo_id, authenticatedUserData?.user_id])

  const handlePlayPause = useCallback(
    async (file: string, index: number) => {
      const videoId = `${file}-${index}`

      safePausePlayer()

      dispatch(setAudioState({ currentlyPlayingAudioID: null, isPaused: true }))
      dispatch(togglePlayPause({ index: videoId }))
    },
    [dispatch, safePausePlayer]
  )

  const handleShowFullScreen = (file: string) => {
    safePausePlayer()

    dispatch(setAudioState({ currentlyPlayingAudioID: null, isPaused: true }))
    dispatch(setShowFullScreen(true))
    dispatch(setFullScreenSource({ file, convoStarter: String(convo.convoStarter) }))
    dispatch(togglePlayPause({ index: file + String(randomUUID()) }))
  }

  const playPauseAudio = async (
    audioType: 'profile' | 'convo',
    audioSource: string | null,
    convo_id?: string
  ) => {
    try {
      if (!audioSource) {
        notify('neutral', 'Nothing To Play')
        return
      }

      const audioID = audioType === 'convo' ? convo_id : 'profile'

      if (!audioID) {
        notify('neutral', 'Nothing To Play')
        return
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      })

      dispatch(togglePlayPause({ index: '' }))

      const sameAudioIsSelected = audioState.currentlyPlayingAudioID === audioID

      if (sameAudioIsSelected && playerStatus.playing) {
        const paused = safePausePlayer()

        if (paused) {
          dispatch(setAudioState({ currentlyPlayingAudioID: audioID, isPaused: true }))
        }

        return
      }

      try {
        await setIsAudioActiveAsync(false)
        await setIsAudioActiveAsync(true)
      } catch (error) {
        console.log('setIsAudioActiveAsync failed:', error)
      }

      const replaced = safeReplacePlayer(audioSource)

      if (!replaced) {
        notify('error', 'An Error Occured')
        return
      }

      safeSeekPlayer(0)

      const played = safePlayPlayer()

      if (played) {
        dispatch(setAudioState({ currentlyPlayingAudioID: audioID, isPaused: false }))
      } else {
        notify('error', 'An Error Occured')
      }
    } catch (error) {
      console.log(error)
      notify('error', 'An Error Occured')
    }
  }

  const fetchAudioProfile = async () => {
    try {
      if (!convo.Users?.audio) return

      const { data } = supabase.storage.from('userfiles').getPublicUrl(String(convo.Users.audio))

      if (data?.publicUrl) {
        setAudio(data.publicUrl)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const fetchConvoAudio = async () => {
    try {
      if (!convo.audio) return

      const { data } = supabase.storage.from('userfiles').getPublicUrl(String(convo.audio))

      if (data?.publicUrl) {
        setConvoAudio(data.publicUrl)
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (isPlaying) {
      if (isPlaying.playState === true) {
        mediaOpacity.value = withTiming(0.5, { duration: 500 })
      } else if (isPlaying.playState === false || isPlaying.playState === null) {
        mediaOpacity.value = withTiming(1)
      }
    }
  }, [isPlaying])

  useEffect(() => {
    if (convo.link) {
      const extractedLink = extractLink(convo.link)

      if (extractedLink) {
        setUrl(extractedLink)
        setUrlPresent(true)
      } else {
        setUrl('')
        setUrlPresent(false)
      }
    }
  }, [convo.link])

  useEffect(() => {
    fetchChatToGetUsers()
  }, [convo?.convo_id, authenticatedUserData])

useEffect(() => {
  const channelName = `convo-usersEngaged-channel-${convo.convo_id}-${Math.random()}`

  const convoChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'Chats',
        filter: `convo_id=eq.${convo.convo_id}`,
      },
      (payload: any) => {
        const newUserId = payload.new?.user_id

        setNumberOfEngagedUsers((prevUsers) => {
          if (prevUsers.includes(newUserId)) return prevUsers
          return [...prevUsers, newUserId]
        })
      }
    )

  convoChannel.subscribe()

  return () => {
    supabase.removeChannel(convoChannel)
  }
}, [convo.convo_id])

  useEffect(() => {
    getLastChat()
  }, [getLastChat])

  useEffect(() => {
    const channelName = `custom-update-channel-${convo.convo_id}-${Date.now()}-${Math.random()}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Chats',
          filter: `convo_id=eq.${convo.convo_id}`,
        },
        async (payload) => {
          const newChat = payload.new

          if (!newChat) return

          const { data } = await supabase
            .from('Users')
            .select('id, username')
            .eq('user_id', String(newChat.user_id))
            .single()

          if (data) {
            setLastChat({ lastChat: newChat, Users: data })
          }
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [convo.convo_id])

  useEffect(() => {
    if (optionsVisible) {
      widthValue.value = withTiming(120)
      paddingValuePopup.value = withTiming(10)
      opacityValue.value = withTiming(1)
    } else {
      widthValue.value = withTiming(0)
      paddingValuePopup.value = withTiming(0)
      opacityValue.value = withTiming(0)
    }
  }, [optionsVisible, widthValue, paddingValuePopup, opacityValue])

  useEffect(() => {
    checkIsKeepingUp()
  }, [checkIsKeepingUp])

  useEffect(() => {
    dispatch(togglePlayPause({ index: '' }))
  }, [activeTab])

  useEffect(() => {
    fetchAudioProfile()
    fetchConvoAudio()
  }, [convo.Users?.audio, convo.audio])

  useEffect(() => {
    if (!playerStatus.playing) {
      const finished =
        playerStatus.duration > 0 &&
        Math.abs(playerStatus.duration - playerStatus.currentTime) < 0.3

      if (finished) {
        safeSeekPlayer(0)

        dispatch(
          setAudioState({
            currentlyPlayingAudioID: audioState.currentlyPlayingAudioID,
            isPaused: true,
          })
        )
      }
    }
  }, [
    playerStatus.playing,
    playerStatus.currentTime,
    playerStatus.duration,
    audioState.currentlyPlayingAudioID,
    dispatch,
    safeSeekPlayer,
  ])

  useEffect(() => {
    return () => {
      safePausePlayer()
    }
  }, [safePausePlayer])

  const pauseAudioIfNeeded = () => {
    safePausePlayer()
    dispatch(setAudioState({ currentlyPlayingAudioID: null, isPaused: true }))
  }

  const renderMediaControls = (file: string, mediaIndex: number) => {
    const videoID = `${file}-${mediaIndex}`
    const isCurrentVideo = isPlaying?.index === videoID
    const isCurrentVideoPlaying = isCurrentVideo && isPlaying?.playState === true

    return (
      <View style={styles.mediaControlContainer}>
        <Animated.View style={[animatedMediaButtonStyles]}>
          <TouchableOpacity
            onPress={() => {
              pauseAudioIfNeeded()
              handlePlayPause(file, mediaIndex)
            }}
          >
            <BlurView style={styles.mediaButtonBackdrop}>
              <Image
                source={
                  isCurrentVideoPlaying
                    ? require('../../assets/images/pause.png')
                    : require('../../assets/images/play.png')
                }
                style={styles.playImage}
              />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      </View>
    )
  }

  const renderMediaItem = (file: string, index: number, single = false) => {
    const mediaIndex = convo.mediaIndex
    const videoID = `${file}-${mediaIndex}`

    if (isVideoFile(file)) {
      return (
        <TouchableOpacity
          onPress={() => handleShowFullScreen(String(file))}
          activeOpacity={0.6}
          key={index}
          style={single ? { justifyContent: 'center', alignItems: 'center' } : styles.contentContainer}
        >
          {renderMediaControls(String(file), mediaIndex)}

          <VisibilityAwareView
            minVisibleArea={0.95}
            onBecomeVisible={() => {
              if (single) {
                dispatch(togglePlayPause({ index: videoID }))
              }
            }}
            onBecomeInvisible={() => {
              if (isPlaying?.index === videoID && isPlaying.playState === true) {
                dispatch(togglePlayPause({ index: '' }))
              }
            }}
          >
            <RemoteVideo
              isLooping
              shouldPlay={isPlaying?.index === videoID && isPlaying?.playState === true}
              path={String(file)}
              resizeMode="cover"
              style={single ? [styles.image, { width: Dimensions.get('window').width - 20 }] : styles.image}
            />
          </VisibilityAwareView>
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity
        onPress={() => handleShowFullScreen(String(file))}
        activeOpacity={0.6}
        key={index}
        style={single ? undefined : styles.contentContainer}
      >
        <RemoteImage
          skeletonHeight={styles.image.height}
          skeletonWidth={styles.image.width}
          path={String(file)}
          style={single ? [styles.image, { width: Dimensions.get('window').width - 20 }] : styles.image}
        />
      </TouchableOpacity>
    )
  }

  return (
    <GestureHandlerRootView>
      <Swipeable renderRightActions={rightSwipe}>
        <VisibilityAwareView
          minVisibleArea={0.95}
          onBecomeInvisible={() => {
            pauseAudioIfNeeded()
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleChatNavigation}
            key={Number(convo.id)}
            style={styles.container}
          >
            <Animated.View style={[styles.popUpContainer, animatedPopupStyles]}>
              <View>
                <TouchableOpacity onPress={toggleOptionsVisibility} style={{ alignItems: 'flex-end' }}>
                  <AntDesign size={24} color={appearanceMode.textColor} name="close" />
                </TouchableOpacity>
              </View>

              {!isKeepingUp && (
                <TouchableOpacity onPress={handleKeepUp} style={[styles.popUpOptionButton]}>
                  <Text style={styles.popUpOptionText}>Keep Up</Text>
                </TouchableOpacity>
              )}

              {isKeepingUp && (
                <TouchableOpacity onPress={handleDrop} style={[styles.popUpOptionButton]}>
                  <Text style={styles.popUpOptionText}>Drop</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleShare} style={[styles.popUpOptionButton]}>
                <Text style={styles.popUpOptionText}>Share</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.header}>
              {convo.Users?.audio ? (
                <Skeleton height={40} width={150} {...SkeletonCommonProps}>
                  <TouchableOpacity
                    onLongPress={() =>
                      playPauseAudio('profile', audio, String(convo.Users?.user_id))
                    }
                    onPress={handleGuestProfile}
                    style={styles.headerLeft}
                  >
                    {convo.Users && (
                      <RemoteImage
                        skeletonHeight={styles.userImage.height}
                        skeletonWidth={styles.userImage.width}
                        style={styles.userImage}
                        path={ convo.Users?.profileImage || `${convo.Users?.username}-profileImage`}                      />
                    )}

                    {convo.Users && <Text style={styles.username}>{convo.Users.username}</Text>}
                  </TouchableOpacity>
                </Skeleton>
              ) : (
                <Skeleton height={40} width={150} {...SkeletonCommonProps}>
                  <TouchableOpacity onPress={handleGuestProfile} style={styles.headerLeft}>
                    {convo.Users && (
                      <RemoteImage
                        skeletonHeight={styles.userImage.height}
                        skeletonWidth={styles.userImage.width}
                        style={styles.userImage}
                        path={ convo.Users?.profileImage || `${convo.Users?.username}-profileImage`}                      />
                    )}

                    {convo.Users && <Text style={styles.username}>{convo.Users.username}</Text>}
                  </TouchableOpacity>
                </Skeleton>
              )}

              <View style={styles.headerRight}>
                {convo.dialogue && (
                  <Image
                    style={styles.dialogueRobot}
                    source={require('../../assets/images/dialoguerobot.png')}
                  />
                )}

                <TouchableOpacity onPress={toggleOptionsVisibility}>
                  <Feather size={24} color={appearanceMode.textColor} name="more-vertical" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.contentContainer}>
              <View style={{ paddingVertical: 3 }}>
                <Text style={styles.convoStarter}>{convo.convoStarter}</Text>

                {convo.audio && (
                  <TouchableOpacity
                    onPress={() =>
                      playPauseAudio('convo', convoAudio, String(convo.convo_id))
                    }
                    style={styles.micButton}
                  >
                    {audioState.currentlyPlayingAudioID === String(convo.convo_id) && (
                      <Ionicons
                        name={audioState.isPaused ? 'mic' : 'pause'}
                        size={24}
                        color={appearanceMode.primary}
                      />
                    )}

                    {audioState.currentlyPlayingAudioID !== String(convo.convo_id) && (
                      <Ionicons name="mic" size={24} color={appearanceMode.primary} />
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {convo.files && convo.files.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageScrollView}
                >
                  {convo.files.map((file, index) => renderMediaItem(String(file), index, false))}
                </ScrollView>
              )}

              {convo.files && convo.files.length === 1 && (
                <View style={styles.contentContainer}>
                  {renderMediaItem(String(convo.files[0]), 0, true)}
                </View>
              )}

              {urlPresent && (
                <TouchableOpacity onPress={handleOpenLink} style={styles.linkContainer}>
                  <UrlPreview url={String(url)} />
                </TouchableOpacity>
              )}

              {lastChat && (
                <View style={{ paddingVertical: 2, borderRadius: 10 }}>
                  <Text numberOfLines={2} ellipsizeMode="tail" style={styles.lastMessage}>
                    <Text style={styles.lastMessageUsername}>{renderLastChatUsername()}:</Text>{' '}
                    {renderLastChat()}
                  </Text>
                </View>
              )}

              {!lastChat && (
                <Text
                  style={[
                    styles.lastMessage,
                    { color: appearanceMode.secondary, fontFamily: 'extrabold' },
                  ]}
                >
                  No Chats In This Room
                </Text>
              )}

              <ExternalInputBox
                placeholder="Send a chat..."
                icon={<FontAwesome6 name="arrow-right-long" color="white" size={15} />}
                inputValue={content}
                onChangeValue={(value) => setContent(value)}
                action={sendChat}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.time}>{moment(convo.dateCreated).fromNow()}</Text>

              <Text style={styles.active}>
                {Number(numberOfEngagedUsers.length)}{' '}
                {numberOfEngagedUsers.length === 1 ? 'person' : 'people'} in this conversation
              </Text>
            </View>
          </TouchableOpacity>
        </VisibilityAwareView>
      </Swipeable>
    </GestureHandlerRootView>
  )
}

export default memo(Convo)