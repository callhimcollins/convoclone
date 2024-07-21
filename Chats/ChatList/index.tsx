import { KeyboardAvoidingView, Platform, Text, View } from 'react-native'
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import ChatBox from '../ChatBox'
import { chatType } from '@/types'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import Animated from 'react-native-reanimated'
import { setBotContext, setConvoExists } from '@/state/features/chatSlice'


const CHATLIST_SIZE = 20;
const MAX_CHATS = 50;
const ChatList = () => {
  const flatListRef = useRef(null)
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const replyChat = useSelector((state:RootState) => state.chat.replyChat)
  const styles = getStyles(appearanceMode)
  const { convoID } = useLocalSearchParams()
  const [chats, setChats] = useState<Array<chatType>>([])
  const [loading, setLoading] = useState(true)
  const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
  const convoExists = useSelector((state:RootState) => state.chat.convoExists)
  const currentPageRef = useRef(1);
  const isFetchingRef = useRef<boolean>(false);
  const dispatch = useDispatch()

  const contextForRobot = useMemo(() => 
    chats.map((chat:chatType) => ({
      role: 'user',
      content: chat.replyChat && chat.replyChat.username?.includes('Dialogue Robot') ? `I'm(${chat.Users.username?.split(' ')[0]}) replying to your chat: ${chat.replyChat.content}, reply to my own chat: ${chat.content} using my reply to your chat as context` : `${chat.Users.username?.split(' ')[0]}: ${chat.content}`
    })).reverse(),
    [chats]
  );
  useEffect(() => {
      dispatch(setBotContext(contextForRobot))
  }, [contextForRobot])


  const getAllChats = useCallback(async () => {
    if (isFetchingRef.current || chats.length >= MAX_CHATS) return;
    isFetchingRef.current = true;
  
    try {
      const { data, error } = await supabase
      .from('Chats')
      .select('*, Users(user_id, username, profileImage, isRobot, audio)')
      .eq('convo_id', String(convoID))
      .order('dateCreated', { ascending: false })
      .lt('dateCreated', chats.length > 0 ? chats[chats.length - 1].dateCreated : new Date().toISOString())
      .limit(CHATLIST_SIZE);
      if (data) {
        setChats((prevChats) => {
          const newChats = [...prevChats, ...data];
          const uniqueChats = Array.from(new Set(newChats.map(a => a.id)))
            .map(id => newChats.find(a => a.id === id));
          return uniqueChats
            .sort((a, b) => Number(new Date(b.dateCreated)) - Number(new Date(a.dateCreated)))
            .slice(0, MAX_CHATS);
        });
      }
      if (error) {
        console.log(error.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [convoID, chats.length]);

  useEffect(() => {
    getAllChats();
  }, []);

  const fetchMoreChats = useCallback(() => {
    if (!isFetchingRef.current && chats.length < MAX_CHATS) {
      currentPageRef.current += 1;
      getAllChats();
    }
  }, [getAllChats, chats.length]);


  useEffect(() => {
    const chatMap = new Map(); // To keep track of existing chats
  
    const handleNewChat = async (payload: any) => {
      if (payload.new && payload.new.convo_id === convoID) {
        // Fetch the user data for this chat
        const { data: userData, error: userError } = await supabase
          .from('Users')
          .select('user_id, username, profileImage, isRobot, audio')
          .eq('user_id', payload.new.user_id)
          .single();
  
        if (userError) {
          console.error('Error fetching user data:', userError);
        }
  
        // Combine the chat data with the user data
        const newChatWithUser = {
          ...payload.new,
          Users: userData
        };
  
        setChats((prevChats) => {
          const updatedChats = [...prevChats];
          const existingIndex = updatedChats.findIndex(chat => chat.chat_id === newChatWithUser.chat_id);
  
          if (existingIndex !== -1) {
            // Update existing chat
            updatedChats[existingIndex] = newChatWithUser;
          } else {
            // Add new chat
            updatedChats.unshift(newChatWithUser);
          }
  
          return updatedChats.slice(0, MAX_CHATS);
        });
  
        // Update the chatMap
        chatMap.set(newChatWithUser.chat_id, newChatWithUser);
      }
    };
  
    const channel = supabase
      .channel(`custom-chat-channel-${convoID}-${authenticatedUserData?.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Chats', filter: `convo_id=eq.${convoID}`},
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            handleNewChat(payload);
          }
        }
      )
      .subscribe();
  
    return () => {
      channel.unsubscribe();
    };
  }, [convoID, authenticatedUserData?.id]);

  const checkIfConvoExists = async () => {
    const { data, error } = await supabase
    .from('Convos')
    .select('convo_id')
    .eq('convo_id', String(convoID))
    .single()

    if(data) {
      dispatch(setConvoExists(true))
    } else if(error) {
      dispatch(setConvoExists(false))
    }
  }

  useEffect(() => {
    checkIfConvoExists()
  }, [])

  return (
    <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.container}>
      { !loading && chats.length !== 0 && <Animated.FlatList
      ref={flatListRef}
      keyboardDismissMode={ Platform.OS === 'android' ? "on-drag" : "interactive"}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps={'always'}
      onEndReached={fetchMoreChats}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={{ paddingTop: replyChat ? 180 : 70, paddingBottom: 150 }}
      data={chats}
      inverted
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <ChatBox
      key={String(item.id)}
      user_id={item.user_id} 
      replyChat={item.replyChat} 
      convo_id={item.convo_id} 
      chat_id={item.chat_id} 
      dateCreated={item.dateCreated} 
      files={item.files} 
      id={item.id} 
      Users={item?.Users} 
      audio={item.audio}
      content={item.content}
      />}
      />}
      { chats.length === 0 && !loading && convoExists === true &&
      <View style={styles.noChatsContainer}>
        <Text style={styles.noChatsText}>No Chats In This Room Yet</Text>
      </View>}
      {convoExists === false && 
        <View style={styles.noChatsContainer}>
          <Text style={styles.noChatsText}>This Room No Longer Exists</Text>
        </View>
      }
    </KeyboardAvoidingView>
  )
}

export default ChatList