import { Dimensions, Platform, Text, View } from 'react-native'
import { BlurView } from 'expo-blur'
import React, { useEffect } from 'react'
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { setSystemNotificationState } from '@/state/features/notificationSlice'

const DEVICE_HEIGHT = Dimensions.get('window').height

const SystemNotification = () => {
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const systemNotificationState = useSelector((state: RootState) => state.notifications.systemNotificationActive)
  const systemNotificationData = useSelector((state: RootState) => state.notifications.systemNotificationData)
  const styles = getStyles(appearanceMode)
  const dispatch = useDispatch()

  const notificationDisplay = useSharedValue(-DEVICE_HEIGHT)
  const startY = useSharedValue(0)

  const animatedNotification = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: notificationDisplay.value,
        },
      ],
    }
  })

  useEffect(() => {
    if (systemNotificationState) {
      notificationDisplay.value = withTiming(110, { duration: 700 })

      const timer = setTimeout(() => {
        dispatch(setSystemNotificationState(false))
        notificationDisplay.value = withTiming(-DEVICE_HEIGHT, { duration: 500 })
      }, 5000)

      return () => clearTimeout(timer)
    }

    notificationDisplay.value = withTiming(-DEVICE_HEIGHT, { duration: 500 })
  }, [systemNotificationState])

  const dispatchNotificationStateChange = (state: boolean) => {
    dispatch(setSystemNotificationState(state))
  }

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = notificationDisplay.value
    })
    .onUpdate((event) => {
      notificationDisplay.value = startY.value + event.translationY

      if (notificationDisplay.value > 110) {
        notificationDisplay.value = 110
      }
    })
    .onEnd(() => {
      if (notificationDisplay.value < 60) {
        notificationDisplay.value = withTiming(-DEVICE_HEIGHT, { duration: 500 })
        runOnJS(dispatchNotificationStateChange)(false)
      }
    })

  const renderNotificationBody = () => {
    if (systemNotificationData?.type === 'error') {
      return (
        <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text
            style={{
              color: '#E33629',
              fontFamily: 'extrabold',
              fontSize: 15,
              textAlign: 'center',
            }}
          >
            {systemNotificationData?.message}
          </Text>
        </View>
      )
    }

    if (systemNotificationData?.type === 'success') {
      return (
        <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text
            style={{
              color: 'green',
              fontFamily: 'extrabold',
              fontSize: 15,
              textAlign: 'center',
            }}
          >
            {systemNotificationData?.message}
          </Text>
        </View>
      )
    }

    if (systemNotificationData?.type === 'neutral') {
      return (
        <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text
            style={{
              color: appearanceMode.textColor,
              fontFamily: 'extrabold',
              fontSize: 15,
              textAlign: 'center',
            }}
          >
            {systemNotificationData?.message}
          </Text>
        </View>
      )
    }

    return null
  }

  const renderNotification = () => {
    if (Platform.OS === 'android' || appearanceMode.name === 'light') {
      return (
        <View style={[styles.container, { backgroundColor: appearanceMode.backgroundColor }]}>
          {renderNotificationBody()}
        </View>
      )
    }

    return (
      <BlurView
        tint={appearanceMode.name === 'light' ? 'light' : 'dark'}
        intensity={100}
        style={styles.container}
      >
        {renderNotificationBody()}
      </BlurView>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[animatedNotification]}>
          {renderNotification()}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

export default SystemNotification