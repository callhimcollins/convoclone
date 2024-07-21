import { Image, Platform, ScrollView, Text, View, TouchableOpacity, Linking } from 'react-native'
import React, { useEffect, useState } from 'react'
import { chatType } from '@/types'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import {  Ionicons } from '@expo/vector-icons'
import moment from 'moment'
import { router } from 'expo-router'
import Animated, {  FadeInRight, LightSpeedInRight } from 'react-native-reanimated'
import { addToUserCache, setReplyChat } from '@/state/features/chatSlice'
import { supabase } from '@/lib/supabase'
import { getUserData } from '@/state/features/userSlice'
import RemoteImage from '@/components/RemoteImage'
import Hyperlink from 'react-native-hyperlink'
import UrlPreview from '@/components/UrlPreview'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import RemoteVideo from '@/components/RemoteVideo'
import { Audio, InterruptionModeAndroid, InterruptionModeIOS, ResizeMode } from 'expo-av'
import { BlurView } from 'expo-blur'
import { randomUUID } from 'expo-crypto'
import { setAudioState, setFullScreenSource, setShowFullScreen, togglePlayPause } from '@/state/features/mediaSlice'


const ChatBox = ({ id, chat_id, Users, content, files, audio, dateCreated, convo_id, replyChat, user_id }:chatType) => {
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
  const [userIsBlocked, setUserIsBlocked] = useState(false)
  const [userIsBlockedInReply, setUserIsBlockedInReply] = useState(false)
  const [urlPresent, setUrlPresent] = useState(false)
  const [url, setUrl] = useState('')
  const dispatch = useDispatch()
  const styles = getStyles(appearanceMode)
  const formattedTime = moment.utc(dateCreated).local().format('HH:mm')
  const [profileAudio, setProfileAudio] = useState<string | null>(null)
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(true)
  const [chatAudio, setChatAudio] = useState<string | null>(null)
  const audioState = useSelector((state:RootState) => state.media.audioState)

  
  const playPauseAudio = async (audioType: 'profile' | 'chat', audioSource: string, chatId?: string) => {
    try {
      // Configure audio session
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });
  
      // Stop all other playing sounds
      await Audio.setIsEnabledAsync(false);
      await Audio.setIsEnabledAsync(true);
  
      // Unload any existing sound
      if (sound) {
        // Check if switching between profile and chat
        if ((audioType === 'chat' && audioState.currentlyPlayingAudioID === 'profile') ||
            (audioType === 'profile' && audioState.currentlyPlayingAudioID !== 'profile')) {
          dispatch(setAudioState({ currentlyPlayingAudioID: audioType === 'chat' ? chatId : 'profile', isPaused: true }));
          await sound.unloadAsync();
          setSound(null);
        } else if (audioType === 'chat' && audioState.currentlyPlayingAudioID !== chatId) {
          await sound.unloadAsync();
          setSound(null);
        } else if ((audioType === 'chat' && audioState.currentlyPlayingAudioID === chatId) ||
                   (audioType === 'profile' && audioState.currentlyPlayingAudioID === 'profile')) {
          if (isPaused) {
            await sound.playAsync();
            setIsPaused(false);
            dispatch(setAudioState({ currentlyPlayingAudioID: audioType === 'chat' ? chatId : 'profile', isPaused: false }));
          } else {
            await sound.pauseAsync();
            setIsPaused(true);
            dispatch(setAudioState({ currentlyPlayingAudioID: audioType === 'chat' ? chatId : 'profile', isPaused: true }));
          }
          return; // Exit the function here as we've handled the play/pause
        }
      }
  
      if (audioSource) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioSource },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPaused(false);
  
        if (audioType === 'chat' && chatId) {
          dispatch(setAudioState({ currentlyPlayingAudioID: chatId, isPaused: false }));
        }
  
        newSound.setOnPlaybackStatusUpdate(async (status: any) => {
          if (status.didJustFinish) {
            setIsPaused(true);
            await newSound.setPositionAsync(0);
            if (audioType === 'chat' && chatId) {
              dispatch(setAudioState({ currentlyPlayingAudioID: chatId, isPaused: true }));
            }
          }
        });
      } else {
        dispatch(setSystemNotificationState(true));
        dispatch(setSystemNotificationData({ type: 'neutral', message: 'Nothing To Play' }));
      }
    } catch (error) {
      dispatch(setSystemNotificationState(true));
      dispatch(setSystemNotificationData({ type: 'error', message: `An Error Occured` }));
    }
  };
  

  const fetchAudioProfile = async () => {
      try {
          const { data } = await supabase.storage
          .from('userfiles')
          .getPublicUrl(String(Users?.audio));
          if(data) {
              setProfileAudio(data.publicUrl)
          }
      } catch (error) {
          dispatch(setSystemNotificationState(true))
          dispatch(setSystemNotificationData({ type: 'error', message: "An Error Occured"}))
      }
  }

  useEffect(() => {
      if(Users?.audio) {
          fetchAudioProfile()
      }
  }, [])
  
  const extractLink = () => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = content.match(urlRegex);
    if (match && match[0]) {
      setUrl(match[0]);
      setUrlPresent(true);
    } else {
      setUrl('');
      setUrlPresent(false);
    }
  };
  

  useEffect(() => {
    extractLink()
  }, [extractLink])
  
  const handleOpenLink = async () => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      dispatch(setSystemNotificationState(true));
      dispatch(setSystemNotificationData({ type: 'error', message: "Couldn't open link" }));
    }
  };
  
  const handleProfileNavigation = () => {
    dispatch(getUserData(Users))
    router.push({
      pathname: '/(profile)/[profileID]',
      params: {
        profileID: Users.user_id
      }
    })
  }
 
  const handleReplyChat = () => {
    dispatch(setReplyChat({chat_id, content: audio ? `Voice note at ${formattedTime}` : content, convo_id, username: Users.username, user_id: Users.user_id }));
  }

  const checkBlockedUser = async () => {
    const { data, error } = await supabase
    .from('blockedUsers')
    .select('*')
    .eq('user_id', String(authenticatedUserData?.user_id))
    .eq('blockedUserID', String(Users.user_id) || String(replyChat?.user_id))
    .single()
    if(data) {
      setUserIsBlocked(true)
      setUserIsBlockedInReply(true)
    } else if(error){
      setUserIsBlocked(false)
      setUserIsBlockedInReply(false)
    }
  }
  
  
  const checkBlockedUserInReplyBox = async () => {
    const { data, error } = await supabase
    .from('blockedUsers')
    .select('*')
    .eq('user_id', String(authenticatedUserData?.user_id))
    .eq('blockedUserID', String(replyChat?.user_id))
    .single()
    
    if(data) {
      setUserIsBlockedInReply(true)
      } else setUserIsBlockedInReply(false)
    }
  
  useEffect(() => {
    checkBlockedUser()
    checkBlockedUserInReplyBox()
  }, [])

  const handleShowFullScreen = (file:string) => {
    dispatch(setShowFullScreen(true))
    dispatch(setFullScreenSource({file, convoStarter: String(content)}))
    dispatch(togglePlayPause({ index: file + String(randomUUID()) }))
  }

  const getAudio = async () => {
    const { data } = await supabase.storage
    .from('userfiles')
    .getPublicUrl(String(audio));
    if(data) {
      setChatAudio(data.publicUrl)
    } else {
      console.log('No data')
    }
  }


  useEffect(() => {
    if(audio) {
      getAudio()
    }
  }, [audio])

  return (
    <>
      { !userIsBlocked && <Animated.View key={String(chat_id)} entering={Platform.OS === 'android' ? FadeInRight : LightSpeedInRight.springify().damping(20)} style={[styles.container]}>
        <TouchableOpacity onPress={handleReplyChat}>
        <View style={styles.header}>
          <TouchableOpacity onLongPress={() => playPauseAudio('profile', String(profileAudio), String(Users.user_id))} onPress={handleProfileNavigation} style={styles.headerLeft}>
            { !Users?.isRobot && Users && <RemoteImage skeletonHeight={styles.profileImage.height} skeletonWidth={styles.profileImage.width} path={`${Users?.username}-profileImage`} style={styles.profileImage}/>}
            { !Users?.isRobot && <Text style={styles.username}>{Users?.username}</Text>}
            { Users?.isRobot && <Text style={styles.username}>Dialogue Robot</Text>}
          </TouchableOpacity>

          
        </View>

        <View>
          { replyChat && <TouchableOpacity style={styles.replyChatContainer}>
            <View style={styles.replyChatTextContainer}>
              <View style={styles.replyChatSideBar}/>

              { !userIsBlockedInReply && <View>
                <Text style={styles.replyChatUsername}>{replyChat?.username.split('-')[0]}</Text>
                <Text numberOfLines={3} ellipsizeMode='tail' style={styles.replyChatContent}>{replyChat?.content}</Text>
              </View>}
              { userIsBlockedInReply && <View>
                <Text style={styles.replyChatUsername}>{replyChat.username} is blocked</Text>
              </View>}
            </View>
          </TouchableOpacity>}

          <View style={styles.contentContainer}>
            { files?.length === 1 && 
            <View style={styles.mediaContainerView}>
              {files[0].endsWith('.mp4') ?
              <TouchableOpacity onPress={() => handleShowFullScreen(files[0])} style={{ width: '100%', alignItems: 'center', justifyContent: 'center'}}>
                <View style={{ zIndex: 100, position: 'absolute', justifyContent: 'center' }}>
                <BlurView style={{  borderRadius: 15, overflow: 'hidden', paddingHorizontal: 30, paddingVertical: 10  }}>
                  <Text style={{ color: 'white', textAlign: 'center', fontFamily: 'extrabold', fontSize: 15 }}>Video</Text>
                </BlurView>
                </View>
                <RemoteVideo 
                resizeMode={ResizeMode.COVER} 
                style={[styles.chatMedia, { width: '100%', marginBottom: 10, marginRight: 0  }]} 
                path={files[0]} 
                />
              </TouchableOpacity> 
               : 
              <TouchableOpacity onPress={() => handleShowFullScreen(files[0])} style={{ width: '100%', alignItems: 'center', justifyContent: 'center'}}>
                <RemoteImage style={[styles.chatMedia, { width: '100%', marginBottom: 10, marginRight: 0 }]} path={files[0]} key={files[0]}/>
               </TouchableOpacity>
               }
            </View>}
            {  files?.length && files?.length > 1 &&<ScrollView showsHorizontalScrollIndicator={false} style={{ borderRadius: 10, marginBottom: 10 }} horizontal>
              {
                files?.map((file, index) => (
                  <View key={index}>
                   { file.endsWith('.mp4') ? 
                   <TouchableOpacity onPress={() => handleShowFullScreen(file)} style={{ width: '100%', alignItems: 'center', justifyContent: 'center'}}>
                   <View style={{ zIndex: 100, position: 'absolute', justifyContent: 'center' }}>
                    <BlurView style={{  borderRadius: 15, overflow: 'hidden', paddingHorizontal: 30, paddingVertical: 10 }}>
                      <Text style={{ color: 'white', textAlign: 'center', fontFamily: 'extrabold', fontSize: 15 }}>Video</Text>
                    </BlurView>
                   </View>
                   <RemoteVideo 
                   resizeMode={ResizeMode.COVER} 
                   style={styles.chatMedia} 
                   path={file} 
                   />
                 </TouchableOpacity>  
                   :
                    <TouchableOpacity onPress={() => handleShowFullScreen(file)}  key={index}>
                      <RemoteImage style={styles.chatMedia} path={file}/>
                    </TouchableOpacity>}
                  </View>
                ))
              }
            </ScrollView>}
            {audio && (
                <TouchableOpacity onPress={() => playPauseAudio('chat', String(chatAudio), String(chat_id))} style={styles.playAudioContainer}>
                    { audioState.currentlyPlayingAudioID === String(chat_id) && <Ionicons name={ audioState.isPaused ? 'mic' : 'pause'} size={24} color={appearanceMode.primary} />}
                    { audioState.currentlyPlayingAudioID !== String(chat_id) && <Ionicons name={'mic'} size={24} color={appearanceMode.primary} />}

                </TouchableOpacity>
              )}
              <View>
                <Hyperlink linkDefault={true} linkStyle={{ color: appearanceMode.primary }}>
                  <Text style={styles.chat}>{content}</Text>
                </Hyperlink>
                { urlPresent && 
                  <TouchableOpacity onPress={handleOpenLink} style={{}}>
                    <UrlPreview url={url}/>
                  </TouchableOpacity>
                  }
              </View>
          </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{ formattedTime }</Text>
         </View>
        </View>
        </TouchableOpacity>
      </Animated.View>}

      { userIsBlocked && 
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }]}>
          <Text style={{ color: appearanceMode.textColor, fontFamily: 'extrabold' }}>{Users.username} is blocked</Text>
        </View>}
      </>
  )
}

export default ChatBox