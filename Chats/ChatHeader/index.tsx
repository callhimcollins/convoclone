import { Platform, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { BlurView } from 'expo-blur'
import getStyles from './styles'
import { Entypo, Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { getUserData } from '@/state/features/userSlice'
import { supabase } from '@/lib/supabase'
import RemoteImage from '@/components/RemoteImage'
import { setShowModal } from '@/state/features/chatSlice'
import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio'
import { setAudioState } from '@/state/features/mediaSlice'
import {
  setSystemNotificationData,
  setSystemNotificationState,
} from '@/state/features/notificationSlice'

const ChatHeader = () => {
  const gesture = Gesture.Pan()
  const convoData = useSelector((state: RootState) => state.chat.convo)
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const audioState = useSelector((state: RootState) => state.media.audioState)

  const [convoAudio, setConvoAudio] = useState<string | null>(null)

  const dispatch = useDispatch()
  const styles = getStyles(appearanceMode)
  const router = useRouter()

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

  const handleBackButton = () => {
    safePausePlayer()
    router.back()
  }

  const handleProfileNavigation = () => {
    dispatch(getUserData(convoData.userData || convoData.Users))

    if (convoData.userData || convoData.Users) {
      router.push({
        pathname: '/(profile)/[profileID]',
        params: {
          profileID: String(convoData.userData?.user_id || convoData.Users?.user_id),
        },
      })
    }
  }

  const handleShowModal = () => {
    dispatch(setShowModal(true))
  }

  const fetchConvoAudio = useCallback(async () => {
    try {
      if (!convoData.audio) {
        setConvoAudio(null)
        return
      }

      const { data } = supabase.storage
        .from('userfiles')
        .getPublicUrl(String(convoData.audio))

      if (data?.publicUrl) {
        setConvoAudio(data.publicUrl)
      }
    } catch (error) {
      console.log(error)
      notify('error', 'Unable to fetch audio')
    }
  }, [convoData.audio, notify])

  const playPauseAudio = async (
    audioType: 'profile' | 'convo',
    audioSource: string | null,
    convo_id?: string
  ) => {
    if (!convoData.audio) {
      notify('neutral', 'This Convo Has No Audio')
      return
    }

    if (!audioSource) {
      notify('neutral', 'Nothing To Play')
      return
    }

    const audioID = audioType === 'convo' ? convo_id : 'profile'

    if (!audioID) {
      notify('neutral', 'Nothing To Play')
      return
    }

    try {
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

  useEffect(() => {
    fetchConvoAudio()
  }, [fetchConvoAudio])

  useEffect(() => {
    if (!playerStatus.playing && playerStatus.currentTime > 0 && playerStatus.duration > 0) {
      const finished = Math.abs(playerStatus.duration - playerStatus.currentTime) < 0.3

      if (finished) {
        const audioID = String(convoData?.convo_id)

        dispatch(
          setAudioState({
            currentlyPlayingAudioID: audioID,
            isPaused: true,
          })
        )

        safeSeekPlayer(0)
      }
    }
  }, [
    playerStatus.playing,
    playerStatus.currentTime,
    playerStatus.duration,
    convoData?.convo_id,
    dispatch,
    safeSeekPlayer,
  ])

  useEffect(() => {
    return () => {
      safePausePlayer()
    }
  }, [safePausePlayer])

  const renderProfileImage = () => {
    if (convoData?.Users === undefined) {
      return (
        <RemoteImage
          skeletonHeight={styles.profileImage.height}
          skeletonWidth={styles.profileImage.width}
          path={convoData?.userData?.profileImage}
          style={styles.profileImage}
        />
      )
    }

    if (convoData?.userData === undefined) {
      return (
        <RemoteImage
          skeletonHeight={styles.profileImage.height}
          skeletonWidth={styles.profileImage.width}
          path={convoData?.Users?.profileImage}
          style={styles.profileImage}
        />
      )
    }

    return null
  }

  const renderHeader = () => {
    if (Platform.OS === 'android' || appearanceMode.name === 'light') {
      return (
        <View
          style={[
            styles.container,
            {
              elevation: 10,
              backgroundColor: appearanceMode.backgroundColor,
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleProfileNavigation} style={styles.usernameContainer}>
              {renderProfileImage()}
              <Text style={styles.username}>
                {convoData?.userData?.username || convoData?.Users?.username}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleBackButton}>
              <Entypo name="chevron-left" size={26} color={appearanceMode.textColor} />
            </TouchableOpacity>

            <TouchableOpacity
              onLongPress={() =>
                playPauseAudio('convo', convoAudio, String(convoData?.convo_id))
              }
              onPress={handleShowModal}
              style={styles.convoStartContainer}
            >
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.footerText}>
                {convoData.convoStarter}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleShowModal}>
              <Feather name="more-vertical" size={26} color={appearanceMode.textColor} />
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return (
      <BlurView
        tint={appearanceMode.name === 'light' ? 'light' : 'dark'}
        intensity={80}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleProfileNavigation} style={styles.usernameContainer}>
            {renderProfileImage()}
            <Text style={styles.username}>
              {convoData?.userData?.username || convoData?.Users?.username}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBackButton}>
            <Entypo name="chevron-left" size={26} color={appearanceMode.textColor} />
          </TouchableOpacity>

          <TouchableOpacity
            onLongPress={() =>
              playPauseAudio('convo', convoAudio, String(convoData?.convo_id))
            }
            onPress={handleShowModal}
            style={styles.convoStartContainer}
          >
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.footerText}>
              {convoData?.convoStarter}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShowModal}>
            <Feather name="more-vertical" size={26} color={appearanceMode.textColor} />
          </TouchableOpacity>
        </View>
      </BlurView>
    )
  }

  return <GestureDetector gesture={gesture}>{renderHeader()}</GestureDetector>
}

export default ChatHeader