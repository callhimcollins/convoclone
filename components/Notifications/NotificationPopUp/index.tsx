import { Dimensions, Image, Platform, Text, View, TouchableOpacity } from 'react-native'
import { BlurView } from 'expo-blur'
import React, { useEffect } from 'react'
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { setNotificationState } from '@/state/features/notificationSlice'
import { getUserData } from '@/state/features/userSlice'
import { router } from 'expo-router'
import { getConvoForChat, setReplyChat } from '@/state/features/chatSlice'

interface GestureContext {
    translateY: number,
    [key: string]: unknown;
}
const DEVICE_HEIGHT = Dimensions.get('window').height

const NotificationPopUp = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)
    const notificationData = useSelector((state: RootState) => state.notifications.notificationData)
    const notificationDisplay = useSharedValue(-(DEVICE_HEIGHT))
    const notificationState = useSelector((state: RootState) => state.notifications.active)
    const dispatch = useDispatch()
    const animatedNotification = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: notificationDisplay.value
                }
            ]
        }
    })

    useEffect(() => {
        if (notificationState) {
            notificationDisplay.value = withTiming(110, { duration: 700 });
            const timer = setTimeout(() => {
                dispatch(setNotificationState(false));
                notificationDisplay.value = withTiming(-DEVICE_HEIGHT, { duration: 500 });
            }, 5000);
    
            return () => clearTimeout(timer);
        } else {
            notificationDisplay.value = withTiming(-(DEVICE_HEIGHT), { duration: 500 });
        }
    }, [notificationState, dispatch, notificationDisplay]);

    const handleKeepUpProfileNavigation = () => {
        dispatch(getUserData(notificationData?.senderUserData))
        router.push({
            pathname: '(profile)/[profileID]',
            params: {
                profileID: String(notificationData?.senderUserData?.user_id)
            }
        })
    }

    const handleReplyChatNavigation = async () => {
        
        dispatch(getConvoForChat(notificationData?.convo))
        if(notificationData?.data) {
            dispatch(setReplyChat({
                content: notificationData?.data?.content, 
                convo_id: notificationData.convo?.convo_id, 
                username: notificationData.senderUserData?.username, 
                user_id: notificationData.senderUserData?.user_id
             }));
        }

        router.push({
            pathname: '(chat)/[convoID]',
            params: {
                convoID: String(notificationData?.convo?.convo_id)
            }
        })
    }

    const renderNotificationBody = () => {
        if(notificationData?.type === 'reply') {
            return (
                <TouchableOpacity onPress={handleReplyChatNavigation} style={styles.body}>
                    <View style={styles.header}>
                        <Image style={styles.userImage} source={require('@/assets/images/blankprofile.png')}/>
                        <Text style={styles.headerText}><Text style={styles.username}>{ notificationData?.data?.userData.username }</Text> replied to your chat in <Text style={styles.convoRoom}>{ notificationData?.convo.convoStarter }</Text></Text>
                    </View>

                    <View style={{ backgroundColor: 'rgba(98, 95, 224, 0.2)', padding: 5, marginTop: 15, borderRadius: 5, marginHorizontal: 15 }}>
                        <Text style={{ fontFamily: 'bold', color: appearanceMode.textColor }}>You: { notificationData?.data?.replyChat?.content }</Text>
                    </View>

                    <View style={styles.contentContainer}>
                        <Text style={styles.content}>{notificationData?.data?.content}</Text>
                    </View>
                </TouchableOpacity>
            )
        } else if(notificationData?.type === 'keepup') {
            return (
            <TouchableOpacity onPress={handleKeepUpProfileNavigation} style={styles.body}>
                <View style={[styles.header, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Image style={styles.userImage} source={require('@/assets/images/blankprofile.png')}/>
                    <Text style={styles.headerText}><Text style={styles.username}>{ notificationData?.senderUserData?.username }</Text> started keeping up with your {notificationData.convo?.dialogue ? 'Dialogue' : 'Convo'}: <Text style={styles.convoRoom}>{ notificationData.convo?.convoStarter }</Text></Text>
                </View>
            </TouchableOpacity>)
        } else if(notificationData?.type === 'privatecircle') {
            return (
            <TouchableOpacity onPress={handleKeepUpProfileNavigation} style={styles.body}>
                <Text style={{ fontFamily: 'extrabold', color: appearanceMode.textColor, marginBottom: 10, fontSize: 16  }}>Private</Text>
                <View style={[styles.header, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Image style={styles.userImage} source={require('@/assets/images/blankprofile.png')}/>
                    <Text style={styles.headerText}><Text style={styles.username}>{ notificationData?.senderUserData?.username }</Text> is requesting to join your private circle</Text>
                </View>
            </TouchableOpacity>
            )
        } else if(notificationData?.type === 'privatecircleacceptance') {
            return (
                <TouchableOpacity onPress={handleKeepUpProfileNavigation} style={styles.body}>
                    <View style={[styles.header, { justifyContent: 'center', alignItems: 'center' }]}>
                        <Image style={styles.userImage} source={require('@/assets/images/blankprofile.png')}/>
                        <Text style={styles.headerText}>You are now a part of <Text style={styles.username}>{ notificationData?.senderUserData?.username }</Text>'s Private Circle</Text>
                    </View>
                </TouchableOpacity>
            )
        } else if(notificationData?.type === 'userkeepup') {
            return (
                <TouchableOpacity onPress={handleKeepUpProfileNavigation} style={styles.body}>
                    <View style={[styles.header, { justifyContent: 'center', alignItems: 'center' }]}>
                        <Image style={styles.userImage} source={require('@/assets/images/blankprofile.png')}/>
                        <Text style={styles.headerText}><Text style={styles.username}>{ notificationData?.senderUserData?.username }</Text> started keeping up with you</Text>
                    </View>
                </TouchableOpacity>
            )
        } else if(notificationData?.type === 'invitetoprivatecircle') {
            return (
                <TouchableOpacity onPress={handleKeepUpProfileNavigation} style={[styles.body]}>
                    <View style={[styles.header, { justifyContent: 'center', alignItems: 'center' }]}>
                        <Image style={styles.userImage} source={require('@/assets/images/blankprofile.png')}/>
                        <Text style={styles.headerText}><Text style={styles.username}>{ notificationData?.senderUserData?.username }</Text> is inviting you to join their private circle</Text>
                    </View>
                </TouchableOpacity>
            )
        } else if(notificationData?.type === 'invitetoprivatecircleacceptance') {
            return (
                <TouchableOpacity onPress={handleKeepUpProfileNavigation} style={[styles.body]}>
                    <View style={[styles.header, { justifyContent: 'center', alignItems: 'center' }]}>
                        <Image style={styles.userImage} source={require('@/assets/images/blankprofile.png')}/>
                        <Text style={styles.headerText}><Text style={styles.username}>{ notificationData?.senderUserData?.username }</Text> accepted your invite</Text>
                    </View>
                </TouchableOpacity>
            )
        } else if(notificationData?.type === 'convoforuserskeepingup') {
            return (
                <TouchableOpacity style={[styles.body]}>
                    { notificationData.senderUserData && <View style={[styles.header, { justifyContent: 'center', alignItems: 'center' }]}>
                        <Image style={styles.userImage} source={require('@/assets/images/blankprofile.png')}/>
                        <Text style={styles.headerText}><Text style={styles.username}>{ notificationData?.senderUserData.username }</Text> started a {notificationData?.data?.dialogue ? 'Dialogue' : 'Convo'}: <Text style={styles.convoRoom}>{ notificationData?.data?.convoStarter }</Text></Text>
                    </View>}
                </TouchableOpacity>
            )
        }
    }

    const renderNotification = () => {
        if(Platform.OS === 'android' || appearanceMode.name === 'light') {
            return (
            <View style={[styles.container, { backgroundColor: appearanceMode.backgroundColor }]}>
                {renderNotificationBody()}
            </View>
            ) 
        } else {
            return (
                <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={100} style={styles.container}>
                    {renderNotificationBody()}
                </BlurView>
            )
        }
    }

    const dispatchNotificationStateChange = (state: boolean) => {
        dispatch(setNotificationState(state))
    }

    const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
        onStart: (event, context) => {
            context.translateY = notificationDisplay.value
        },
        onActive: (event, context) => {
            notificationDisplay.value = context.translateY + event.translationY
            if(notificationDisplay.value > 110) {
                notificationDisplay.value = 110;
            }
        },
        onEnd: () => {
            'worklet'
            if(notificationDisplay.value < 60) {
                notificationDisplay.value = withTiming(-(DEVICE_HEIGHT), { duration: 500 });
                runOnJS(dispatchNotificationStateChange)(false)
            }
        },
    })
    return (
        <GestureHandlerRootView>
            <PanGestureHandler onGestureEvent={panGestureEvent}>
            <Animated.View style={[animatedNotification]}>
                {renderNotification()}
            </Animated.View>
            </PanGestureHandler>
        </GestureHandlerRootView>
  )
}

export default NotificationPopUp

