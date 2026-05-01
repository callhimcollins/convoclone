import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  Dimensions,
  TextInput,
} from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { Entypo } from '@expo/vector-icons'
import { setActiveProfileTab, setShowProfileModal } from '@/state/features/userSlice'
import { linkType, userType } from '@/types'
import { useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import RemoteImage from '@/components/RemoteImage'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import {
  setSystemNotificationData,
  setSystemNotificationState,
} from '@/state/features/notificationSlice'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { sendPushNotification } from '@/pushNotifications'
import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio'

const DEVICE_WIDTH = Dimensions.get('window').width

const ProfileDetail = (user: userType) => {
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const userData = useSelector((state: RootState) => state.user.userData)
  const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
  const tabs = useSelector((state: RootState) => state.user.tabs)
  const activeTab = useSelector((state: RootState) => state.user.activeTab)

  const [isKeepingUp, setIsKeepingUp] = useState(false)
  const [addLinkContainerDisplay, setAddLinkContainerDisplay] = useState(false)
  const [showLinkNameInput, setShowLinkNameInput] = useState(false)
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [userLinks, setUserLinks] = useState<Array<linkType>>()
  const [url, setUrl] = useState('')
  const [validURL, setValidURL] = useState(true)
  const [audio, setAudio] = useState<string | null>(null)

  const { profileID } = useLocalSearchParams()

  const styles = getStyles(appearanceMode)
  const dispatch = useDispatch()

  const usernameContainerWidth = useSharedValue(DEVICE_WIDTH * 0.65)
  const usernameContainerOpacity = useSharedValue(1)

  const player = useAudioPlayer(null)
  const playerStatus = useAudioPlayerStatus(player)

  const notify = useCallback(
    (type: 'neutral' | 'error' | 'success', message: string) => {
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

  const handleActivetabButton = (index: Number) => {
    dispatch(setActiveProfileTab(index))
  }

  const openAddLinkContainer = () => {
    setAddLinkContainerDisplay(true)
    usernameContainerWidth.value = withTiming(0)
    usernameContainerOpacity.value = withTiming(0)
  }

  const closeAddLinkContainer = () => {
    setAddLinkContainerDisplay(false)
    usernameContainerWidth.value = withTiming(DEVICE_WIDTH * 0.65)
    usernameContainerOpacity.value = withTiming(1)
  }

  const onShowLinkNameInput = () => {
    setShowLinkNameInput(true)
  }

  const onHideLinkNameInput = () => {
    setShowLinkNameInput(false)
  }

  const playPauseAudioProfile = async () => {
    try {
      if (!audio) {
        notify('neutral', 'Nothing To Play')
        return
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      })

      if (playerStatus.playing) {
        safePausePlayer()
        return
      }

      try {
        await setIsAudioActiveAsync(false)
        await setIsAudioActiveAsync(true)
      } catch (error) {
        console.log('setIsAudioActiveAsync failed:', error)
      }

      const replaced = safeReplacePlayer(audio)

      if (!replaced) {
        notify('error', 'An Error Occurred')
        return
      }

      safeSeekPlayer(0)

      const played = safePlayPlayer()

      if (!played) {
        notify('error', 'An Error Occurred')
      }
    } catch (error) {
      notify('error', 'An Error Occurred')
    }
  }

  const fetchAudioProfile = useCallback(async () => {
    try {
      if (!user.audio) return

      const { data } = supabase.storage.from('userfiles').getPublicUrl(String(user.audio))

      if (data?.publicUrl) {
        setAudio(data.publicUrl)
      }
    } catch (error) {
      notify('error', 'An Error Occured')
    }
  }, [user.audio, notify])

  const onSaveLink = async () => {
    setShowLinkNameInput(false)
    setAddLinkContainerDisplay(false)
    usernameContainerOpacity.value = withTiming(1)
    usernameContainerWidth.value = withTiming(DEVICE_WIDTH * 0.65)

    try {
      const { data } = await supabase
        .from('Users')
        .select('*')
        .eq('user_id', String(profileID))
        .single()

      if (data) {
        const currentLinks = data.links || []
        const newLink = { name: linkName, url }
        const updatedLinks = [...currentLinks, newLink]

        setUserLinks(updatedLinks)

        const { error: updateError } = await supabase
          .from('Users')
          .update({ links: updatedLinks })
          .eq('user_id', String(profileID))

        if (updateError) {
          notify('error', 'Link Not Added')
        } else {
          notify('success', 'Link Added. Changes Will Not Reflect Instantly')
          setLinkName('')
          setLinkUrl('')
        }
      } else {
        console.log('User data not found')
      }
    } catch (error) {
      console.log(error)
    }
  }

  const deleteLink = async (linkID: linkType) => {
    if (profileID !== authenticatedUserData?.user_id) {
      return
    }

    try {
      const { data } = await supabase
        .from('Users')
        .select('*')
        .eq('user_id', String(authenticatedUserData?.user_id))
        .single()

      if (data) {
        const currentLinks = data.links || []
        const updatedLinks = currentLinks.filter((link: linkType) => link.url !== linkID.url)

        setUserLinks(updatedLinks)

        const { error: updateError } = await supabase
          .from('Users')
          .update({ links: updatedLinks })
          .eq('user_id', String(authenticatedUserData?.user_id))

        if (updateError) {
          notify('error', 'Link Not Deleted')
        } else {
          notify('success', 'Link Deleted. Changes Will Not Reflect Instantly')
        }
      }
    } catch (error) {
      console.log('Error performing delete link operation', error)
    }
  }

  const animatedUsernameContainerStyles = useAnimatedStyle(() => {
    return {
      width: usernameContainerWidth.value,
      opacity: usernameContainerOpacity.value,
    }
  })

  const extractLink = (link: string) => {
    const urlRegex = /(https?:\/\/)?([^\s]+)/i
    const match = link.match(urlRegex)

    if (match && match[0]) {
      let nextUrl = match[0]

      if (!nextUrl.startsWith('http://') && !nextUrl.startsWith('https://')) {
        nextUrl = 'https://' + nextUrl
      }

      setUrl(nextUrl)
      return true
    }

    setUrl('')
    return false
  }

  const handleUrlChange = (text: string) => {
    setLinkUrl(text.toLowerCase())
    setValidURL(extractLink(text))
  }

  const handleOpenLink = async (url: string) => {
    try {
      let nextUrl = url

      if (!nextUrl.startsWith('https://') && !nextUrl.startsWith('http://')) {
        nextUrl = `https://${nextUrl}`
      }

      const supported = await Linking.canOpenURL(nextUrl)

      if (supported) {
        await Linking.openURL(nextUrl)
      } else {
        console.log(`Don't know how to open URL: ${nextUrl}`)
      }
    } catch (error) {
      console.error('Error opening link:', error)
    }
  }

  const handleShowProfileModal = () => {
    dispatch(setShowProfileModal(true))
  }

  const keepUpData = {
    user_id: authenticatedUserData?.user_id,
    keepup_user_id: profileID,
    keepUpUserData: userData,
  }

  const notificationForKeepUp = {
    sender_id: authenticatedUserData?.user_id,
    senderUserData: authenticatedUserData,
    data: userData,
    receiver_id: profileID,
    type: 'userkeepup',
  }

  const sendNotificationForKeepUp = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('sender_id', String(authenticatedUserData?.user_id))
      .eq('data->>user_id', String(profileID))
      .single()

    if (data) {
      console.log('Notification exists')
    } else {
      const { data } = await supabase
        .from('blockedUsers')
        .select('*')
        .eq('user_id', String(userData?.user_id))
        .eq('blockedUserID', String(authenticatedUserData?.user_id))
        .single()

      if (data) {
        console.log('User blocked so keep up notification will not be sent')
      } else {
        const { error } = await supabase.from('notifications').insert([notificationForKeepUp]).single()

        if (!error) {
          console.log('Notification sent successfully')

          const { data } = await supabase
            .from('Users')
            .select('pushToken, user_id')
            .eq('user_id', userData?.user_id)
            .single()

          if (data) {
            sendPushNotification(
              data.pushToken,
              'Keep Up',
              `${authenticatedUserData?.username} started keeping up with you`,
              'profile',
              authenticatedUserData,
              null,
              data.user_id
            )
          }
        } else {
          console.log("Couldn't send notification", error.message)
        }
      }
    }

    if (error) {
      console.log("Couldn't fetch notification", error.message)
    }
  }

  const deleteNotificationForKeepUp = async () => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('sender_id', String(authenticatedUserData?.user_id))
      .eq('data->>user_id', String(profileID))
      .single()

    if (!error) {
      console.log('Notification deleted')
    } else {
      console.log("Couldn't delete notification", error.message)
    }
  }

  const handleKeepUp = useCallback(async () => {
    const { data } = await supabase
      .from('userKeepUps')
      .select('*')
      .eq('keepup_user_id', String(profileID))
      .eq('user_id', String(authenticatedUserData?.user_id))
      .single()

    if (data) {
      console.log('Already keeping up')
    } else {
      const { error } = await supabase.from('userKeepUps').insert([keepUpData]).single()

      if (!error) {
        console.log('Started keeping up')
        sendNotificationForKeepUp()
      } else {
        console.log("Couldn't keep up", error.message)
      }
    }
  }, [profileID, authenticatedUserData])

  const handleDrop = useCallback(async () => {
    const { error } = await supabase
      .from('userKeepUps')
      .delete()
      .eq('keepup_user_id', String(profileID))
      .eq('user_id', String(authenticatedUserData?.user_id))
      .single()

    if (!error) {
      console.log('Dropped')
      deleteNotificationForKeepUp()
    } else {
      console.log('Error dropping user', error.message)
    }
  }, [profileID, authenticatedUserData])

  const checkForKeepUp = useCallback(async () => {
    const { data } = await supabase
      .from('userKeepUps')
      .select('*')
      .eq('keepup_user_id', String(profileID))
      .eq('user_id', String(authenticatedUserData?.user_id))
      .single()

    if (data) {
      setIsKeepingUp(true)
    }
  }, [profileID, authenticatedUserData])

  useEffect(() => {
    if (user.audio) {
      fetchAudioProfile()
    }
  }, [user.audio, fetchAudioProfile])

  useEffect(() => {
    checkForKeepUp()
  }, [checkForKeepUp])

  useEffect(() => {
    const channel = supabase
      .channel(`keep-up-channel-${profileID}-${authenticatedUserData?.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'userKeepUps' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setIsKeepingUp(true)
        } else if (payload.eventType === 'DELETE') {
          setIsKeepingUp(false)
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!playerStatus.playing) {
      const finished =
        playerStatus.duration > 0 &&
        Math.abs(playerStatus.duration - playerStatus.currentTime) < 0.3

      if (finished) {
        safeSeekPlayer(0)
      }
    }
  }, [playerStatus.playing, playerStatus.currentTime, playerStatus.duration, safeSeekPlayer])

  useEffect(() => {
    return () => {
      safePausePlayer()
    }
  }, [safePausePlayer])

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <View style={styles.profileBackgroundImageContainer}>
          {userData?.username && (
            <RemoteImage path={`${userData?.backgroundProfileImage}`} style={styles.profileBackgroundImage} />
          )}

          <LinearGradient
            colors={
              appearanceMode.name === 'dark'
                ? [
                    'rgba(15, 14, 19, 0)',
                    'rgba(15, 14, 19, 0.02)',
                    'rgba(15, 14, 19, 0.04)',
                    'rgba(15, 14, 19, 0.06)',
                    'rgba(15, 14, 19, 0.08)',
                    'rgba(15, 14, 19, 0.1)',
                    'rgba(15, 14, 19, 0.12)',
                    'rgba(15, 14, 19, 0.14)',
                    'rgba(15, 14, 19, 0.16)',
                    'rgba(15, 14, 19, 0.18)',
                    'rgba(15, 14, 19, 0.2)',
                    'rgba(15, 14, 19, 0.22)',
                    'rgba(15, 14, 19, 0.24)',
                    'rgba(15, 14, 19, 0.26)',
                    'rgba(15, 14, 19, 0.28)',
                    'rgba(15, 14, 19, 0.3)',
                    'rgba(15, 14, 19, 0.32)',
                    'rgba(15, 14, 19, 0.34)',
                    'rgba(15, 14, 19, 0.36)',
                    'rgba(15, 14, 19, 0.38)',
                    'rgba(15, 14, 19, 0.4)',
                    'rgba(15, 14, 19, 0.42)',
                    'rgba(15, 14, 19, 0.44)',
                    'rgba(15, 14, 19, 0.46)',
                    'rgba(15, 14, 19, 0.48)',
                    'rgba(15, 14, 19, 0.5)',
                    'rgba(15, 14, 19, 0.52)',
                    'rgba(15, 14, 19, 0.54)',
                    'rgba(15, 14, 19, 0.56)',
                    'rgba(15, 14, 19, 0.58)',
                    'rgba(15, 14, 19, 0.6)',
                    'rgba(15, 14, 19, 0.62)',
                    'rgba(15, 14, 19, 0.64)',
                    'rgba(15, 14, 19, 0.66)',
                    'rgba(15, 14, 19, 0.68)',
                    'rgba(15, 14, 19, 0.7)',
                    'rgba(15, 14, 19, 0.72)',
                    'rgba(15, 14, 19, 0.74)',
                    'rgba(15, 14, 19, 0.76)',
                    'rgba(15, 14, 19, 0.78)',
                    'rgba(15, 14, 19, 0.8)',
                    'rgba(15, 14, 19, 0.82)',
                    'rgba(15, 14, 19, 0.84)',
                    'rgba(15, 14, 19, 0.86)',
                    'rgba(15, 14, 19, 0.88)',
                    'rgba(15, 14, 19, 0.9)',
                    'rgba(15, 14, 19, 0.92)',
                    'rgba(15, 14, 19, 0.94)',
                    'rgba(15, 14, 19, 0.96)',
                    'rgba(15, 14, 19, 0.98)',
                    'rgba(15, 14, 19, 1)',
                  ]
                : [
                    'rgba(255, 255, 255, 0)',
                    'rgba(255, 255, 255, 0.1)',
                    'rgba(255, 255, 255, 0.2)',
                    'rgba(255, 255, 255, 0.3)',
                    'rgba(255, 255, 255, 0.4)',
                    'rgba(255, 255, 255, 0.5)',
                    'rgba(255, 255, 255, 0.6)',
                    'rgba(255, 255, 255, 0.7)',
                    'rgba(255, 255, 255, 0.8)',
                    'rgba(255, 255, 255, 0.9)',
                    'rgba(255, 255, 255, 1)',
                  ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          />
        </View>

        <View style={styles.userDetailContainer}>
          <TouchableOpacity onPress={playPauseAudioProfile}>
            <RemoteImage
              skeletonHeight={styles.profileImage.height}
              skeletonWidth={styles.profileImage.width}
              style={styles.profileImage}
              path={`${userData?.profileImage}`}
            />
          </TouchableOpacity>

          <Animated.View style={[styles.usernameContainer, animatedUsernameContainerStyles]}>
            <TouchableOpacity onPress={handleShowProfileModal}>
              <Text style={styles.username}>{user.username?.split('-')[0]}</Text>

              {user.bio && (
                <Text numberOfLines={3} style={styles.bio}>
                  {user.bio}
                </Text>
              )}

              {!user.bio && <Text style={styles.bio}>No Bio. Tap For More Info</Text>}
            </TouchableOpacity>

            {user.links && user.links.length > 0 && (
              <ScrollView
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, alignItems: 'center' }}
                horizontal
              >
                {user.links.map((link) => (
                  <TouchableOpacity
                    key={link.url}
                    onLongPress={() => deleteLink(link)}
                    onPress={() => handleOpenLink(link.url)}
                    style={styles.linkContainer}
                  >
                    <Text style={styles.linkText}>{link.name}</Text>
                  </TouchableOpacity>
                ))}

                {profileID === authenticatedUserData?.user_id && (
                  <TouchableOpacity onPress={openAddLinkContainer} style={styles.linkContainer}>
                    <Entypo name="link" size={20} color={appearanceMode.secondary} />
                    <Text style={styles.linkText}>Add A Link</Text>
                  </TouchableOpacity>
                )}

                {profileID === authenticatedUserData?.user_id && (
                  <View>
                    <Text style={styles.linkText}>To Delete A Link, Long Press On The Link</Text>
                  </View>
                )}
              </ScrollView>
            )}

            {user.links === null && profileID === authenticatedUserData?.user_id && (
              <TouchableOpacity onPress={openAddLinkContainer} style={styles.linkContainer}>
                <Entypo name="link" size={20} color={appearanceMode.secondary} />
                <Text style={styles.linkText}>Add A Link</Text>
              </TouchableOpacity>
            )}

            {user.links && user.links.length === 0 && profileID === authenticatedUserData?.user_id && (
              <TouchableOpacity onPress={openAddLinkContainer} style={styles.linkContainer}>
                <Entypo name="link" size={20} color={appearanceMode.secondary} />
                <Text style={styles.linkText}>Add A Link</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          <Animated.View>
            {addLinkContainerDisplay && (
              <View>
                {!showLinkNameInput && (
                  <Animated.View>
                    <TextInput
                      value={linkUrl}
                      onChangeText={handleUrlChange}
                      style={{
                        backgroundColor: appearanceMode.faint,
                        padding: 10,
                        marginBottom: 10,
                        borderRadius: 7,
                        fontFamily: 'bold',
                        color: appearanceMode.textColor,
                        width: '100%',
                        maxWidth: DEVICE_WIDTH * 0.6,
                      }}
                      placeholder="Link URL"
                    />
                  </Animated.View>
                )}

                {showLinkNameInput && (
                  <Animated.View>
                    <TextInput
                      value={linkName}
                      onChangeText={setLinkName}
                      style={{
                        backgroundColor: appearanceMode.faint,
                        padding: 10,
                        marginBottom: 10,
                        borderRadius: 7,
                        fontFamily: 'bold',
                        color: appearanceMode.textColor,
                        width: '100%',
                        maxWidth: DEVICE_WIDTH * 0.6,
                      }}
                      placeholder="Link Name"
                    />
                  </Animated.View>
                )}
              </View>
            )}

            {addLinkContainerDisplay && (
              <View
                style={{
                  flexDirection: 'row',
                  width: DEVICE_WIDTH * 0.65,
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                {!showLinkNameInput && (
                  <TouchableOpacity
                    onPress={closeAddLinkContainer}
                    style={{
                      backgroundColor: 'rgba(227, 54, 41, 0.3)',
                      paddingHorizontal: 20,
                      paddingVertical: 7,
                      borderRadius: 7,
                    }}
                  >
                    <Text style={{ fontFamily: 'extrabold', color: 'rgb(227, 54, 41)' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}

                {showLinkNameInput && (
                  <TouchableOpacity
                    onPress={onHideLinkNameInput}
                    style={{
                      backgroundColor: 'rgba(227, 54, 41, 0.3)',
                      paddingHorizontal: 20,
                      paddingVertical: 7,
                      borderRadius: 7,
                    }}
                  >
                    <Text style={{ fontFamily: 'extrabold', color: 'rgb(227, 54, 41)' }}>
                      Back
                    </Text>
                  </TouchableOpacity>
                )}

                {!showLinkNameInput && validURL && (
                  <TouchableOpacity
                    disabled={linkUrl === ''}
                    onPress={onShowLinkNameInput}
                    style={{
                      backgroundColor:
                        linkUrl === '' ? appearanceMode.faint : 'rgba(98, 95, 224, 0.3)',
                      paddingHorizontal: 20,
                      paddingVertical: 7,
                      borderRadius: 7,
                    }}
                  >
                    <Text
                      style={{
                        color: linkUrl === '' ? appearanceMode.textColor : 'rgb(98, 95, 224)',
                        fontFamily: 'extrabold',
                      }}
                    >
                      Next
                    </Text>
                  </TouchableOpacity>
                )}

                {!validURL && (
                  <View>
                    <Text style={{ color: 'rgb(227, 54, 41)', fontFamily: 'extrabold' }}>
                      URL not valid
                    </Text>
                  </View>
                )}

                {showLinkNameInput && (
                  <TouchableOpacity
                    onPress={onSaveLink}
                    style={{
                      backgroundColor: 'rgba(98, 95, 224, 0.3)',
                      paddingHorizontal: 20,
                      paddingVertical: 7,
                      borderRadius: 7,
                    }}
                  >
                    <Text style={{ color: 'rgb(98, 95, 224)', fontFamily: 'extrabold' }}>
                      Save
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>
        </View>

        <View
          style={[
            styles.actionContainer,
            {
              justifyContent:
                authenticatedUserData?.user_id === profileID ? 'center' : 'space-between',
            },
          ]}
        >
          <View style={styles.tabContainer}>
            {tabs.map((tab, index) => {
              if (tabs[index] === activeTab) {
                return (
                  <TouchableOpacity onPress={() => handleActivetabButton(index)} key={index}>
                    <Text style={styles.activeTabText}>{tab}</Text>
                  </TouchableOpacity>
                )
              }

              return (
                <TouchableOpacity onPress={() => handleActivetabButton(index)} key={index}>
                  <Text style={styles.inactiveTabText}>{tab}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {authenticatedUserData && profileID !== authenticatedUserData.user_id && !isKeepingUp && (
            <TouchableOpacity onPress={handleKeepUp} style={styles.keepUpButton}>
              <Text style={styles.keepUpText}>Keep Up</Text>
            </TouchableOpacity>
          )}

          {authenticatedUserData && profileID !== authenticatedUserData.user_id && isKeepingUp && (
            <TouchableOpacity onPress={handleDrop} style={styles.dropButton}>
              <Text style={styles.dropText}>Drop</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  )
}

export default ProfileDetail