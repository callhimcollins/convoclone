import React, { useEffect } from 'react'
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler'
import ChatHeader from './ChatHeader'
import ChatFooter from './ChatFooter'
import ChatList from './ChatList'
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import NotificationPopUp from '../Notifications/NotificationPopUp'
import HeaderPopUp from './ChatHeader/HeaderPopUp'
import SystemNotification from '../Notifications/SystemNotifications'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { setShowModal } from '@/state/features/chatSlice'
import MediaFullScreen from '../MediaFullScreen'
import { useRootNavigationState } from 'expo-router'

const DEVICE_HEIGHT = Dimensions.get('window').height
const DEVICE_WIDTH = Dimensions.get('window').width

const Chats = () => {
  const showModal = useSelector((state: RootState) => state.chat.showModal)
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const dispatch = useDispatch()
  const showFullScreenMedia = useSelector((state: RootState) => state.media.showFullScreen)
  const navigationState = useRootNavigationState() as any
  const currentRoute = navigationState?.routes[navigationState.index]?.name ?? undefined

  const popUpVisibility = useSharedValue(DEVICE_HEIGHT)
  const startY = useSharedValue(0)

  const mediaPosition = useSharedValue(DEVICE_HEIGHT)
  const mediaOpacity = useSharedValue(2)

  const animatedPopUpStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: popUpVisibility.value + 19 }],
    }
  })

  const animatedMediaStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: mediaPosition.value,
        },
      ],
      opacity: mediaOpacity.value,
    }
  })

  useEffect(() => {
    if (showModal) {
      popUpVisibility.value = withTiming(25, { duration: 300 })
    }
  }, [showModal])

  const dismissModal = (state: boolean) => {
    dispatch(setShowModal(state))
  }

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = popUpVisibility.value
    })
    .onUpdate((event) => {
      popUpVisibility.value = event.translationY + startY.value
    })
    .onEnd(() => {
      if (popUpVisibility.value > 150) {
        popUpVisibility.value = withTiming(DEVICE_HEIGHT, { duration: 500 })
        runOnJS(dismissModal)(false)
      } else {
        popUpVisibility.value = withSpring(20, {
          damping: 100,
          stiffness: 100,
          overshootClamping: false,
        })
      }
    })

  useEffect(() => {
    if (showFullScreenMedia) {
      mediaPosition.value = withTiming(0)
    } else {
      mediaPosition.value = withTiming(DEVICE_HEIGHT)
    }
  }, [showFullScreenMedia])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
  {showFullScreenMedia && currentRoute !== '(profile)' && (
    <Animated.View
      style={[
        styles.mediaContainer,
        animatedMediaStyles,
        { display: showFullScreenMedia ? 'flex' : 'none' },
      ]}
    >
      <MediaFullScreen />
    </Animated.View>
  )}

  <View style={styles.notificationContainer}>
    <NotificationPopUp />
  </View>

  <View style={styles.notificationContainer}>
    <SystemNotification />
  </View>

  <GestureDetector gesture={panGesture}>
    <Animated.View style={[styles.headerPopUpContainer, animatedPopUpStyle]}>
      <TouchableOpacity
        style={{
          zIndex: 500,
          width: '100%',
          top: 70,
          paddingVertical: 50,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: appearanceMode.textColor,
            width: 100,
            paddingVertical: 4,
            borderRadius: 50,
            top: 50,
          }}
        />
      </TouchableOpacity>

      <HeaderPopUp />
    </Animated.View>
  </GestureDetector>

  <ChatHeader />
  <ChatList />
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
    borderRadius: 10,
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
    zIndex: 500,
  },
})


