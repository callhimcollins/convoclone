import { KeyboardAvoidingView, Platform, Keyboard, Text, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import ChatBox from '../ChatBox'
import { chatType } from '@/types'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import Animated, { useSharedValue } from 'react-native-reanimated'
import { TouchableOpacity } from 'react-native-gesture-handler'

const CHATLIST_SIZE = 20;
const ChatList = () => {
  const flatListRef = useRef(null)
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const replyChat = useSelector((state:RootState) => state.chat.replyChat)
  const convoData = useSelector((state:RootState) => state.chat.convo)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const styles = getStyles(appearanceMode)
  const { convoID } = useLocalSearchParams()
  const [chats, setChats] = useState<Array<chatType>>([])
  const [endReached, setEndReached] = useState(false);
  const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)

  const getAllChats = async () => {
    try {
      const { data, error } = await supabase
      .from('Chats')
      .select('*')
      .eq('convo_id', String(convoID))
      .order('dateCreated', { ascending: false })
      .range((currentPage - 1) * CHATLIST_SIZE, currentPage * CHATLIST_SIZE - 1)
      if(data) {
        setChats((prevChats) => {
          const newChats = [...prevChats, ...data];
          const uniqueChats = Array.from(new Set(newChats.map(a => a.id)))
                                   .map(id => newChats.find(a => a.id === id));
          uniqueChats.sort((a, b) => Number(new Date(b.dateCreated)) - Number(new Date(a.dateCreated)));
          return uniqueChats;
        });
      }
      setLoading(false)

      if(error) {
        console.log(error.message)
      }
    } catch (error) {
      console.log(error)
    }
  }


  const fetchMoreChats = () => {
    setCurrentPage(prevPage => prevPage + 1)
  }

  useEffect(() => {
    getAllChats()
  }, [currentPage, convoID])


  useEffect(() => {
    const channel = supabase
      .channel(`custom-chat-channel-${convoID}-${authenticatedUserData?.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Chats' },
        (payload) => {
          if (payload.new && payload.new.convo_id === convoID) {
              setChats((prevChats) => {
              const newChats = [payload.new, ...prevChats];
              const uniqueChats = Array.from(new Set(newChats.map(a => a.id)))
                                       .map(id => newChats.find(a => a.id === id));
              uniqueChats.sort((a, b) => Number(new Date(b?.dateCreated)) - Number(new Date(a?.dateCreated)));
              return uniqueChats;
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleScroll = (event:any) => {
      const yOffset = event.nativeEvent.contentOffset.y
      if(yOffset > 800) {
        Keyboard.dismiss()
    } 
  }



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
      onEndReachedThreshold={4}
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={{ paddingTop: replyChat ? 180 : 70, paddingBottom: 150 }}
      data={chats}
      inverted
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item, index }) => <ChatBox
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
