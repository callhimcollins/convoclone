import { Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { userType } from '@/types'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { getUserData } from '@/state/features/userSlice'
import RemoteImage from '@/components/RemoteImage'
import { supabase } from '@/lib/supabase'
import {
  setSystemNotificationData,
  setSystemNotificationState,
} from '@/state/features/notificationSlice'
import { setAudioState } from '@/state/features/mediaSlice'
import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio'

const ProfileCard = ({
  name,
  username,
  profileImage,
  user_id,
  id,
  email,
  bio,
  audio,
  dateCreated,
  lastUpdated,
  backgroundProfileImage,
  links,
  isRobot,
}: userType) => {
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const audioState = useSelector((state: RootState) => state.media.audioState)

  const [profileAudio, setProfileAudio] = useState('')

  const styles = getStyles(appearanceMode)
  const dispatch = useDispatch()

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

  const handleProfileNavigation = () => {
    safePausePlayer()

    dispatch(
      getUserData({
        id,
        user_id,
        email,
        profileImage,
        username,
        name,
        bio,
        audio,
        dateCreated,
        lastUpdated,
        backgroundProfileImage,
        links,
        isRobot,
      })
    )

    router.push({
      pathname: '/(profile)/[profileID]',
      params: {
        profileID: user_id,
      },
    })
  }

  const fetchAudio = useCallback(async () => {
    const { data } = supabase.storage.from('userfiles').getPublicUrl(String(audio))

    if (data?.publicUrl) {
      setProfileAudio(data.publicUrl)
    } else {
      console.log('Could Not Fetch Audio For Profile Card')
    }
  }, [audio])

  const playPauseAudioProfile = async () => {
    try {
      if (!profileAudio) {
        notify('neutral', 'Nothing To Play')
        return
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      })

      const sameAudioIsSelected = audioState.currentlyPlayingAudioID === user_id

      if (sameAudioIsSelected && playerStatus.playing) {
        const paused = safePausePlayer()

        if (paused) {
          dispatch(
            setAudioState({
              currentlyPlayingAudioID: user_id,
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

      const replaced = safeReplacePlayer(profileAudio)

      if (!replaced) {
        notify('error', 'An Error Occurred')
        return
      }

      safeSeekPlayer(0)

      const played = safePlayPlayer()

      if (played) {
        dispatch(
          setAudioState({
            currentlyPlayingAudioID: user_id,
            isPaused: false,
          })
        )
      } else {
        notify('error', 'An Error Occurred')
      }
    } catch (error) {
      console.log(error)
      notify('error', 'An Error Occurred')
    }
  }

  useEffect(() => {
    if (audio) {
      fetchAudio()
    }
  }, [audio, fetchAudio])

  useEffect(() => {
    if (!playerStatus.playing) {
      const finished =
        playerStatus.duration > 0 &&
        Math.abs(playerStatus.duration - playerStatus.currentTime) < 0.3

      if (finished) {
        safeSeekPlayer(0)

        dispatch(
          setAudioState({
            currentlyPlayingAudioID: user_id,
            isPaused: true,
          })
        )
      }
    }
  }, [
    playerStatus.playing,
    playerStatus.currentTime,
    playerStatus.duration,
    user_id,
    dispatch,
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
        <RemoteImage path={profileImage} style={styles.image} />

        <TouchableOpacity onPress={playPauseAudioProfile} style={styles.audioButton}>
          <Feather name="volume-2" size={25} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.middleContainer}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.name}>
          {name}
        </Text>

        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.username}>
          {username?.split('-')[0]}
        </Text>
      </View>

      <TouchableOpacity onPress={handleProfileNavigation} style={styles.viewButton}>
        <Text style={styles.viewText}>View</Text>
      </TouchableOpacity>
    </View>
  )
}

export default ProfileCard