import { Text, TouchableOpacity, View, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import getStyles from './styles'
import { RootState } from '@/state/store'
import { notificationType } from '@/types'
import { router } from 'expo-router'
import { getConvoForChat, setReplyChat } from '@/state/features/chatSlice'
import { supabase } from '@/lib/supabase'
import { getUserData } from '@/state/features/userSlice'
import moment from 'moment'

const NotificationBox = ({ topic, from, type, convo, message, convoStarter, data, senderUserData, seen, dateCreated }: notificationType) => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const [acceptedIntoPrivateCircle, setAcceptedIntoPrivateCircle] = useState(false)
    const [invitedToPrivateCircle, setInvitedToPrivateCircle] = useState(false)
    const styles = getStyles(appearanceMode)
    const dispatch = useDispatch()

    const notificationForPrivateRequestAcceptance = {
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        receiver_id: senderUserData?.user_id,
        type: 'privatecircleacceptance',
    }
    
    const notificationForInviteToPrivateCircleAcceptance = {
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        receiver_id: senderUserData?.user_id,
        type: 'invitetoprivatecircleacceptance',
    }

    const handleReplyChatNavigation = async () => {
        dispatch(getConvoForChat(convo))
        dispatch(setReplyChat({
            content: data?.content, 
            convo_id: convo?.convo_id, 
            username: senderUserData?.username, 
            user_id: senderUserData?.user_id
         }));

        router.push({
            pathname: '(chat)/[convoID]',
            params: {
                convoID: String(convo?.convo_id)
            }
        })
    }

    const handleChatNavigation = async () => {
        dispatch(getConvoForChat(data))
        router.push({
            pathname: '(chat)/[convoID]',
            params: {
                convoID: String(convo?.convo_id)
            }
        })
    }
    
    const handleAcceptPrivateRequest = async () => {
        const { error } = await supabase
        .from('privateCircle')
        .update({ status: 'accepted' })
        .eq('sender_id', String(senderUserData?.user_id))
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .single()

        if(!error) {
            console.log("successfully accepted")
            setAcceptedIntoPrivateCircle(true)
            sendNotificationForPrivateCircleAcceptance()
        } else {
            console.log("Couldn't accept request", error.message)
        }
    }

    const handleAcceptInviteToPrivateCircle = async () => {
        const { error } = await supabase
        .from('privateCircle')
        .update({ status: 'accepted' })
        .eq('sender_id', String(senderUserData?.user_id))
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .single()

        if(!error) {
            console.log("successfully accepted")
            setInvitedToPrivateCircle(true)
            sendNotificationForInviteToPrivateCircleAcceptance()
        } else {
            console.log("Couldn't accept request", error.message)
        }
    }

    const sendNotificationForPrivateCircleAcceptance = async () => {
        const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(senderUserData?.user_id))
        .eq('type', 'privatecircleacceptance')
        .single()
        if(data) {
            console.log("Notification for acceptance exists")
        } else {
            const { error } = await supabase
            .from('notifications')
            .insert([notificationForPrivateRequestAcceptance])
            .single()
            if(!error) {
                console.log("Acceptance notification sent")
            } else {
                console.log("Couldn't send acceptance notification", error.message)
            }
        }
        if(error) {
            console.log("Couldn't fetch acceptance notification", error.message)
        }
    }

    const sendNotificationForInviteToPrivateCircleAcceptance = async () => {
        const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(senderUserData?.user_id))
        .eq('type', 'invitetoprivatecircleacceptance')
        .single()
        if(data) {
            console.log("Notification for invite acceptance exists")
        } else {
            const { error } = await supabase
            .from('notifications')
            .insert([notificationForInviteToPrivateCircleAcceptance])
            .single()
            if(!error) {
                console.log("Invite Acceptance notification sent")
            } else {
                console.log("Couldn't send invite acceptance notification", error.message)
            }
        }
        if(error) {
            console.log("Couldn't fetch invite acceptance notification", error.message)
        }
    }

    const checkIfAccepted = async () => {
        const { data, error } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', String(senderUserData?.user_id))
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .eq('status', 'accepted')
        .single()
        if(data) {
            setAcceptedIntoPrivateCircle(true)
        } else {
            setAcceptedIntoPrivateCircle(false)
        }
    }

    const checkIfInviteAccepted = async () => {
        const { data, error } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', String(senderUserData?.user_id))
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .eq('status', 'accepted')
        .single()

        if(data) {
            setInvitedToPrivateCircle(true)
        } else {
            setInvitedToPrivateCircle(false)
        }
    }
 
    useEffect(() => {
        if(type === 'privatecircle') {
            checkIfAccepted()
        }
    }, [])


    useEffect(() => {
        if(type === 'invitetoprivatecircle') {
            checkIfInviteAccepted()
        }
    }, [])

    const handleKeepUpProfileNavigation = () => {
        dispatch(getUserData(senderUserData))
        router.push({
            pathname: '(profile)/[profileID]',
            params: {
                profileID: String(senderUserData?.user_id)
            }
        })
    }



    const renderNotificationBox = () => {
        if(type === 'keepup') {
            return (
                <TouchableOpacity onPress={handleKeepUpProfileNavigation} style={[styles.container, !seen && { backgroundColor: 'rgba(98, 95, 224, 0.4)' }]}>
                    <View style={styles.keepupContentContainer}>
                        <Image source={require('@/assets/images/blankprofile.png')} style={styles.keepupUserImage}/>
                        <Text style={styles.keepupMessage}><Text style={styles.keepupUsername}>{ senderUserData?.username }</Text> started keeping up with your Convo: { convo?.convoStarter && <Text style={styles.keepupConvoText}>{ convo?.convoStarter }</Text>}</Text>
                    </View>

                    <View style={styles.dateContainer}>
                        <Text style={styles.date}>{moment(dateCreated).fromNow()}</Text>
                    </View>
                </TouchableOpacity>
            )
        } else if(type === 'userkeepup') {
                return <TouchableOpacity onPress={handleKeepUpProfileNavigation} style={[styles.container, !seen && { backgroundColor: 'rgba(98, 95, 224, 0.4)' }]}>
                    <View style={styles.keepupContentContainer}>
                        <Image source={require('@/assets/images/blankprofile.png')} style={styles.keepupUserImage}/>
                        <Text style={styles.keepupMessage}><Text style={styles.keepupUsername}>{ senderUserData?.username }</Text> started keeping up with you</Text>
                    </View>

                    <View style={styles.dateContainer}>
                        <Text style={styles.date}>{moment(dateCreated).fromNow()}</Text>
                    </View>
                </TouchableOpacity>
        } else if(type === 'privatecircle') {
            return (
                <TouchableOpacity onPress={handleKeepUpProfileNavigation} style={[styles.container, !seen && { backgroundColor: 'rgba(98, 95, 224, 0.4)' }]}>
                    <Text style={{ fontFamily: 'extrabold', color: appearanceMode.textColor, marginBottom: 10, fontSize: 16  }} >Private</Text>
                    <View style={styles.keepupContentContainer}>
                        <Image source={require('@/assets/images/blankprofile.png')} style={styles.keepupUserImage}/>
                        <Text style={styles.keepupMessage}><Text style={styles.keepupUsername}>{ senderUserData?.username }</Text> is requesting to join your private circle</Text>
                    </View>
                    { !acceptedIntoPrivateCircle && <TouchableOpacity onPress={handleAcceptPrivateRequest} style={{ backgroundColor: appearanceMode.primary, padding: 7, justifyContent: 'center', alignItems: 'center', marginTop: 15, borderRadius: 10 }}>
                            <Text style={{ fontFamily: 'bold', color: appearanceMode.textColor }}>Accept</Text>
                    </TouchableOpacity>}

                    { acceptedIntoPrivateCircle && <View style={{ backgroundColor: appearanceMode.secondary, padding: 7, justifyContent: 'center', alignItems: 'center', marginTop: 15, borderRadius: 10 }}>
                            <Text style={{ fontFamily: 'bold', color: appearanceMode.textColor }}>Accepted</Text>
                    </View>}

                    <View style={styles.dateContainer}>
                        <Text style={styles.date}>{moment(dateCreated).fromNow()}</Text>
                    </View>
                </TouchableOpacity>
            )
        } else if(type === 'privatecircleacceptance') {
            return (
                <TouchableOpacity onPress={handleKeepUpProfileNavigation} style={[styles.container, !seen && { backgroundColor: 'rgba(98, 95, 224, 0.4)' }]}>
                    <Text style={{ fontFamily: 'extrabold', color: appearanceMode.textColor, marginBottom: 10, fontSize: 16  }} >Private</Text>
                    <View style={styles.keepupContentContainer}>
                        <Image source={require('@/assets/images/blankprofile.png')} style={styles.keepupUserImage}/>
                        <Text style={styles.keepupMessage}>You are now a part of <Text style={styles.keepupUsername}>{ senderUserData?.username }'s</Text> Private Circle</Text>
                    </View>

                    <View style={styles.dateContainer}>
                        <Text style={styles.date}>{moment(dateCreated).fromNow()}</Text>
                    </View>
                </TouchableOpacity>
            )
        } else if(type === 'convoforuserskeepingup') {
            return (
                <TouchableOpacity onPress={handleChatNavigation} style={[styles.container, !seen && { backgroundColor: 'rgba(98, 95, 224, 0.4)' }]}>
                    { data && <View>
                        { data?.private === true && <Text style={{ fontFamily: 'extrabold', color: appearanceMode.textColor, marginBottom: 10, fontSize: 16  }} >Private</Text>}
                        <View style={styles.convoStartContentContainer}>
                                <Image source={require('@/assets/images/blankprofile.png')} style={styles.convoStartUserImage}/>
                            <View style={styles.right}>
                                <Text style={styles.replyInfo}><Text style={styles.replyUsername}>{ senderUserData?.username }</Text> started a convo: <Text style={styles.replyConvoStarter}>{ data?.convoStarter }</Text></Text>
                                </View>
                        </View>

                        <View style={styles.dateContainer}>
                            <Text style={styles.date}>{moment(dateCreated).fromNow()}</Text>
                        </View>
                    </View>}
                </TouchableOpacity>
            )
        } else if(type === 'highlight') {
            return (
                <TouchableOpacity style={styles.container}>
                    <View style={styles.highlightContentContainer}>
                        <Image source={{ uri: from?.profileImage }} style={styles.profileImage}/>
                        <Text style={styles.highlightMessage}><Text style={{ fontFamily: 'bold' }}>{from?.username}</Text> { topic }</Text>
                    </View>

                    <View style={styles.dateContainer}>
                        <Text style={styles.date}>{moment(dateCreated).fromNow()}</Text>
                    </View>
                </TouchableOpacity>
            )
        } else if(type === 'reply') {
            return (
                <TouchableOpacity onPress={handleReplyChatNavigation} style={[styles.container, !seen && { backgroundColor: 'rgba(98, 95, 224, 0.4)' }]}>
                    <View style={styles.replyInfoContainer}>
                        <Image style={styles.profileImage} source={require('@/assets/images/blankprofile.png')}/>
                        <Text style={styles.replyInfo}><Text style={styles.replyUsername}>{ data?.userData.username }</Text> replied to your chat in <Text style={styles.replyConvoStarter}>{ convo?.convoStarter }</Text></Text>
                    </View>

                    <View style={{ backgroundColor: seen ? appearanceMode.faint : 'rgba(98, 95, 224, 0.2)', padding: 5, marginTop: 15, borderRadius: 5, marginHorizontal: 15 }}>
                        <Text style={{ fontFamily: 'bold', color: appearanceMode.textColor }}>You: { data?.replyChat.content }</Text>
                    </View>

                    <View style={styles.replyMessageContainer}>
                        <Text style={styles.replyMessage}>{ data?.content }</Text>
                    </View>

                    <View style={styles.dateContainer}>
                        <Text style={styles.date}>{moment(dateCreated).fromNow()}</Text>
                    </View>
                </TouchableOpacity>
            )
        } else if(type === 'special') {
            return (
                <TouchableOpacity style={styles.specialContainer}>
                    <Text style={styles.specialText}>{ message }</Text>
                </TouchableOpacity>
            )
        } else if(type === 'invitetoprivatecircle') {
            return (
                <TouchableOpacity onPress={handleKeepUpProfileNavigation} style={[styles.container, !seen && { backgroundColor: 'rgba(98, 95, 224, 0.4)' }]}>
                    <Text style={{ fontFamily: 'extrabold', color: appearanceMode.textColor, marginBottom: 10, fontSize: 16  }} >Private</Text>
                    <View style={styles.keepupContentContainer}>
                        <Image source={require('@/assets/images/blankprofile.png')} style={styles.keepupUserImage}/>
                        <Text style={styles.keepupMessage}><Text style={styles.keepupUsername}>{ senderUserData?.username }</Text> is inviting you to join their private circle</Text>
                    </View>
                    { !invitedToPrivateCircle && <TouchableOpacity onPress={handleAcceptInviteToPrivateCircle} style={{ backgroundColor: appearanceMode.primary, padding: 7, justifyContent: 'center', alignItems: 'center', marginTop: 15, borderRadius: 10 }}>
                            <Text style={{ fontFamily: 'bold', color: appearanceMode.textColor }}>Join</Text>
                    </TouchableOpacity>}

                    { invitedToPrivateCircle && <View style={{ backgroundColor: appearanceMode.secondary, padding: 7, justifyContent: 'center', alignItems: 'center', marginTop: 15, borderRadius: 10 }}>
                            <Text style={{ fontFamily: 'bold', color: appearanceMode.textColor }}>Joined</Text>
                    </View>}

                    <View style={styles.dateContainer}>
                        <Text style={styles.date}>{moment(dateCreated).fromNow()}</Text>
                    </View>
                </TouchableOpacity>
            )
        } else if(type === 'invitetoprivatecircleacceptance') {
            return (
                <TouchableOpacity onPress={handleKeepUpProfileNavigation} style={[styles.container, !seen && { backgroundColor: 'rgba(98, 95, 224, 0.4)' }]}>
                    <Text style={{ fontFamily: 'extrabold', color: appearanceMode.textColor, marginBottom: 10, fontSize: 16  }} >Private</Text>
                    <View style={styles.keepupContentContainer}>
                        <Image source={require('@/assets/images/blankprofile.png')} style={styles.keepupUserImage}/>
                        <Text style={styles.keepupMessage}><Text style={styles.keepupUsername}>{ senderUserData?.username }</Text> accepted your invite</Text>
                    </View>

                    <View style={styles.dateContainer}>
                        <Text style={styles.date}>{moment(dateCreated).fromNow()}</Text>
                    </View>
                </TouchableOpacity>
            )
        }
    }
    return (
        <View>
           {renderNotificationBox()}
        </View>
    )
}

export default NotificationBox

