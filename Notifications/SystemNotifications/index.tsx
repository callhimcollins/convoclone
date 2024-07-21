import { Dimensions, Image, Platform, Text, View } from 'react-native'
import { BlurView } from 'expo-blur'
import React, { useEffect } from 'react'
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { setSystemNotificationState } from '@/state/features/notificationSlice'

interface GestureContext {
    translateY: number,
    [key: string]: unknown;
}
const DEVICE_HEIGHT = Dimensions.get('window').height

const SystemNotification = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const systemNotificationState = useSelector((state: RootState) => state.notifications.systemNotificationActive)
    const systemNotificationData = useSelector((state: RootState) => state.notifications.systemNotificationData)
    const styles = getStyles(appearanceMode)
    const notificationDisplay = useSharedValue(-(DEVICE_HEIGHT))
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
        if(systemNotificationState) {
            notificationDisplay.value = withTiming(110, { duration: 700 });
            const timer = setTimeout(() => {
                dispatch(setSystemNotificationState(false));
                notificationDisplay.value = withTiming(-DEVICE_HEIGHT, { duration: 500 });
            }, 5000);

            return () => clearTimeout(timer);
        } else {
            notificationDisplay.value = withTiming(-(DEVICE_HEIGHT), { duration: 500 });
        }
    }, [systemNotificationState, dispatch, notificationDisplay]);

    const renderNotificationBody = () => {
        if(systemNotificationData?.type === 'error') {
            return (
                <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: '#E33629', fontFamily: 'extrabold', fontSize: 15, textAlign: 'center' }}>{ systemNotificationData?.message }</Text>
                </View>
            )
        } else if(systemNotificationData?.type === 'success') {
            return (
                <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: 'green', fontFamily: 'extrabold', fontSize: 15, textAlign: 'center' }}>{ systemNotificationData?.message }</Text>
                </View>
            )
        } else if(systemNotificationData?.type === 'neutral') {
            return (
                <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: appearanceMode.textColor, fontFamily: 'extrabold', fontSize: 15, textAlign: 'center' }}>{ systemNotificationData?.message }</Text>
                </View>              
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
        dispatch(setSystemNotificationState(state))
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

export default SystemNotification

