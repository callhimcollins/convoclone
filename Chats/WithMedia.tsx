import { Dimensions, Image, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { Gesture, GestureDetector, GestureHandlerRootView, ScrollView, TextInput } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from '@/components/Chats/ChatFooter/styles'
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { addToBotContext, addToInputState, setChatFiles, setReplyChat } from '@/state/features/chatSlice'
import { sendPushNotification } from '@/pushNotifications'
import { setFileUploading, setFiles } from '@/state/features/startConvoSlice'
import { decode } from 'base64-arraybuffer'
import { fileType } from '@/types'
import * as FileSystem from 'expo-file-system'
import { Video, ResizeMode } from 'expo-av'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import SystemNotification from '../Notifications/SystemNotifications'

interface videoPlayingProps {
  index: number | null
  playing: boolean
}
const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height
const WithMedia = () => {
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
  const [filePaths, setFilePaths] = useState<string[]>([])
  const [videoPlaying, setVideoPlaying] = useState<videoPlayingProps>({ index: null, playing: false })
  const inputStateForConvo = useSelector((state:RootState) => state.chat.inputState)
  const convoExists = useSelector((state:RootState) => state.chat.convoExists)
  const files = useSelector((state:RootState) => state.chat.chatFiles)
  const initialKeyboardWidth = Dimensions.get('window').width * .6
  const expansionWidth = useSharedValue(initialKeyboardWidth)
  const { convoID } = useLocalSearchParams()
  const dispatch = useDispatch()
  const progressWidth = useSharedValue(0)
  const progressOpacity = useSharedValue(0)

  const chatData = useMemo(() => ({
    convo_id: convoID,
    user_id: authenticatedUserData?.user_id,
    content: !content ? 'Media' : content,
    files: null,
    audio: null,
    replyChat,
  }), [convoID, authenticatedUserData, content, replyChat])


  const notificationDataForReplyChat = {
    sender_id: authenticatedUserData?.user_id,
    senderUserData: authenticatedUserData,
    receiver_id: replyChat?.user_id,
    data: chatData,
    type: 'reply',
    convo: convoData
  }

  const animatedProgressBar = useAnimatedStyle(() => {
    return {
        opacity: progressOpacity.value,
        width: `${progressWidth.value * 100}%`,
    }
})

  const sendChat = async () => {
      const { data, error } = await supabase
        .from('Chats')
        .insert([chatData])
        .eq('convo_id', String(convoID))
        .select(`
          *,
          Users (
            user_id,
            username,
            profileImage,
            isRobot
          )
        `)
        .single()
      if(!error) {
        if(replyChat){
            sendNotificationForReplyChatInApp()
            dispatch(setReplyChat(null))
        }
        dispatch(setSystemNotificationState(true))
        dispatch(setSystemNotificationData({ type: 'neutral', message: `Please wait while your ${files.length === 1 ? 'file' : 'files'} ${files.length === 1 ? 'uploads' : 'upload'}` }))
        await uploadFiles(data.chat_id)
        setContent('')
        updateConvoLastChat()
        dispatch(addToInputState({[convoID as string]: null}))
        dispatch(setChatFiles([]))
        router.back();
      } else {
        console.log('Error inserting chat:', error.message)
      }
  }

  const sendNotificationForReplyChatInApp = async () => {
    if(activeUsers.includes(replyChat.user_id) || replyChat.user_id === authenticatedUserData?.user_id) {
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
          const { data } = await supabase
          .from('Users')
          .select('pushToken')
          .eq('user_id', replyChat.user_id)
          .single()
          if(data) {
            if(authenticatedUserData)
            sendPushNotification(String(data.pushToken), `${authenticatedUserData?.username} replied to your chat in: ${convoData.convoStarter}`, String(content), 'reply', convoData, { user_id: authenticatedUserData.user_id, username: authenticatedUserData.username, content, convo_id: convoData.convo_id }, replyChat.user_id)
          }
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
          

    const handleClose = async () => {
        await dispatch(setFiles([]))
        await router.back()
    }

    const uploadFiles = async (chat_id: string) => {
        if (files.length === 0) {
            return;
        }
    
        dispatch(setFileUploading(true));
        progressOpacity.value = withTiming(1);
        const newFilePaths: string[] = [];
    
        for (let i = 0; i < files.length; i++) {
            console.log(files.length)
            try {
                const filepath = await uploadFile(files[i], i, chat_id);
                if (filepath) {
                    newFilePaths.push(filepath);
                    // Update progress here if you want to show incremental progress
                    const newProgress = (i + 1) / files.length;
                    progressWidth.value = withTiming(newProgress, {
                        duration: 300,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    });
                }
            } catch (error) {
                console.error('Upload failed:', error);
                // Implement retry logic or user notification here
            }
        }
    
        setFilePaths(prev => {
            const updatedFilePaths = [...prev, ...newFilePaths];
            updateChatFiles(chat_id, updatedFilePaths);
            return updatedFilePaths;
        });
    
        dispatch(setFileUploading(false));
        // Hide progress bar after a short delay
        setTimeout(() => {
            progressWidth.value = withTiming(0);
            progressOpacity.value = withTiming(0);
        }, 2000);
    };
    
    const uploadFile = async (file: fileType, index: number, chat_id: string): Promise<string | null> => {
        const extension = file.uri.split('.').pop()?.toLowerCase();
        const filepath = `Chats/${chat_id}/${index}.${extension}`;
        let contentType: string;
    
        if (['jpg', 'jpeg', 'png', 'webp'].includes(String(extension))) {
            contentType = `image/${extension}`;
        } else if (['mp4', 'mov', 'avi'].includes(String(extension))) {
            contentType = 'video/mp4';
        } else {
            throw new Error(`Unsupported file type: ${extension}`);
        }
    
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
        
        // Convert base64 to ArrayBuffer
        const arrayBuffer = decode(base64);
    
        const { data, error } = await supabase.storage
            .from('userfiles')
            .upload(filepath, arrayBuffer, {
                contentType,
                cacheControl: '31536000',
                upsert: true // This will replace the file if it already exists
            });
    
        if (error) {
            throw error;
        }
    
        return filepath;
    };

    const updateChatFiles = async (chat_id: string, paths: string[]) => {
        const { error } = await supabase
        .from('Chats')
        .update({ files: paths })
        .eq('chat_id', chat_id)
        .single()
        if(!error) {
            console.log("Files updated successfully")
        } else {
            console.log("Problem updating files", error.message)
        }
    }

    const handleVideoPlaying = (index: number | null) => {
      if(videoPlaying.index === index) {
        setVideoPlaying({ index, playing: !videoPlaying.playing })
      } else {
        setVideoPlaying({ index, playing: true })
      }
    }

    useEffect(() => {
      if(!content) {
        expansionWidth.value = withTiming(initialKeyboardWidth, {duration: 300})
        setExpanded(false)
      } else {
        expansionWidth.value = withTiming(Dimensions.get('window').width * .8, {duration: 300})
        setExpanded(true)
      }
    }, [content])

    useEffect(() => {
      if(inputStateForConvo[convoID as string]) {
        setContent(inputStateForConvo[convoID as string])
      }
    }, [])
    
    useEffect(() => {
      if(content) {
        dispatch(addToInputState({[convoID as string]: content}))
      }
    }, [content])

  
    const renderChatFooter = () => {
    if(Platform.OS === 'android') {
      return (
        <KeyboardAvoidingView style={{ position: 'absolute', bottom: 0, width: '100%' }}>
          { replyChat && replyChat.convo_id === convoID && <View style={[styles.replyChatContainer, { backgroundColor: 'rgb(180, 180, 180)' }]}>
            <View style={styles.replyHeaderContainer}>
              <Text style={styles.replyTextHeader}>Replying to <Text style={styles.replyUsername}>{ replyChat.username.split('-')[0] }</Text></Text>
              <TouchableOpacity onPress={() => dispatch(setReplyChat(null))}>
                <AntDesign color={appearanceMode.textColor} name='close' size={25}/>
              </TouchableOpacity>
            </View>
              <Text numberOfLines={3} ellipsizeMode='tail' style={styles.replyChat}>{ replyChat.content }</Text>
          </View>}
          <View style={[styles.container, { paddingBottom: keyboardPaddingBottom, backgroundColor: 'black'  }]}>
            <Animated.View style={[styles.inputContainer, keyboardExpansionAnimation]}>
            <TextInput
                value={content}
                onChangeText={(text) => setContent(text)}
                onBlur={() => setKeyboardPaddingBottom(23)} 
                onFocus={() => setKeyboardPaddingBottom(5)} 
                style={[styles.textInput]}  
                placeholder='Type something...'/>
              { expanded && <TouchableOpacity disabled={convoExists === false ? true : false} onPress={sendChat}>
                <Text style={[styles.sendText, convoExists === false && {color: appearanceMode.secondary}]}>Send</Text>
              </TouchableOpacity>}
            </Animated.View>
            { !content && <TouchableOpacity disabled={convoExists === false ? true : false} onPress={sendChat}>
                <Text style={[styles.sendText, convoExists === false && {color: appearanceMode.secondary}]}>Send Just {files.length > 1 ? 'Files' : 'File'}</Text>
              </TouchableOpacity>}
          </View>
      </KeyboardAvoidingView>
      )
    } else {
      return (
      <View>
          { replyChat && replyChat.convo_id === convoID && <Animated.View style={styles.replyChatContainer}>
            <View style={styles.replyHeaderContainer}>
              <Text style={styles.replyTextHeader}>Replying to <Text style={styles.replyUsername}>{ replyChat.username.split('-')[0] }</Text></Text>
              <TouchableOpacity onPress={() => dispatch(setReplyChat(null))}>
                <AntDesign color={appearanceMode.textColor} name='close' size={25}/>
              </TouchableOpacity>
            </View>
              <Text numberOfLines={3} ellipsizeMode='tail' style={styles.replyChat}>{ replyChat.content }</Text>
          </Animated.View>}
          <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'}  intensity={80} style={[styles.container, { paddingBottom: keyboardPaddingBottom }]}>
            <Animated.View style={[styles.inputContainer, keyboardExpansionAnimation, { borderWidth: 1, borderColor: appearanceMode.faint, borderRadius: 50 }]}>
              <TextInput
                value={content}
                onChangeText={(text) => setContent(text)}
                onBlur={() => setKeyboardPaddingBottom(23)} 
                onFocus={() => setKeyboardPaddingBottom(5)} 
                style={[styles.textInput]}  
                placeholder='Type something...'/>
              { expanded && <TouchableOpacity disabled={convoExists === false ? true : false} onPress={sendChat}>
                <Text style={[styles.sendText, convoExists === false && {color: appearanceMode.secondary}]}>Send</Text>
              </TouchableOpacity>}
            </Animated.View>
            { !content && <TouchableOpacity disabled={convoExists === false ? true : false} onPress={sendChat}>
                <Text style={[styles.sendText, convoExists === false && {color: appearanceMode.secondary}]}>Send Just {files.length > 1 ? 'Files' : 'File'}</Text>
              </TouchableOpacity>}
          </BlurView>
        </View>
      )
    }
  }


  return (
    <GestureHandlerRootView>
    <GestureDetector gesture={gesture}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
        <View style={{ marginTop: 60, marginHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 400 }}>
            <View style={{
              backgroundColor: 'transparent', 
              position: 'absolute', 
              width: '100%', 
              zIndex: 1000, 
              borderRadius: 10
              }}>
              <SystemNotification/>
            </View>
            <Text style={{ color: 'white', fontFamily: 'extrabold', fontSize: 20 }}>Send Files</Text>
            <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={38} color="white" />
            </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}>
            <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 10, gap: 5 }} horizontal>
            { files.map((file:any, index:number) => (
                <View key={index}>
                    { file.uri.endsWith('.mp4') ? 
                    <View style={{ alignItems: 'center', justifyContent: 'center'}}>
                        <TouchableOpacity onPress={() => handleVideoPlaying(index)} style={{ position: 'absolute', zIndex: 100, backgroundColor: 'black', borderRadius: 15 }}>
                          <BlurView style={{ padding: 20, borderRadius: 15, overflow: 'hidden' }}>
                            { videoPlaying.index === index && videoPlaying.playing ? <Image source={require('../../assets/images/pause.png')} style={{ width: 30, height: 30 }}/> : <Image source={require('../../assets/images/play.png')} style={{ width: 30, height: 30 }}/>}
                          </BlurView>
                        </TouchableOpacity>
                        <Video shouldPlay={videoPlaying.index === index && videoPlaying.playing} isLooping source={{ uri: file.uri }} key={index} style={{ width: DEVICE_WIDTH - 20, height:  replyChat ? 610 : 700, borderRadius: 15 }}/>
                    </View> :
                    <TouchableOpacity style={{ backgroundColor: 'black', borderRadius: 15 }}>
                        <Image resizeMode='contain' source={{ uri: file.uri }} key={index} style={{ width: DEVICE_WIDTH - 20, height:  replyChat ? 610 : 700, borderRadius: 15 }}/>
                    </TouchableOpacity>}
                </View>
            ))}
            </ScrollView>
            <Animated.View style={[{ 
              height: 3, 
              backgroundColor: appearanceMode.primary, 
              borderRadius: 20, 
              marginBottom: 5
              }, animatedProgressBar]}/>
            { renderChatFooter() }
        </KeyboardAvoidingView>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

export default WithMedia

