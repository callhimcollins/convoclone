import React, { useEffect } from 'react'
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import ChatHeader from './ChatHeader'
import ChatFooter from './ChatFooter'
import ChatList from './ChatList'
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import NotificationPopUp from '../Notifications/NotificationPopUp'
import HeaderPopUp from './ChatHeader/HeaderPopUp'
import SystemNotification from '../Notifications/SystemNotifications'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { setShowModal } from '@/state/features/chatSlice'
import MediaFullScreen from '../MediaFullScreen'
import { useRootNavigationState } from 'expo-router'

const DEVICE_HEIGHT = Dimensions.get('window').height
const DEVICE_WIDTH = Dimensions.get('window').width

interface GestureContext {
  translateY: number,
  [key: string]: unknown;
}

const Chats = () => {
  const showModal = useSelector((state:RootState) => state.chat.showModal)
  const popUpVisibility = useSharedValue(DEVICE_HEIGHT)
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const dispatch = useDispatch()
  const showFullScreenMedia = useSelector((state: RootState) => state.media.showFullScreen)
  const navigationState = useRootNavigationState() as any
  const currentRoute = navigationState?.routes[navigationState.index]?.name ?? undefined;
  const mediaPosition = useSharedValue(DEVICE_HEIGHT)
  const mediaOpacity = useSharedValue(2)
  const animatedPopUpStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: popUpVisibility.value+60 }]
    }
  })

  const animatedMediaStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: mediaPosition.value
        }
      ],
      opacity: mediaOpacity.value
    }
  })

  useEffect(() => {
    if(showModal) {
      popUpVisibility.value = withTiming(0, { duration: 300 })
    }
  }, [showModal])

  const dismissModal = (state: boolean) => {
    dispatch(setShowModal(state))
  }

  const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
    onStart: (event, context) => {
      context.translateY = popUpVisibility.value
    },
    onActive: (event, context) => {
      popUpVisibility.value = event.translationY + context.translateY
    },
    onEnd: () => {
      if(popUpVisibility.value > 150) {
        popUpVisibility.value = withTiming(DEVICE_HEIGHT, { duration: 500 })
        runOnJS(dismissModal)(false)
      } else {
        popUpVisibility.value = withSpring(20, { damping: 100,
      stiffness: 100,
      overshootClamping: false,
      restSpeedThreshold: 0.01,
      restDisplacementThreshold: 0.01,
    })
      }
    }
  })


  useEffect(() => {
    if(showFullScreenMedia) {
      mediaPosition.value = withTiming(0)
    } else {
      mediaPosition.value = withTiming(DEVICE_HEIGHT)
      
    }
  }, [showFullScreenMedia])

  return (
    <GestureHandlerRootView>
      { showFullScreenMedia && currentRoute !== '(profile)' && <Animated.View style={[styles.mediaContainer, animatedMediaStyles, { display: showFullScreenMedia ? 'flex' : 'none' }]}>
        <MediaFullScreen />
      </Animated.View>}
      <View style={styles.notificationContainer}>
        <NotificationPopUp/>
      </View>
      <View style={styles.notificationContainer}>
        <SystemNotification/>
      </View>
      
          <PanGestureHandler onGestureEvent={panGestureEvent}>
        <Animated.View style={[styles.headerPopUpContainer, animatedPopUpStyle]}>
            <TouchableOpacity style={{ zIndex: 500, width: '100%', top: 70, paddingVertical: 50, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: appearanceMode.textColor, width: 100, paddingVertical: 4, borderRadius: 50, top: 50 }}/>
            </TouchableOpacity>
          <HeaderPopUp/>
        </Animated.View>
          </PanGestureHandler>

      <ChatHeader/>
      <ChatList/>
      <ChatFooter />
    </GestureHandlerRootView>
  )
}

export default Chats

const styles = StyleSheet.create({
  notificationContainer: {
    backgroundColor: 'transparent', 
      position: 'absolute', 
      width: '100%', 
      zIndex: 200, 
      borderRadius: 10
  },
  headerPopUpContainer: {
    position: 'absolute', 
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    zIndex: 200,
    justifyContent: 'center',
  },
  mediaContainer: {
    position: 'absolute', 
    zIndex: 500
  }
})
