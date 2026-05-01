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
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from 'expo-audio'
import { BlurView } from 'expo-blur'
import { randomUUID } from 'expo-crypto'
import {
  setAudioState,
  setFullScreenSource,
  setShowFullScreen,
  togglePlayPause,
} from '@/state/features/mediaSlice'

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
  const authenticatedUserData = useSelector(
    (state: RootState) => state.user.authenticatedUserData
  )
  const audioState = useSelector((state: RootState) => state.media.audioState)

  const dispatch = useDispatch()
  const styles = getStyles(appearanceMode)

  const formattedTime = moment.utc(dateCreated).local().format('HH:mm')

  const [userIsBlocked, setUserIsBlocked] = useState(false)
  const [userIsBlockedInReply, setUserIsBlockedInReply] = useState(false)
  const [urlPresent, setUrlPresent] = useState(false)
  const [url, setUrl] = useState('')
  const [profileAudio, setProfileAudio] = useState<string | null>(null)
  const [chatAudio, setChatAudio] = useState<string | null>(null)

  const player = useAudioPlayer(chatAudio ? { uri: chatAudio } : null)
  const playerStatus = useAudioPlayerStatus(player)
  const profilePlayer = useAudioPlayer(profileAudio ? { uri: profileAudio } : null)

  const notifyError = useCallback(
    (message = 'An Error Occurred') => {
      dispatch(setSystemNotificationState(true))
      dispatch(setSystemNotificationData({ type: 'error', message }))
    },
    [dispatch]
  )

  const safePlayPlayer = useCallback((targetPlayer: any) => {
    try {
      targetPlayer?.play()
      return true
    } catch (error) {
      console.log('safePlayPlayer failed:', error)
      return false
    }
  }, [])

  const safePausePlayer = useCallback((targetPlayer: any) => {
    try {
      targetPlayer?.pause()
      return true
    } catch (error) {
      console.log('safePausePlayer failed:', error)
      return false
    }
  }, [])

  const safeSeekPlayer = useCallback((targetPlayer: any, seconds: number) => {
    try {
      targetPlayer?.seekTo(seconds)
      return true
    } catch (error) {
      console.log('safeSeekPlayer failed:', error)
      return false
    }
  }, [])

  const playPauseAudio = async (
    audioType: 'profile' | 'chat',
    audioSource: string,
    chatId?: string
  ) => {
    try {
      if (!audioSource || audioSource === 'null') {
        notifyError('Audio not available')
        return
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      })

      if (audioType === 'chat') {
        if (audioState.currentlyPlayingAudioID === chatId) {
          if (audioState.isPaused) {
            const played = safePlayPlayer(player)

            if (played) {
              dispatch(
                setAudioState({
                  currentlyPlayingAudioID: chatId,
                  isPaused: false,
                })
              )
            }
          } else {
            const paused = safePausePlayer(player)

            if (paused) {
              dispatch(
                setAudioState({
                  currentlyPlayingAudioID: chatId,
                  isPaused: true,
                })
              )
            }
          }
        } else {
          safePausePlayer(profilePlayer)

          const played = safePlayPlayer(player)

          if (played) {
            dispatch(
              setAudioState({
                currentlyPlayingAudioID: chatId,
                isPaused: false,
              })
            )
          }
        }

        return
      }

      if (audioType === 'profile') {
        if (audioState.currentlyPlayingAudioID === 'profile') {
          if (audioState.isPaused) {
            const played = safePlayPlayer(profilePlayer)

            if (played) {
              dispatch(
                setAudioState({
                  currentlyPlayingAudioID: 'profile',
                  isPaused: false,
                })
              )
            }
          } else {
            const paused = safePausePlayer(profilePlayer)

            if (paused) {
              dispatch(
                setAudioState({
                  currentlyPlayingAudioID: 'profile',
                  isPaused: true,
                })
              )
            }
          }
        } else {
          safePausePlayer(player)

          const played = safePlayPlayer(profilePlayer)

          if (played) {
            dispatch(
              setAudioState({
                currentlyPlayingAudioID: 'profile',
                isPaused: false,
              })
            )
          }
        }
      }
    } catch (error) {
      console.log('playPauseAudio failed:', error)
      notifyError()
    }
  }

  useEffect(() => {
    if (playerStatus.didJustFinish) {
      safeSeekPlayer(player, 0)
      dispatch(
        setAudioState({
          currentlyPlayingAudioID: String(chat_id),
          isPaused: true,
        })
      )
    }
  }, [playerStatus.didJustFinish, player, safeSeekPlayer, dispatch, chat_id])

  const fetchAudioProfile = useCallback(async () => {
    try {
      if (!Users?.audio) return

      const { data } = await supabase.storage
        .from('userfiles')
        .getPublicUrl(String(Users.audio))

      if (data) {
        setProfileAudio(data.publicUrl)
      }
    } catch (error) {
      console.log('fetchAudioProfile failed:', error)
      notifyError()
    }
  }, [Users?.audio, notifyError])

  useEffect(() => {
    fetchAudioProfile()
  }, [fetchAudioProfile])

  useEffect(() => {
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
        notifyError("Couldn't open link")
      }
    } catch (error) {
      console.log('handleOpenLink failed:', error)
      notifyError("Couldn't open link")
    }
  }

  const handleProfileNavigation = () => {
    dispatch(getUserData(Users))
    router.push({
      pathname: '/(profile)/[profileID]',
      params: { profileID: Users.user_id },
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

    setUserIsBlocked(!!data)
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

    setUserIsBlockedInReply(!!data)
  }, [authenticatedUserData?.user_id, replyChat?.user_id])

  useEffect(() => {
    checkBlockedUser()
    checkBlockedUserInReplyBox()
  }, [checkBlockedUser, checkBlockedUserInReplyBox])

  const handleShowFullScreen = (file: string) => {
    safePausePlayer(player)
    safePausePlayer(profilePlayer)

    dispatch(setShowFullScreen(true))
    dispatch(setFullScreenSource({ file, convoStarter: String(content) }))
    dispatch(togglePlayPause({ index: file + String(randomUUID()) }))
  }

  const getAudio = useCallback(async () => {
    try {
      if (!audio) return

      const { data } = await supabase.storage
        .from('userfiles')
        .getPublicUrl(String(audio))

      if (data) {
        setChatAudio(data.publicUrl)
      }
    } catch (error) {
      console.log('getAudio failed:', error)
      notifyError()
    }
  }, [audio, notifyError])

  useEffect(() => {
    getAudio()
  }, [getAudio])

  useEffect(() => {
    return () => {
      safePausePlayer(player)
      safePausePlayer(profilePlayer)
    }
  }, [player, profilePlayer, safePausePlayer])

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
                onLongPress={() =>
                  playPauseAudio('profile', String(profileAudio), String(Users.user_id))
                }
                onPress={handleProfileNavigation}
                style={styles.headerLeft}
              >
                {!Users?.isRobot && Users && (
                  <RemoteImage
                    skeletonHeight={styles.profileImage.height}
                    skeletonWidth={styles.profileImage.width}
                    path={`${Users?.username}-profileImage`}
                    style={styles?.profileImage}
                  />
                )}

                {!Users?.isRobot && (
                  <Text style={styles.username}>{Users?.username}</Text>
                )}

                {Users?.isRobot && (
                  <Text style={styles.username}>Dialogue Robot</Text>
                )}
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
                    {files[0].endsWith('.mp4') ? (
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
                          style={[
                            styles.chatMedia,
                            {
                              width: '100%',
                              marginBottom: 10,
                              marginRight: 0,
                            },
                          ]}
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
                          style={[
                            styles.chatMedia,
                            {
                              width: '100%',
                              marginBottom: 10,
                              marginRight: 0,
                            },
                          ]}
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
                        {file.endsWith('.mp4') ? (
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

                            <RemoteVideo style={styles.chatMedia} path={file} />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleShowFullScreen(file)}
                          >
                            <RemoteImage style={styles.chatMedia} path={file} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                )}

                {audio && (
                  <TouchableOpacity
                    onPress={() =>
                      playPauseAudio('chat', String(chatAudio), String(chat_id))
                    }
                    style={styles.playAudioContainer}
                  >
                    <Ionicons
                      name={
                        audioState.currentlyPlayingAudioID === String(chat_id) &&
                        !audioState.isPaused
                          ? 'pause'
                          : 'mic'
                      }
                      size={24}
                      color={appearanceMode.primary}
                    />
                  </TouchableOpacity>
                )}

                <View>
                  <Hyperlink
                    linkDefault={true}
                    linkStyle={{ color: appearanceMode.primary }}
                  >
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
          <Text
            style={{
              color: appearanceMode.textColor,
              fontFamily: 'extrabold',
            }}
          >
            {Users.username} is blocked
          </Text>
        </View>
      )}
    </>
  )
}

export default ChatBox