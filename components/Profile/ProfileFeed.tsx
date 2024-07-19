import { View, FlatList, KeyboardAvoidingView, Platform, Text, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import React, { useEffect, useState } from 'react'
import Convo from '../Convo'
import ProfileDetail from './ProfileDetail'
import { chatType, userType } from '@/types'
import { supabase } from '@/lib/supabase'
import { router, useLocalSearchParams } from 'expo-router'
import { toggleConvoStarterButton } from '@/state/features/navigationSlice'
import { setPrivate } from '@/state/features/startConvoSlice'

const ProfileFeed = (user: userType, chats: chatType) => {
    const userData = useSelector((state:RootState) => state.user.userData)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const activeTab = useSelector((state:RootState) => state.user.activeTab)
    const [userIsBlocked, setUserIsBlocked] = useState(false)
    const [userIsInPrivateCircle, setUserIsInPrivateCircle] = useState(false)
    const dispatch = useDispatch()
    const { profileID } = useLocalSearchParams()

    const checkUserIsBlocked = async () => {
        const { data } = await supabase
        .from('blockedUsers')
        .select('*')
        .eq('blockedUserID', String(userData?.user_id))
        .eq('user_id', String(authenticatedUserData?.user_id))
        .single()
        if(data) {
            setUserIsBlocked(true)
        } else  setUserIsBlocked(false)
    }

    const handleCreate = () => {
        if(activeTab === 'Private' && user?.convos?.length === 0 && !userIsInPrivateCircle && authenticatedUserData?.user_id === profileID) {
            dispatch(setPrivate(true))
        }
        dispatch(toggleConvoStarterButton())
        router.push({
            pathname: '/(tabs)/'
        })
    }

    const checkIfUserInPrivateCircle = async () => {
        const { data } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(userData?.user_id))
        .eq('type', 'requesttojoin')
        .eq('status', 'accepted')
        .eq('senderIsBlocked', false)
        .single()

        const { data: data2, error: error2 } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', String(userData?.user_id))
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .eq('type', 'invite')
        .eq('status', 'accepted')
        .eq('senderIsBlocked', false)
        .single()
        if(data || data2) {
            console.log("User in circle")
            setUserIsInPrivateCircle(true)
        }
    }
    
    useEffect(() => {
        checkUserIsBlocked()
        checkIfUserInPrivateCircle()
    }, [])
    
    useEffect(() => {
        const channel = supabase.channel(`blocking-${userData?.user_id}-${authenticatedUserData?.user_id}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'blockedUsers', filter: `blockedUserID=eq.${userData?.user_id}` },
            (payload) => {
                if(payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
                    checkUserIsBlocked()
                }
            }
        ).subscribe()
        return () => {
            channel.unsubscribe()
        }
    }, [])
                        
    const renderContent = () => {
        if(userIsBlocked) {
            return (
                <View style={{ height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: appearanceMode.textColor, fontFamily: 'bold', fontSize: 16 }}>{user.username} is blocked</Text>
                </View>
            )
        } else {
            return (
                <KeyboardAvoidingView behavior={ Platform.OS === 'ios'? 'padding' : 'height' }>
                { activeTab === 'Convos' && user.convos && <FlatList
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<ProfileDetail backgroundProfileImage={user.backgroundProfileImage} audio={user.audio} links={user.links} username={user.username} bio={user.bio} id={user.id}/>}
                data={user.convos}
                keyExtractor={(convo) => String(convo.id)}
                renderItem={({item, index}) => { 
                    return (<Convo
                        link={item.link}
                        user_id={item.user_id}
                        lastChat={item.lastChat}
                        convo_id={item.convo_id} 
                        dateCreated={item.dateCreated} 
                        activeInRoom={item.activeInRoom} 
                        Users={item.Users} 
                        id={item.id} 
                        files={item.files} 
                        numberOfKeepUps={item.numberOfKeepUps} 
                        convoStarter={item.convoStarter}
                        dialogue={item.dialogue}
                        audio={item.audio}
                        mediaIndex={index + .1}
                        />)}}
                />}
                { activeTab === 'Private' && user.convos && userIsInPrivateCircle && <FlatList
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<ProfileDetail backgroundProfileImage={user.backgroundProfileImage} audio={user.audio} links={user.links} username={user.username} bio={user.bio} id={user.id}/>}
                data={user.convos}
                keyExtractor={(convo) => String(convo.id)}
                renderItem={({item, index}) => { 
                    return (<Convo 
                        link={item.link}
                        user_id={item.user_id}
                        lastChat={item.lastChat}
                        convo_id={item.convo_id} 
                        dateCreated={item.dateCreated} 
                        activeInRoom={item.activeInRoom} 
                        Users={item.Users} 
                        id={item.id} 
                        files={item.files} 
                        numberOfKeepUps={item.numberOfKeepUps} 
                        convoStarter={item.convoStarter}
                        dialogue={item.dialogue}
                        audio={item.audio}
                        mediaIndex={index + .1}
                        />)}}
                />}
                { activeTab === 'Private' && user.convos && authenticatedUserData?.user_id === profileID && <FlatList
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<ProfileDetail backgroundProfileImage={user.backgroundProfileImage} audio={user.audio} links={user.links} username={user.username} bio={user.bio} id={user.id}/>}
                data={user.convos}
                keyExtractor={(convo) => String(convo.id)}
                renderItem={({item, index}) => { 
                    return (<Convo 
                        link={item.link}
                        lastChat={item.lastChat}
                        convo_id={item.convo_id} 
                        user_id={item.user_id}
                        dateCreated={item.dateCreated} 
                        activeInRoom={item.activeInRoom} 
                        Users={item.Users} 
                        id={item.id} 
                        files={item.files} 
                        numberOfKeepUps={item.numberOfKeepUps} 
                        convoStarter={item.convoStarter}
                        dialogue={item.dialogue}
                        audio={item.audio}
                        mediaIndex={index + .1}
                        />)}}
                />}


                { activeTab === 'Convos' && user?.convos?.length === 0 && authenticatedUserData?.user_id === profileID && 
                    <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: appearanceMode.textColor, fontFamily: 'bold', fontSize: 16 }}>No Conversations Yet</Text>
                        <TouchableOpacity onPress={handleCreate}>
                            <Text style={{ color: appearanceMode.primary, fontFamily: 'bold', fontSize: 16, marginTop: 10}}>Start a Conversation</Text>
                        </TouchableOpacity>
                    </View>
                }
                { activeTab === 'Convos' && user?.convos?.length === 0 && authenticatedUserData?.user_id !== profileID && 
                    <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: appearanceMode.textColor, fontFamily: 'bold', fontSize: 16 }}>{user.username?.split('-')[0]} Has No Conversations Yet</Text>
                    </View>
                }
                { activeTab === 'Private' && !userIsInPrivateCircle && authenticatedUserData?.user_id !== profileID &&
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ justifyContent: 'center' }}>
                        <ProfileDetail username={user.username} bio={user.bio} id={user.id}/>
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/lockdarkmode.png')} style={{ width: 50, height: 50 }}/>}
                            { appearanceMode.name === 'light' && <Image source={require('@/assets/images/locklightmode.png')} style={{ width: 50, height: 50 }}/>}
                            <Text style={{ color: appearanceMode.textColor, fontFamily: 'bold', fontSize: 16 }}>You are not in {user.username?.split('-')[0]}'s Private Circle</Text>
                        </View>
                    </ScrollView>
                }
                { activeTab === 'Private' && user?.convos?.length === 0 && !userIsInPrivateCircle && authenticatedUserData?.user_id === profileID &&
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{  justifyContent: 'center', alignItems: 'center', paddingBottom: Dimensions.get('window').height / 2.5}}>
                        <Text style={{ color: appearanceMode.textColor, fontFamily: 'bold', fontSize: 16 }}>No Private Conversations Yet</Text>
                        <TouchableOpacity onPress={handleCreate}>
                            <Text style={{ color: appearanceMode.primary, fontFamily: 'bold', fontSize: 16, marginTop: 10}}>Start a Private Conversation</Text>
                        </TouchableOpacity>
                    </ScrollView>
                }
                { activeTab === 'Private' && user?.convos?.length === 0 && userIsInPrivateCircle && authenticatedUserData?.user_id !== profileID &&
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{  justifyContent: 'center', alignItems: 'center', paddingBottom: Dimensions.get('window').height / 2.5}}>
                        <Text style={{ color: appearanceMode.textColor, fontFamily: 'bold', fontSize: 16 }}> {user.username} Has No Private Conversations Yet</Text>
                    </ScrollView>
                }
                {/* { activeTab === 'Private' && !userIsInPrivateCircle && user.convos?.length !== 0 && authenticatedUserData?.user_id !== profileID &&
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <ProfileDetail links={user.links} username={user.username} bio={user.bio} id={user.id}/> 

                        <View style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: Dimensions.get('window').height / 2.5 }}>
                            <Text style={{ color: appearanceMode.textColor, fontFamily: 'bold', fontSize: 16 }}>You are not in {user.username?.split('-')[0]}'s Private Circle</Text>
                        </View>                     
                    </ScrollView>
                } */}
        </KeyboardAvoidingView>
        )
    }
    }
    return (
        <>
           {renderContent()} 
        </>
        
    )
}

export default ProfileFeed

