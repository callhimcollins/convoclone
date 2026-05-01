import {
  Image,
  Platform,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Linking,
} from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { chatType } from '@/types'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { Ionicons } from '@expo/vector-icons'
import moment from 'moment'
import { router } from 'expo-router'
import Animated, { FadeInRight, LightSpeedInRight } from 'react-native-reanimated'
import { setReplyChat } from '@/state/features/chatSlice'
import { supabase } from '@/lib/supabase'
import { getUserData } from '@/state/features/userSlice'
import RemoteImage from '@/components/RemoteImage'
import Hyperlink from 'react-native-hyperlink'
import UrlPreview from '@/components/UrlPreview'
import {
  setSystemNotificationData,
  setSystemNotificationState,
} from '@/state/features/notificationSlice'
import RemoteVideo from '@/components/RemoteVideo'
import { BlurView } from 'expo-blur'
import { randomUUID } from 'expo-crypto'
import {
  setAudioState,
  setFullScreenSource,
  setShowFullScreen,
  togglePlayPause,
} from '@/state/features/mediaSlice'
import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio'

const ChatBox = ({
  chat_id,
  Users,
  content,
  files,
  audio,
  dateCreated,
  convo_id,
  replyChat,
}: chatType) => {
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
  const audioState = useSelector((state: RootState) => state.media.audioState)

  const [userIsBlocked, setUserIsBlocked] = useState(false)
  const [userIsBlockedInReply, setUserIsBlockedInReply] = useState(false)
  const [urlPresent, setUrlPresent] = useState(false)
  const [url, setUrl] = useState('')
  const [profileAudio, setProfileAudio] = useState<string | null>(null)
  const [chatAudio, setChatAudio] = useState<string | null>(null)

  const dispatch = useDispatch()
  const styles = getStyles(appearanceMode)
  const formattedTime = moment.utc(dateCreated).local().format('HH:mm')

  const player = useAudioPlayer(null)
  const playerStatus = useAudioPlayerStatus(player)

  const notify = useCallback(
    (type: 'neutral' | 'error', message: string) => {
      dispatch(setSystemNotificationState(true))
      dispatch(setSystemNotificationData({ type, message }))
    },
    [dispatch]
  )

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

  const playPauseAudio = async (
    audioType: 'profile' | 'chat',
    audioSource: string | null,
    chatId?: string
  ) => {
    try {
      if (!audioSource) {
        notify('neutral', 'Nothing To Play')
        return
      }

      const audioID = audioType === 'chat' ? chatId : 'profile'

      if (!audioID) {
        notify('neutral', 'Nothing To Play')
        return
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      })

      const sameAudioIsSelected = audioState.currentlyPlayingAudioID === audioID

      if (sameAudioIsSelected && playerStatus.playing) {
        const paused = safePausePlayer()

        if (paused) {
          dispatch(
            setAudioState({
              currentlyPlayingAudioID: audioID,
              isPaused: true,
            })
          )
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
        dispatch(
          setAudioState({
            currentlyPlayingAudioID: audioID,
            isPaused: false,
          })
        )
      } else {
        notify('error', 'An Error Occured')
      }
    } catch (error) {
      console.log(error)
      notify('error', 'An Error Occured')
    }
  }

  const fetchAudioProfile = useCallback(async () => {
    try {
      if (!Users?.audio) return

      const { data } = supabase.storage.from('userfiles').getPublicUrl(String(Users.audio))

      if (data?.publicUrl) {
        setProfileAudio(data.publicUrl)
      }
    } catch (error) {
      notify('error', 'An Error Occured')
    }
  }, [Users?.audio, notify])

  const getAudio = useCallback(async () => {
    if (!audio) return

    const { data } = supabase.storage.from('userfiles').getPublicUrl(String(audio))

    if (data?.publicUrl) {
      setChatAudio(data.publicUrl)
    } else {
      console.log('No data')
    }
  }, [audio])

  const extractLink = useCallback(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const match = content?.match(urlRegex)

    if (match && match[0]) {
      setUrl(match[0])
      setUrlPresent(true)
    } else {
      setUrl('')
      setUrlPresent(false)
    }
  }, [content])

  const handleOpenLink = async () => {
    try {
      const supported = await Linking.canOpenURL(url)

      if (supported) {
        await Linking.openURL(url)
      } else {
        notify('error', "Couldn't open link")
      }
    } catch (error) {
      notify('error', "Couldn't open link")
    }
  }

  const handleProfileNavigation = () => {
    dispatch(getUserData(Users))

    router.push({
      pathname: '/(profile)/[profileID]',
      params: {
        profileID: Users.user_id,
      },
    })
  }

  const handleReplyChat = () => {
    dispatch(
      setReplyChat({
        chat_id,
        content: audio ? `Voice note at ${formattedTime}` : content,
        convo_id,
        username: Users.username,
        user_id: Users.user_id,
      })
    )
  }

  const checkBlockedUser = useCallback(async () => {
    const { data } = await supabase
      .from('blockedUsers')
      .select('*')
      .eq('user_id', String(authenticatedUserData?.user_id))
      .eq('blockedUserID', String(Users.user_id))
      .single()

    setUserIsBlocked(Boolean(data))
  }, [authenticatedUserData?.user_id, Users.user_id])

  const checkBlockedUserInReplyBox = useCallback(async () => {
    if (!replyChat?.user_id) {
      setUserIsBlockedInReply(false)
      return
    }

    const { data } = await supabase
      .from('blockedUsers')
      .select('*')
      .eq('user_id', String(authenticatedUserData?.user_id))
      .eq('blockedUserID', String(replyChat.user_id))
      .single()

    setUserIsBlockedInReply(Boolean(data))
  }, [authenticatedUserData?.user_id, replyChat?.user_id])

  const handleShowFullScreen = (file: string) => {
    safePausePlayer()

    dispatch(setShowFullScreen(true))
    dispatch(setFullScreenSource({ file, convoStarter: String(content) }))
    dispatch(togglePlayPause({ index: file + String(randomUUID()) }))
  }

  const isVideoFile = (file: string) => {
    const lowerFile = file.toLowerCase()

    return lowerFile.endsWith('.mp4') || lowerFile.endsWith('.mov') || lowerFile.endsWith('.avi')
  }

  useEffect(() => {
    fetchAudioProfile()
  }, [fetchAudioProfile])

  useEffect(() => {
    extractLink()
  }, [extractLink])

  useEffect(() => {
    checkBlockedUser()
    checkBlockedUserInReplyBox()
  }, [checkBlockedUser, checkBlockedUserInReplyBox])

  useEffect(() => {
    getAudio()
  }, [getAudio])

  useEffect(() => {
    if (!playerStatus.playing) {
      const finished =
        playerStatus.duration > 0 &&
        Math.abs(playerStatus.duration - playerStatus.currentTime) < 0.3

      if (finished) {
        const audioID = String(chat_id)

        safeSeekPlayer(0)

        dispatch(
          setAudioState({
            currentlyPlayingAudioID: audioID,
            isPaused: true,
          })
        )
      }
    }
  }, [
    playerStatus.playing,
    playerStatus.currentTime,
    playerStatus.duration,
    chat_id,
    dispatch,
    safeSeekPlayer,
  ])

  useEffect(() => {
    return () => {
      safePausePlayer()
    }
  }, [safePausePlayer])

  return (
    <>
      {!userIsBlocked && (
        <Animated.View
          key={String(chat_id)}
          entering={
            Platform.OS === 'android'
              ? FadeInRight
              : LightSpeedInRight.springify().damping(20)
          }
          style={[styles.container]}
        >
          <TouchableOpacity onPress={handleReplyChat}>
            <View style={styles.header}>
              <TouchableOpacity
                onLongPress={() => playPauseAudio('profile', profileAudio, String(Users.user_id))}
                onPress={handleProfileNavigation}
                style={styles.headerLeft}
              >
                {!Users?.isRobot && Users && (
                  <RemoteImage
                    skeletonHeight={styles.profileImage.height}
                    skeletonWidth={styles.profileImage.width}
                    path={ Users?.profileImage || `${Users?.username}-profileImage`}                      
                    style={styles.profileImage}
                  />
                )}

                {!Users?.isRobot && <Text style={styles.username}>{Users?.username}</Text>}

                {Users?.isRobot && <Text style={styles.username}>Dialogue Robot</Text>}
              </TouchableOpacity>
            </View>

            <View>
              {replyChat && (
                <TouchableOpacity style={styles.replyChatContainer}>
                  <View style={styles.replyChatTextContainer}>
                    <View style={styles.replyChatSideBar} />

                    {!userIsBlockedInReply && (
                      <View>
                        <Text style={styles.replyChatUsername}>
                          {replyChat?.username.split('-')[0]}
                        </Text>

                        <Text
                          numberOfLines={3}
                          ellipsizeMode="tail"
                          style={styles.replyChatContent}
                        >
                          {replyChat?.content}
                        </Text>
                      </View>
                    )}

                    {userIsBlockedInReply && (
                      <View>
                        <Text style={styles.replyChatUsername}>
                          {replyChat.username} is blocked
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}

              <View style={styles.contentContainer}>
                {files?.length === 1 && (
                  <View style={styles.mediaContainerView}>
                    {isVideoFile(files[0]) ? (
                      <TouchableOpacity
                        onPress={() => handleShowFullScreen(files[0])}
                        style={{
                          width: '100%',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <View
                          style={{
                            zIndex: 100,
                            position: 'absolute',
                            justifyContent: 'center',
                          }}
                        >
                          <BlurView
                            style={{
                              borderRadius: 15,
                              overflow: 'hidden',
                              paddingHorizontal: 30,
                              paddingVertical: 10,
                            }}
                          >
                            <Text
                              style={{
                                color: 'white',
                                textAlign: 'center',
                                fontFamily: 'extrabold',
                                fontSize: 15,
                              }}
                            >
                              Video
                            </Text>
                          </BlurView>
                        </View>

                        <RemoteVideo
                          resizeMode="cover"
                          style={[styles.chatMedia, { width: '100%', marginBottom: 10 }]}
                          path={files[0]}
                        />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleShowFullScreen(files[0])}
                        style={{
                          width: '100%',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <RemoteImage
                          style={[styles.chatMedia, { width: '100%', marginBottom: 10 }]}
                          path={files[0]}
                          key={files[0]}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {!!files?.length && files.length > 1 && (
                  <ScrollView
                    showsHorizontalScrollIndicator={false}
                    style={{ borderRadius: 10, marginBottom: 10 }}
                    horizontal
                  >
                    {files.map((file, index) => (
                      <View key={`${file}-${index}`}>
                        {isVideoFile(file) ? (
                          <TouchableOpacity
                            onPress={() => handleShowFullScreen(file)}
                            style={{
                              width: '100%',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <View
                              style={{
                                zIndex: 100,
                                position: 'absolute',
                                justifyContent: 'center',
                              }}
                            >
                              <BlurView
                                style={{
                                  borderRadius: 15,
                                  overflow: 'hidden',
                                  paddingHorizontal: 30,
                                  paddingVertical: 10,
                                }}
                              >
                                <Text
                                  style={{
                                    color: 'white',
                                    textAlign: 'center',
                                    fontFamily: 'extrabold',
                                    fontSize: 15,
                                  }}
                                >
                                  Video
                                </Text>
                              </BlurView>
                            </View>

                            <RemoteVideo resizeMode="cover" style={styles.chatMedia} path={file} />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity onPress={() => handleShowFullScreen(file)}>
                            <RemoteImage style={styles.chatMedia} path={file} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                )}

                {audio && (
                  <TouchableOpacity
                    onPress={() => playPauseAudio('chat', chatAudio, String(chat_id))}
                    style={styles.playAudioContainer}
                  >
                    {audioState.currentlyPlayingAudioID === String(chat_id) && (
                      <Ionicons
                        name={audioState.isPaused ? 'mic' : 'pause'}
                        size={24}
                        color={appearanceMode.primary}
                      />
                    )}

                    {audioState.currentlyPlayingAudioID !== String(chat_id) && (
                      <Ionicons name="mic" size={24} color={appearanceMode.primary} />
                    )}
                  </TouchableOpacity>
                )}

                <View>
                  <Hyperlink linkDefault linkStyle={{ color: appearanceMode.primary }}>
                    <Text style={styles.chat}>{content}</Text>
                  </Hyperlink>

                  {urlPresent && (
                    <TouchableOpacity onPress={handleOpenLink}>
                      <UrlPreview url={url} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>{formattedTime}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {userIsBlocked && (
        <View
          style={[
            styles.container,
            {
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 30,
            },
          ]}
        >
          <Text style={{ color: appearanceMode.textColor, fontFamily: 'extrabold' }}>
            {Users.username} is blocked
          </Text>
        </View>
      )}
    </>
  )
}

export default ChatBox