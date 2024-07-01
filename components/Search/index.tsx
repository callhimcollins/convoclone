import { StyleSheet, View, ScrollView, FlatList, TouchableOpacity, Text, Image, TextInput } from 'react-native'
import React, { memo, useEffect, useState } from 'react'
import { appearanceStateType } from '@/state/features/appearanceSlice'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import SearchHeader from './SearchHeader'
import ProfileCard from '../Profile/ProfileCard'
import users from '@/assets/data/users'
import { supabase } from '@/lib/supabase'
import { convoType, userType } from '@/types'
import Convo from '../Convo'
import { BlurView } from 'expo-blur'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { setAuthenticatedUserID } from '@/state/features/userSlice'
import { setNotificationData, setNotificationState, setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'

const Search = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserID)
    const styles = getStyles(appearanceMode)
    const [search, setSearch] = useState('')
    const [convoResults, setConvoResults] = useState<convoType[]>([])
    const [usersResults, setUsersResults] = useState<userType[]>([])
    const [feedback, setFeedback] = useState('')
    const dispatch = useDispatch()
    const getSearch = async () => {
        const { data: convoData, error: convoSearchError } = await supabase
        .from('Convos')
        .select()
        .textSearch('convoStarter', `${search}`, {
            type: 'websearch',
            config: 'english'
        })
        if(convoData) {
            setConvoResults(convoData)
        }
        if(convoSearchError) {
            console.log(convoSearchError.message)
        }


        const { data: userData, error: userSearchError } = await supabase
        .from('Users')
        .select()
        .textSearch('name', `${search}`, {
            type: 'websearch',
            config: 'english'
        })
        if(userData) {
            setUsersResults(userData)
        }
        if(userSearchError) {
            console.log(userSearchError.message)
        }
    }

    useEffect(() =>{
        getSearch()
    }, [search])


    const handleSendFeedback = async () => {
        const { error } = await supabase
        .from('userFeedbacks')
        .insert({ user_id: setAuthenticatedUserID, feedback })
        if(!error) {
            dispatch(setSystemNotificationState(true));
            dispatch(setSystemNotificationData({ type: 'success', message: 'Thank You For Your Feedback. We\'ll Continue To Improve The App' }));
            setFeedback('')
        }
    }
    return (
        <View style={styles.container}>
            <SearchHeader searchValue={search} searchFuntion={(value) => setSearch(value)}/>
            { search && <FlatList
            data={convoResults}
            contentContainerStyle={{ paddingTop: usersResults.length !== 0 ? 0 : 120, paddingBottom: 100 }}
            ListHeaderComponent={() => {
                if(usersResults.length !== 0) {
                return <ScrollView horizontal contentContainerStyle={{ paddingTop: 120, height: 290 }}>
                <View style={{ flexDirection: 'row', padding: 10 }}>
                    {
                        usersResults.map((user, index) => (
                            <ProfileCard key={Number(user.id)} id={user.id} user_id={user.user_id} backgroundProfileImage={user.backgroundProfileImage} username={user.username} name={user.name} profileImage={user.profileImage}/>
                        ))
                    }
                </View>
            </ScrollView>
                }
            }}
            renderItem={({item}) => {
                return <Convo
                user_id={item.user_id}
                lastChat={item.lastChat}
                convo_id={item.convo_id} 
                dateCreated={item.dateCreated} 
                activeInRoom={item.activeInRoom} 
                userData={item.userData} 
                id={item.id} 
                files={item.files} 
                numberOfKeepUps={item.numberOfKeepUps} 
                convoStarter={item.convoStarter}
                dialogue={item.dialogue}
                />
            }}
            />}
            { !search && 
            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 120, paddingBottom: 120 }}>
                <TouchableOpacity style={styles.inviteButton}>
                    <Text style={styles.inviteButtonText}>Invite 5 People And Get $20 Through CashApp</Text>
                    <Text style={styles.inviteButtonSubtext}>Tap To Read Conditions</Text>
                </TouchableOpacity>

                <View style={styles.discoverContainer}>
                    <Text style={styles.discoverHeaderText}>Happening In America</Text>

                    <View style={styles.mediaContainer}>
                        <Image style={styles.discoverImage} source={{ uri: "https://cdn2.unrealengine.com/fnbr-s30-bp-discoverplaylisttiles-br-1920x1080-1920x1080-d49b8777b170.jpg" }}/>
                        <TouchableOpacity style={styles.mediaTextContainer}>
                            <BlurView intensity={80}>
                                <Text style={styles.mediaText}>Fortnite Chapter 5 Season 3: How To Complete Every Week 5 Challenge</Text>
                            </BlurView>
                        </TouchableOpacity>
                    </View>
                </View>


                <View style={styles.experienceContainer}>
                    <View style={styles.experienceHeaderTextContainer}>
                        <Text style={styles.experienceHeaderText}>Experience Check-In</Text>
                        <Text style={styles.experienceHeaderSubtext}>Let's Make Convo A Success. Leave A Feedback</Text>
                    </View>

                    <View style={styles.experienceInputContainer}>
                        <TextInput value={feedback} onChangeText={(feedback) => setFeedback(feedback)} placeholderTextColor={appearanceMode.textColor} style={styles.experienceInput} placeholder='How has your experience been?'/>
                        <TouchableOpacity onPress={handleSendFeedback} style={styles.sendButton}>
                            <Text style={styles.sendButtonText}>Send</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAwareScrollView>

            }
        </View>
    )
}

export default memo(Search)

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: appearanceMode.backgroundColor
        },
        text: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 15,
            marginVertical: 15,
            marginLeft: 10
        },
        usercardContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: 5,
            justifyContent: 'space-between',
            backgroundColor: appearanceMode.backgroundColor
        },
        inviteButton: {
            backgroundColor: appearanceMode.primary,
            padding: 30,
            marginHorizontal: 10,
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 3
        },
        inviteButtonText: {
            color: 'white',
            fontFamily: 'extrabold',
            fontSize: 15,
            textAlign: 'center'
        },
        inviteButtonSubtext: {
            color: 'white',
            fontFamily: 'extrabold',
        },
        discoverContainer: {
            marginTop: 40
        },
        discoverHeaderText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 15,
            marginLeft: 15
        },
        mediaContainer: {
            marginTop: 10,
            justifyContent: 'center',
            alignItems: 'center',
        },
        discoverImage: {
            width: '95%',
            height: 450,
            borderRadius: 10
        },
        mediaTextContainer: {
            position: 'absolute',
            bottom: 2,
            width: '94%',
            overflow: 'hidden',
            borderRadius: 10
        },
        mediaText: {
            color: 'white',
            fontFamily: 'extrabold',
            fontSize: 15,
            marginVertical: 15,
            marginLeft: 10
        },
        experienceContainer: {
            marginTop: 40,
            paddingHorizontal: 10,
            paddingVertical: 20,
            gap: 30,
            borderWidth: 1,
            borderColor: appearanceMode.faint,
            marginHorizontal: 5,
            borderRadius: 20
        },
        experienceHeaderTextContainer: {
            gap: 5
        },
        experienceHeaderText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 18
        },
        experienceHeaderSubtext: {
            color: appearanceMode.secondary,
            fontFamily: 'extrabold',
        },
        experienceInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            backgroundColor: appearanceMode.faint,
            borderRadius: 7
        },
        experienceInput: {
            fontFamily: 'bold',
            color: appearanceMode.textColor,
            flex: 1,
            paddingHorizontal: 10,
            paddingVertical: 10,
        },
        sendButton: {
            backgroundColor: appearanceMode.primary,
            padding: 10,
            borderRadius: 7,
        },
        sendButtonText: {
            color: 'white',
            fontFamily: 'extrabold',
        }
    })
}
