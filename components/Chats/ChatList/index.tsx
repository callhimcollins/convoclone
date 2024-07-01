import { KeyboardAvoidingView, Platform, Keyboard, Text, View } from 'react-native'
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import ChatBox from '../ChatBox'
import { chatType } from '@/types'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import Animated from 'react-native-reanimated'
import { openai } from '@/lib/openAIInitializer'
import { ChatCompletionMessageParam } from 'openai/resources'
import { useDebouncedCallback } from 'use-debounce'

type contextForRobot = {
  role: string,
  content: string
}

const CHATLIST_SIZE = 20;
const BOT_COOLDOWN = 5000;
const MAX_CHATS = 50;
const ChatList = () => {
  const flatListRef = useRef(null)
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const replyChat = useSelector((state:RootState) => state.chat.replyChat)
  const convoData = useSelector((state:RootState) => state.chat.convo)
  const styles = getStyles(appearanceMode)
  const { convoID } = useLocalSearchParams()
  const [chats, setChats] = useState<Array<chatType>>([])
  const [loading, setLoading] = useState(true)
  const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
  const [robotContext, setRobotContext] = useState<contextForRobot[]>([])
  const [lastBotResponseTime, setLastBotResponseTime] = useState(0)
  const currentPageRef = useRef(1);
  const isFetchingRef = useRef(false);


  const robotData = useMemo(() => ({
    user_id: convoID,
    username: `Dialogue Robot-${convoID}`,
    name: `Dialogue Robot`,
    bio: `I was created to talk in room: ${convoData?.convoStarter}`,
    profileImage: '',
    isRobot: true
  }), [convoID, convoData?.convoStarter]);

  const contextForRobot = useMemo(() => 
    chats.map((chat:chatType) => ({
      role: chat.userData.isRobot ? 'user' : 'user',
      content: chat.replyChat && chat.replyChat.username?.includes('Dialogue Robot') ? `I'm replying to your chat: ${chat.replyChat.content}, reply to my own chat: ${chat.content} using my reply to your chat as context` : chat.content
    })).reverse(),
    [chats]
  );

  const updateContextForRobot = (newChat: contextForRobot) => {
    setRobotContext(prevContext => {
      const updatedContext = [...prevContext.slice(0, 39), newChat];
      return updatedContext;
    })
  }

  useEffect(() => {
    setRobotContext(contextForRobot)
  }, [contextForRobot])


  const completeBotResponse = useDebouncedCallback(async (messages: ChatCompletionMessageParam[]) => {
    try {
      const systemMessage: ChatCompletionMessageParam = {
        role: 'system',
        content: `You Are Dialogue Robot. Be The Character In This Role: ${convoData?.convoStarter}. Keep it chat-like and as natural as the character in the role. Use Emojis Only When ABSOLUTELY Necessary. !!! DO NOT DIVERT TO ANOTHER ROLE !!!. Make sure to keep your words to less than 49 words`
      };
  
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [systemMessage, ...messages],
        max_tokens: 100
      });
  
      const botResponse = chatCompletion.choices[0].message.content;
      await sendChatByRobot(String(convoID), robotData, `${convoID}`, String(botResponse));
    } catch (error) {
      console.error("Error in completeBotResponse:", error);
    }
  }, 1000, { maxWait: 5000 });

  const sendChatByRobot = async (convo_id: string, robot:any, robot_id:string, content:string) => {
      const chatData = {
        convo_id,
        user_id: robot_id,
        content,
        files: null,
        audio: null,
        userData: robot
      }

      const { error } = await supabase
      .from('Chats')
      .insert([chatData])
      .select()
      if(!error) {
        const { error } = await supabase
        .from('Convos')
        .update({lastChat: chatData})
        .eq('convo_id', String(convo_id))
        .select()
        if(error) {
            console.log("Couldn't update last chat by robot", error.message)
        }
      }
      if(!error) {
      } else {
        console.log("Couldn't send chat", error.message)
      }
  }


  const getAllChats = useCallback(async () => {
    if (isFetchingRef.current || chats.length >= MAX_CHATS) return;
    isFetchingRef.current = true;
  
    try {
  
      const { data, error } = await supabase
      .from('Chats')
      .select('*')
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
    const handleNewChat = async (payload: any) => {
      if (payload.new && payload.new.convo_id === convoID) {
        const newChat = {
          role: 'user',
          content: payload.new.replyChat && payload.new.replyChat.username?.includes('Dialogue Robot') ? `I'm replying to your chat: ${payload.new.replyChat.content}, reply to my own chat: ${payload.new.content} using my reply to your chat as context` : payload.new.content
        };
  
        setChats((prevChats) => [payload.new, ...prevChats].slice(0, MAX_CHATS));
  
        // Update robotContext
        updateContextForRobot(newChat);
        // If the new message is from a user (not a robot), generate a bot response
        if (!payload.new.userData.isRobot) {
          if(convoData.dialogue) {
            const now = Date.now();
            if(now - lastBotResponseTime > BOT_COOLDOWN) {
              const updatedContext = [...robotContext, newChat];
              await completeBotResponse(updatedContext.slice(-40))
              setLastBotResponseTime(now)
            }
          }
        }
      }
    };
  
    const channel = supabase
      .channel(`custom-chat-channel-${convoID}-${authenticatedUserData?.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Chats', filter: `convo_id=eq.${convoID}`},
        handleNewChat
      )
      .subscribe();
  
    return () => {
      channel.unsubscribe();
    };
  }, [convoID, authenticatedUserData?.id, robotContext, completeBotResponse]);



  const handleScroll = useCallback((event:any) => {
    const yOffset = event.nativeEvent.contentOffset.y
    if(yOffset > 800) {
      Keyboard.dismiss()
    } 
  }, []);

  return (
    <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.container}>
      { !loading && chats.length !== 0 && <Animated.FlatList
      ref={flatListRef}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps='always'
      onScroll={handleScroll}
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
      userData={item?.userData} 
      content={item.content}
      />}
      />}
      { chats.length === 0 && !loading && 
      <View style={styles.noChatsContainer}>
        <Text style={styles.noChatsText}>No Chats In This Room Yet</Text>
      </View>}
    </KeyboardAvoidingView>
  )
}

export default ChatList