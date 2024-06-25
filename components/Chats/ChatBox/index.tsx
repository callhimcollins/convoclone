import { Image, Platform, ScrollView, Text, View, TouchableOpacity, Linking } from 'react-native'
import React, { useEffect, useState } from 'react'
import { chatType, userType } from '@/types'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { Feather } from '@expo/vector-icons'
import moment from 'moment'
import { router } from 'expo-router'
import Animated, {  FadeInRight, FlipInXDown, LightSpeedInRight, SlideInRight } from 'react-native-reanimated'
import { setReplyChat } from '@/state/features/chatSlice'
import { supabase } from '@/lib/supabase'
import { getUserData } from '@/state/features/userSlice'
import RemoteImage from '@/components/RemoteImage'
import Hyperlink from 'react-native-hyperlink'
import UrlPreview from '@/components/UrlPreview'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'



const ChatBox = ({ id, chat_id, audio, userData, content, files, dateCreated, convo_id, replyChat, user_id }:chatType) => {
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
  const [user, setUser] = useState<userType>()
  const [userIsBlocked, setUserIsBlocked] = useState(false)
  const [userIsBlockedInReply, setUserIsBlockedInReply] = useState(false)
  const [urlPresent, setUrlPresent] = useState(false)
  const [url, setUrl] = useState('')
  const dispatch = useDispatch()
  const styles = getStyles(appearanceMode)
  const formattedTime = moment.utc(dateCreated).local().format('HH:mm')
  const formattedContent = content.startsWith('https://') ? content.toLowerCase() : `https://${content}`.toLowerCase()

  const fetchUserData = async () => {
    const { data, error } = await supabase
    .from('Users')
    .select('*')
    .eq('user_id', String(user_id))
    .single()
    if(!error) {
      setUser(data)
    }
  }

  useEffect(() => {
    fetchUserData()
    extractLink()
  }, [])

  const extractLink = () => {
    const urlRegex = /\b(https?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    const matches = formattedContent.match(urlRegex);

    if (matches) {
      const validMatches = matches.filter((url) => {
        try {
          const trimmedUrl = url.trim(); // Trim the URL to remove any leading or trailing spaces
          new URL(trimmedUrl);
          return true;
        } catch (error) {
          return false;
        }
      });
      if (validMatches.length > 0) {
        setUrlPresent(true);
        setUrl(validMatches[0].trim()); // Set the first valid URL after trimming
      } else {
        setUrlPresent(false); // No valid URLs found
        setUrl(''); // Reset URL state
      }
    } else {
      setUrlPresent(false); // No URLs found
      setUrl(''); // Reset URL state
    }
  };


  useEffect(() => {
    fetchUserData();
    extractLink();
  }, []);

  const handleOpenLink = async () => {
    // Use the trimmed url state here
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      dispatch(setSystemNotificationState(true));
      dispatch(setSystemNotificationData({ type: 'error', message: "Couldn't open link" }));
    }
  };

  const handleProfileNavigation = () => {
    dispatch(getUserData(userData))
    router.push({
      pathname: '/(profile)/[profileID]',
      params: {
        profileID: userData.user_id
      }
    })
  }
 
  const handleReplyChat = () => {
    dispatch(setReplyChat({chat_id, content, convo_id, username: userData.username, user_id: userData.user_id }));
  }

  const checkBlockedUser = async () => {
    const { data, error } = await supabase
    .from('blockedUsers')
    .select('*')
    .eq('user_id', String(authenticatedUserData?.user_id))
    .eq('blockedUserID', String(userData.user_id) || String(replyChat?.user_id))
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


  return (
    <>
      { !userIsBlocked && <Animated.View entering={Platform.OS === 'android' ? FadeInRight : LightSpeedInRight.springify().damping(20)} style={[styles.container]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleProfileNavigation} style={styles.headerLeft}>
            {/* <RemoteImage path={userData?.profileImage} style={styles.profileImage}/> */}
            <Image style={styles.profileImage} source={require('@/assets/images/blankprofile.png')}/>
            <Text style={styles.username}>{user?.username}</Text>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity>
                { audio && <Feather name='volume-2' size={24} color={'gray'}/>}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleReplyChat}>
          { replyChat && <TouchableOpacity style={styles.replyChatContainer}>
            <View style={styles.replyChatTextContainer}>
              <View style={styles.replyChatSideBar}/>

              { !userIsBlockedInReply && <View>
                <Text style={styles.replyChatUsername}>{replyChat?.username}</Text>
                <Text numberOfLines={3} ellipsizeMode='tail' style={styles.replyChatContent}>{replyChat?.content}</Text>
              </View>}

              { userIsBlockedInReply && <View>
                <Text style={styles.replyChatUsername}>{replyChat.username} is blocked</Text>
              </View>}
            </View>
          </TouchableOpacity>}

          <View style={styles.contentContainer}>
            { files?.length === 1 && <View style={styles.mediaContainerView}>
              <Image style={[styles.chatMedia, { width: '100%', marginBottom: 10 }]} source={{ uri: files[0] }} key={files[0]}/>
            </View>}
            {  files?.length && files?.length > 1 &&<ScrollView showsHorizontalScrollIndicator={false} style={{ borderRadius: 10, marginBottom: 10 }} horizontal>
              {
                files?.map((file, index) => (
                  <Image style={styles.chatMedia} source={{ uri: file }} key={index}/>
                ))
              }
            </ScrollView>}
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
        </TouchableOpacity>

      </Animated.View>}

      { userIsBlocked && 
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingVertical: 30 }]}>
          <Text style={{ color: appearanceMode.textColor, fontFamily: 'extrabold' }}>{userData.username} is blocked</Text>
        </View>}
      </>
  )
}

export default ChatBox

