import { Dimensions, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Gesture, GestureDetector, TextInput } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { setReplyChat } from '@/state/features/chatSlice'

const initialKeyboardWidth = Dimensions.get('window').width * .5
const ChatFooter = () => {
  const gesture = Gesture.Pan()
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
  const convoData = useSelector((state:RootState) => state.chat.convo)
  const replyChat = useSelector((state:RootState) => state.chat.replyChat)
  const styles = getStyles(appearanceMode)
  const [keyboardPaddingBottom, setKeyboardPaddingBottom] = useState(23)
  const [activeUsers, setActiveUsers] = useState<Array<String>>([])
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState<string>()
  const expansionWidth = useSharedValue(initialKeyboardWidth)
  const { convoID } = useLocalSearchParams()
  const dispatch = useDispatch()
  const chatData = {
    convo_id: convoID,
    user_id: authenticatedUserData?.user_id,
    content,
    files: null,
    audio: null,
    userData: authenticatedUserData,
    replyChat,
  }

  const notificationDataForReplyChat = {
    sender_id: authenticatedUserData?.user_id,
    senderUserData: authenticatedUserData,
    receiver_id: replyChat?.user_id,
    data: chatData,
    type: 'reply',
    convo: convoData
  }

  const isContentEmpty = (text:any) => {
    return !text || text.trim() === '';
  }

  const sendChat = async () => {
    if(isContentEmpty(content)) {
      return;
    }
    if(content) {
      const { error }:any = await supabase
      .from('Chats')
      .insert([chatData])
      .eq('convo_id', String(convoID))
      .single()

      if(!error) {
        setContent('')
        updateConvoLastChat()
        if(replyChat){
          sendNotificationForReplyChatInApp()
          dispatch(setReplyChat(null))
        }
      }
      if(error) {
        console.log(error.message)
      }
    }
  }

  const sendNotificationForReplyChatInApp = async () => {
    if(activeUsers.includes(replyChat.user_id)) {
        return
    } else {
      const { data, error } = await supabase
      .from('blockedUsers')
      .select('*')
      .eq('user_id', replyChat.user_id)
      .eq('blockedUserID', String(authenticatedUserData?.user_id))
      .single()
      if(data) {
        return
      } else {
        const { error } = await supabase
        .from('notifications')
        .insert([notificationDataForReplyChat])
        .single()
        if(!error) {
  
        } else {
          console.log("Send notification error", error.message)
        }
      }
    }
  }


  const updateConvoLastChat = async () => {
    const { error } = await supabase
    .from('Convos')
    .update({lastChat: chatData})
    .eq('convo_id', String(convoID))
    .select()
    if(error) {
      console.log(error.message)
    }
  }


  const keyboardExpansionAnimation = useAnimatedStyle(() => {
    return {
      width: expansionWidth.value
    }
  })

  
  useEffect(() => {
    const userState = {
      user_id: authenticatedUserData?.user_id,
      username: authenticatedUserData?.username
      }
      const chatChannel = supabase.channel(`custom-checkusers-channel-${convoID}`)
      chatChannel
      .on(
        'presence',
      { event: 'sync' },
      () => {
        const newState = chatChannel.presenceState()
        const usersInRoom = Object.values(newState)
        const activeUserIDList = usersInRoom.flatMap(user => user)
        setActiveUsers(activeUserIDList.map(userID => userID.user_id))
        }
        ).subscribe(async (status) => {
          if(status !== 'SUBSCRIBED') {
        chatChannel.untrack()
        console.log('Status changed')
        return;
        }
        const presenceTrackStatus = await chatChannel.track(userState)
        console.log('user tracking...', presenceTrackStatus)
        })
        
        return () => {
          chatChannel.unsubscribe()
          }
    }, [convoID, authenticatedUserData])
          
      const handleKeyPress = () => {
      }

    useEffect(() => {
      if(!content) {
        expansionWidth.value = withTiming(initialKeyboardWidth, {duration: 300})
        setExpanded(false)
      } else {
        expansionWidth.value = withTiming(Dimensions.get('window').width * .8, {duration: 300})
        setExpanded(true)
      }
    }, [handleKeyPress])
  
  const renderChatFooter = () => {
    if(Platform.OS === 'android' || appearanceMode.name === 'light') {
      return (
        <View>
          { replyChat && replyChat.convo_id === convoID && <View style={styles.replyChatContainer}>
            <View style={styles.replyHeaderContainer}>
              <Text style={styles.replyTextHeader}>Replying to <Text style={styles.replyUsername}>{replyChat.username}</Text></Text>
              <TouchableOpacity onPress={() => dispatch(setReplyChat(null))}>
                <AntDesign color={appearanceMode.textColor} name='close' size={25}/>
              </TouchableOpacity>
            </View>
              <Text numberOfLines={3} ellipsizeMode='tail' style={styles.replyChat}>{ replyChat.content }</Text>
          </View>}
          <View style={[styles.container, { paddingBottom: keyboardPaddingBottom, backgroundColor: appearanceMode.backgroundColor }]}>
            <Animated.View style={[styles.inputContainer, keyboardExpansionAnimation]}>
              <TextInput 
                multiline
                value={content}
                onChangeText={(text) => setContent(text)}
                onKeyPress={handleKeyPress}
                onBlur={() => setKeyboardPaddingBottom(23)} 
                onFocus={() => setKeyboardPaddingBottom(5)} 
                style={styles.textInput}  
                placeholderTextColor={Platform.OS === 'android' ? appearanceMode.secondary : ''}
                placeholder='Type something...'/>
              { expanded && <TouchableOpacity onPress={sendChat}>
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>}
            </Animated.View>
            <View style={styles.middleContainer}>
              { !expanded && <TouchableOpacity style={styles.recordButton}>
                <MaterialCommunityIcons name='microphone' color={'white'} size={24}/>
              </TouchableOpacity>}
            </View>
            <TouchableOpacity>
              <Ionicons name='attach' color={appearanceMode.textColor} size={24} />
            </TouchableOpacity>
          </View>
      </View>)
    } else {
      return (
      <View>
          { replyChat && replyChat.convo_id === convoID && <Animated.View style={styles.replyChatContainer}>
            <View style={styles.replyHeaderContainer}>
              <Text style={styles.replyTextHeader}>Replying to <Text style={styles.replyUsername}>{ replyChat.username }</Text></Text>
              <TouchableOpacity onPress={() => dispatch(setReplyChat(null))}>
                <AntDesign color={appearanceMode.textColor} name='close' size={25}/>
              </TouchableOpacity>
            </View>
              <Text numberOfLines={3} ellipsizeMode='tail' style={styles.replyChat}>{ replyChat.content }</Text>
          </Animated.View>}
          <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'}  intensity={80} style={[styles.container, { paddingBottom: keyboardPaddingBottom }]}>
            <Animated.View style={[styles.inputContainer, keyboardExpansionAnimation]}>
              <TextInput
                multiline
                value={content}
                onChangeText={(text) => setContent(text)}
                onKeyPress={handleKeyPress}
                onBlur={() => setKeyboardPaddingBottom(23)} 
                onFocus={() => setKeyboardPaddingBottom(5)} 
                style={styles.textInput}  
                placeholder='Type something...'/>
              { expanded && <TouchableOpacity onPress={sendChat}>
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>}
            </Animated.View>
            <View style={styles.middleContainer}>
              { !expanded && <TouchableOpacity style={styles.recordButton}>
                <MaterialCommunityIcons name='microphone' color={'white'} size={24}/>
              </TouchableOpacity>}
            </View>

            <TouchableOpacity>
              <Ionicons name='attach' color={appearanceMode.textColor} size={24} />
            </TouchableOpacity>
          </BlurView>
        </View>
      )
    }
  }


  return (
    <GestureDetector gesture={gesture}>
      <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}>
        { renderChatFooter() }
      </KeyboardAvoidingView>
    </GestureDetector>
  )
}

export default ChatFooter

