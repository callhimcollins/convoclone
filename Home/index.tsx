import { StyleSheet, ScrollView, Platform, Text, TouchableOpacity, Dimensions, FlatList, Image, ImageBackground, Button } from 'react-native'
import React, { memo, useEffect, useState } from 'react'
import { appearanceStateType } from '@/state/features/appearanceSlice'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import Header from './Header'
import users from '@/assets/data/users'
import Highlights from './Highlights'
import highlights from '@/assets/data/highlights'
import { convoType, highlightsType, highlightsType2, userType } from '@/types'
import { View } from '../Themed'
import { KeyboardAwareFlatList, KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Convo from '../Convo'
import { Entypo } from '@expo/vector-icons'
import FromPrivate from './FromPrivate'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { Skeleton } from 'moti/skeleton'
import { toggleConvoStarterButton } from '@/state/features/navigationSlice'
import { setDialogue } from '@/state/features/startConvoSlice'
import MediaFullScreen from '../MediaFullScreen'
import { togglePlayPause } from '@/state/features/mediaSlice'

const PAGE_SIZE = 30
const Home = () => {
    const user = users[0]
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const indexState = useSelector((state: RootState) => state.highlights.indexState)
    const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
    const experienceCheckState = useSelector((state: RootState) => state.user.experienceCheckState)
    const [loading, setLoading] = useState(true)
    const [endReached, setEndReached] = useState(false)
    const [privateConvoList, setPrivateConvoList] = useState<Array<convoType>>([])
    const [privateConvoListLoading, setPrivateConvoListLoading] = useState(true)
    const [highlightUsers, setHighlightUsers] = useState<Array<userType>>([])
    const [convos, setConvos] = useState<Array<convoType>>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [highlightsData, setHighlightsData] = useState<Array<highlightsType2>>([])
    const styles = getStyles(appearanceMode)
    const dispatch = useDispatch()

    const handleStartDialogue = async () => {
        dispatch(toggleConvoStarterButton())
        dispatch(setDialogue(true))
    }


    const getAllHighlightUsers = async () => {
        const { data, error } = await supabase
        .from('highlights')
        .select('convo_id, Convos(convo_id, Users(username, profileImage, user_id, backgroundProfileImage))')
        .order('dateCreated', { ascending: false })
        .eq('status', 'accepted')
        .limit(5)
        if(data) {
            let highlightUsers:any = [];
            data.map(convo => {
                const user = convo?.Convos?.Users
                highlightUsers.push(user)
            })
            setHighlightUsers(highlightUsers)
        }
    }

    const getallHighlights = async () => {
        const { data, error } = await supabase
        .from('highlights')
        .select('convo_id, Convos(*, Users(username))')
        .order('dateCreated', { ascending: false })
        .eq('status', 'accepted')
        .limit(5)
        if(data) {
            setHighlightsData(data)
        }
    }

    const getPrivateCircleConvos = async (user_id: string) => {
        const { data, error } = await supabase
        .from('Convos')
        .select('*')
        .eq('user_id', user_id)
        .eq('private', true)
        .eq('isDiscoverable', false)
        .eq('isHighlight', false)
        .order('dateCreated', { ascending: false })
        .limit(1)
        if(data) {
            return data
        }
        if(error) {
            console.log("Error getting private circle convos", error.message)
        }
    }

    const navigateToPrivateConvosFeed = () => {
        router.push({
            pathname: '/main/privateconvosscreen'
        })
    }

    const fromPrivateCircle = async () => {
        try {
            const { data, error } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .eq('type', 'invite')
        .eq('status', 'accepted')
        .single()
        const { data: data2, error: error2 } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('type', 'requesttojoin')
        .eq('status', 'accepted')
        .single()
        if(data || data2) {
            const inviteType = await getPrivateCircleConvos(data.sender_id)
            const requestType = await getPrivateCircleConvos(data2.receiver_id)
            setPrivateConvoList([...(inviteType ?? ''), ...(requestType ?? '')])
            setPrivateConvoListLoading(false)
        } else {
            setPrivateConvoListLoading(false)
        }
        } catch (error) {
            return;
        }
    }

    useEffect(() => {
        fromPrivateCircle()
    }, [authenticatedUserData])

    const fetchConvos = async () => {
        const { data: blockedUserData, error: blockedUserError } = await supabase
        .from('blockedUsers')
        .select('*')
        .eq('user_id', String(authenticatedUserData?.user_id))
        if(!blockedUserError) {
            const blockedUsersList = blockedUserData.map((item: any) => item.blockedUserID)
            const { data:convoData, error:convoError } = await supabase
            .from('Convos')
            .select('*, Users (user_id, username, profileImage, audio, backgroundProfileImage)')
            .not('user_id', 'in', `(${blockedUsersList.join(',')})`)
            .eq('private', false)
            .eq('isDiscoverable', false)
            .eq('isHighlight', false)
            .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)
            .order('dateCreated', { ascending: false })
            if(convoError) {
                console.log('Error fetching Convos in HomeScreen: ',convoError.message)
                setLoading(false)
                return;
            } else {
                if(convoData.length === 0) {
                    setEndReached(true)
                    setLoading(false)
                } else {
                    if(currentPage === 1) {
                        setConvos(convoData)
                        setLoading(false)
                    } else {
                        setConvos(prevPosts => [...prevPosts, ...convoData])
                        setLoading(false)
                    }
                }
            }
        } else {
            setLoading(false)
            return;
        }
    }

    const refreshConvos = async () => {
        setLoading(true)
        setCurrentPage(1) // Reset to the first page
        setEndReached(false) // Reset endReached state
        
        try {
            // Fetch blocked users
            const { data: blockedUserData, error: blockedUserError } = await supabase
                .from('blockedUsers')
                .select('*')
                .eq('user_id', String(authenticatedUserData?.user_id))
    
            if (blockedUserError) {
                console.log('Error fetching blocked users:', blockedUserError.message)
                setLoading(false)
                return
            }
    
            const blockedUsersList = blockedUserData.map((item: any) => item.blockedUserID)
    
            // Fetch the first page of data
            const { data: convoData, error: convoError } = await supabase
                .from('Convos')
                .select('*, Users (user_id, username, profileImage, audio, backgroundProfileImage)')
                .not('user_id', 'in', `(${blockedUsersList.join(',')})`)
                .eq('private', false)
                .eq('isDiscoverable', false)
                .eq('isHighlight', false)
                .range(0, PAGE_SIZE - 1)
                .order('dateCreated', { ascending: false })
            
            if (convoError) {
                console.log('Error refreshing Convos in HomeScreen:', convoError.message)
            } else {
                setConvos(convoData)
                getAllHighlightUsers()
                getallHighlights()
                if (convoData.length < PAGE_SIZE) {
                    setEndReached(true)
                }
            }
        } catch (error) {
            console.log('Unexpected error during refresh:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchMore = () => {
        setCurrentPage(prevPage => prevPage + 1)
    }

    useEffect(() => {
        
        const channels = supabase.channel('custom-delete-channel')
        .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Convos' },
        (payload) => {
            if(payload.eventType === 'DELETE') {
                setConvos((prevConvos) => prevConvos.filter((convo) => convo.convo_id !== payload.old.convo_id))
                }
            }
        )
        .subscribe()

        return () => {
            channels.unsubscribe();
        };
    }, [])

    useEffect(() => {
        getAllHighlightUsers()
        getallHighlights()
    }, [])



    useEffect(() => {
        fetchConvos()
    }, [currentPage, authenticatedUserData])

    useEffect(() => {
        if( highlightsData[indexState]?.Convos?.files &&
            (String(highlightsData[indexState].Convos.files).endsWith('mp4') ||
            String(highlightsData[indexState].Convos.files).endsWith('mov') ||
            String(highlightsData[indexState].Convos.files).endsWith('avi'))
        ) {
            dispatch(togglePlayPause({ index: String(highlightsData[indexState]?.Convos?.files[0]) }))
        }
    }, [highlightsData, indexState])

    return (
        <View style={styles.container}>
                <Header/>

                <View style={styles.convoContainer}>
                    {/* <Text style={styles.locationConvoText}>Conversations close to you</Text> */}
                    { !loading && <KeyboardAwareFlatList
                        style={{ backgroundColor: appearanceMode.backgroundColor }}
                        contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 90 : 100 }}
                        data={convos}
                        keyExtractor={(item) => item.convo_id}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={() => (
                            <View style={{ backgroundColor: appearanceMode.backgroundColor }}>
                                <ScrollView contentContainerStyle={{ paddingHorizontal: 10 }} showsHorizontalScrollIndicator={false} horizontal style={styles.topOptionContainer}>
                                <TouchableOpacity style={styles.topOptionButton}>
                                        <Text style={styles.topOptionText}>From Earth</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.topOptionButton}>
                                        <Text style={styles.topOptionText}>From Private</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.topOptionButton}>
                                        <Text style={styles.topOptionText}>From People You're Keeping Up With </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.topOptionButton}>
                                        <Text style={styles.topOptionText}>Robots Only</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                                <Highlights 
                                highLightUsers={highlightUsers} 
                                highlight={highlightsData[indexState]}
                                />
                                <View style={styles.privateContainer}>
                                    <View style={styles.privateHeader}>
                                        <Text style={styles.privateHeaderText}>From Private Circle</Text>

                                        { privateConvoList.length > 0 && <TouchableOpacity onPress={navigateToPrivateConvosFeed} style={styles.viewAllInPrivateButton}>
                                            <Text style={styles.viewAllInPrivateText}>All In Private Circle</Text>
                                            <Entypo name='chevron-right' size={20} color={appearanceMode.primary}/>
                                        </TouchableOpacity>}
                                        {/* { !privateConvoList.length && <TouchableOpacity style={styles.viewAllInPrivateButton}>
                                            <Text style={styles.viewAllInPrivateText}>Request To Join Circle</Text>
                                            <Entypo name='chevron-right' size={20} color={appearanceMode.primary}/>
                                        </TouchableOpacity>} */}
                                    </View>
                                    { privateConvoList.length > 0 && !privateConvoListLoading && <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {
                                            privateConvoList.map((convo, index) => (
                                                <FromPrivate audio={convo.audio} mediaIndex={index} dialogue={convo.dialogue} numberOfKeepUps={convo.numberOfKeepUps} convo_id={convo.convo_id}  convoStarter={convo.convoStarter} id={convo.id} key={index} user_id={String(convo.user_id)} />
                                            ))
                                        }
                                    </ScrollView>}
                                    { privateConvoList.length === 0 && !privateConvoListLoading &&
                                        <View style={styles.noPrivateConvoContainer}>
                                            <Text style={styles.noPrivateConvoText}>Join A Private Circle To See Private Convos</Text>
                                        </View>
                                    }

                                    {privateConvoListLoading && 
                                    <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 10, backgroundColor: appearanceMode.backgroundColor }}>
                                        <Skeleton colorMode={appearanceMode.name === 'light' ? 'light' : 'dark'} show height={160} width={'96%'}/>
                                    </View>                    
                                    }
                                </View>
                                <View style={styles.dialogueContainer}>
                                    <View style={styles.dialogueHeaderContainer}>
                                        <Image source={require('../../assets/images/dialoguerobot.png')} style={styles.dialogueLogo}/>
                                        <Text style={styles.dialogueHeaderText}>Introducing... Dialogue</Text>
                                    </View>

                                    <Text style={styles.dialogueSubText}>Have conversations with People, Friends... And Robots</Text>

                                    <TouchableOpacity onPress={handleStartDialogue} style={styles.dialogueButton}>
                                        <Text style={styles.dialogueButtonText}>Start A Dialogue</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        renderItem={({ item, index }) => (
                            <Convo
                            link={item.link} 
                            files={item.files}
                            user_id={item.user_id} 
                            numberOfKeepUps={item.numberOfKeepUps} 
                            convo_id={item.convo_id} 
                            lastChat={item.lastChat} 
                            lastUpdated={item.lastUpdated} 
                            audio={item.audio}
                            dateCreated={item.dateCreated} 
                            id={item.id} 
                            Users={item?.Users} 
                            convoStarter={item.convoStarter} 
                            activeInRoom={item.activeInRoom} 
                            key={index}
                            dialogue={item.dialogue}
                            mediaIndex={index + .6}
                            />
                        )}
                        onEndReached={fetchMore}
                        onEndReachedThreshold={0.5}
                        onRefresh={refreshConvos}
                        refreshing={loading}
                    />}

                    { loading && 
                    <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: appearanceMode.backgroundColor }}>
                        <Skeleton show height={180} width={'96%'}/>
                    </View>
                    }
                </View>
            </View>
    )
}

export default Home


const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: appearanceMode.backgroundColor,
            alignItems: 'center',
        },
        topOptionContainer: {
            backgroundColor: appearanceMode.backgroundColor,
            flexDirection: 'row',
            top: 110,
            marginBottom: 10,
            paddingHorizontal: 10,
        },
        topOptionButton: {
            marginVertical: 10,
            borderWidth: 1,
            borderColor: appearanceMode.faint,
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 30,
            marginRight: 5,
            justifyContent: 'center',
            alignItems: 'center'
        },
        topOptionText: {
            fontFamily: 'extrabold',
            color: 'gray'
        },
        convoContainer: {
            backgroundColor: appearanceMode.backgroundColor,
            marginTop: 12
        },
        locationConvoText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 15,
            marginVertical: 10,
            marginHorizontal: 10
        },
        viewMoreButton: {
            backgroundColor: appearanceMode.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 10,
            paddingVertical: 10,
            borderRadius: 15
        },
        viewMoreText: {
            color: 'white',
            fontFamily: 'bold',
            fontSize: 15
        },
        privateContainer: {
            backgroundColor: appearanceMode.backgroundColor,
            marginVertical: 40,
            marginHorizontal: 10,
        },
        privateHeader: {
            backgroundColor: appearanceMode.backgroundColor,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignContent: 'center',
        },
        privateHeaderText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 15,
        },
        viewAllInPrivateButton: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        viewAllInPrivateText: {
            color: appearanceMode.primary,
            fontFamily: 'bold',
            fontSize: 15,
        },
        noPrivateConvoContainer: {
            marginTop: 10,
            backgroundColor: 'rgba(57, 57, 57, 0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 50,
            borderRadius: 10
        },
        noPrivateConvoText: {
            color: appearanceMode.secondary,
            fontFamily: 'extrabold',
            fontSize: 15
        },
        notificationContainer: {
            backgroundColor: 'transparent', 
            position: 'absolute', 
            width: '100%', 
            zIndex: 200, 
            borderRadius: 10
        },
        dialogueContainer: {
            borderWidth: 1,
            borderColor: appearanceMode.primary,
            margin: 10,
            padding: 10,
            borderRadius: 10,
            backgroundColor: 'black'
        },
        dialogueHeaderContainer: {
            backgroundColor: 'black',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        dialogueLogo: {
            width: 30,
            height: 30
        },
        dialogueHeaderText: {
            color: 'white',
            fontFamily: 'extrabold',
            fontSize: 16,
        },
        dialogueSubText: {
            color: 'white',
            fontFamily: 'extrabold',
            fontSize: 13,
            marginVertical: 10
        },
        dialogueButton: {
            backgroundColor: appearanceMode.primary,
            padding: 10,
            borderRadius: 7,
            justifyContent: 'center',
            alignItems: 'center'
        },
        dialogueButtonText: {
            color: 'white',
            fontFamily: 'extrabold',
        }
    })
}
{/* <TouchableOpacity disabled={endReached} onPress={fetchMore} style={[styles.viewMoreButton, { backgroundColor: endReached ? appearanceMode.secondary : appearanceMode.primary }]}>
    <Text style={styles.viewMoreText}>{ endReached ? "That's all folks!" :  "View More"}</Text>
</TouchableOpacity> */}