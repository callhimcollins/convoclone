import { Image, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { userType } from '@/types'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { getUserData } from '@/state/features/userSlice'
import RemoteImage from '@/components/RemoteImage'
import { supabase } from '@/lib/supabase'
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import { setAudioState } from '@/state/features/mediaSlice'

const ProfileCard = ({name, username, profileImage, user_id, id, email, bio, audio, convos, dateCreated, lastUpdated, backgroundProfileImage, links, isRobot}:userType) => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const [profileAudio, setProfileAudio] = useState('')
    const styles = getStyles(appearanceMode)
    const dispatch = useDispatch()
    const audioState = useSelector((state: RootState) => state.media.audioState)
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPaused, setIsPaused] = useState(true)

    const handleProfileNavigation = () => {
        dispatch(getUserData({
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
            isRobot
        }))
        router.push({
          pathname: '/(profile)/[profileID]',
          params: {
            profileID: user_id
          }
        })
      }

      const fetchAudio = async () => {
        const { data } = await supabase.storage
        .from('userfiles')
        .getPublicUrl(String(audio));
        if(data) {
            setProfileAudio(data.publicUrl)
        } else {
            console.log('Could Not Fetch Audio For Profile Card')
        }
      }

      useEffect(() => {
        if(audio) {
            fetchAudio()
        }
      }, [])

      const playPauseAudioProfile = async () => {
        try { 
          // Configure audio session
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          });
      
          // Stop all other playing sounds
          await Audio.setIsEnabledAsync(false);
          await Audio.setIsEnabledAsync(true);
          
          if (sound) {
            if (isPaused && audioState.currentlyPlayingAudioID === user_id) {
              await sound.playAsync();
              setIsPaused(false);
            } else if(!isPaused && audioState.currentlyPlayingAudioID === user_id) {
              await sound.pauseAsync();
              setIsPaused(true);
            }
          } else if (profileAudio) {
            const { sound: newSound } = await Audio.Sound.createAsync(
              { uri: profileAudio },
              { shouldPlay: true }
            );
            setSound(newSound);
            setIsPaused(false);
            dispatch(setAudioState({ currentlyPlayingAudioID: user_id, isPaused: false }));
            newSound.setOnPlaybackStatusUpdate(async (status:any) => {
              if (status.didJustFinish) {
                setIsPaused(true);
                await newSound.setPositionAsync(0);
              }
            });
          } else {
            dispatch(setSystemNotificationState(true));
            dispatch(setSystemNotificationData({ type: 'neutral', message: `Nothing To Play` }));
          }
        } catch (error) {
          dispatch(setSystemNotificationState(true));
          dispatch(setSystemNotificationData({ type: 'error', message: 'An Error Occurred' }));
        }
      };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <RemoteImage path={profileImage} style={styles.image}/>

                <TouchableOpacity onPress={playPauseAudioProfile} style={styles.audioButton}>
                    <Feather name='volume-2' size={25} color={'white'}/>
                </TouchableOpacity>  
            </View>

            <View style={styles.middleContainer}>
                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.name}>{name}</Text>
                <Text numberOfLines={1} ellipsizeMode='tail' style={styles.username}>{username?.split('-')[0]}</Text>
            </View>

            <TouchableOpacity onPress={handleProfileNavigation} style={styles.viewButton}>
                <Text style={styles.viewText}>View</Text>
            </TouchableOpacity>
        </View>
    )
}

export default ProfileCard

