import { StyleSheet, View } from 'react-native'
import React, { memo } from 'react'
import { appearanceStateType } from '@/state/features/appearanceSlice'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import NotificationHeader from './NotificationHeader'
import NotificationFeed from './NotificationFeed'

const Notifications = () => {
    const mode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(mode)
    return (
      <View style={styles.container}>
        <NotificationHeader/>
        <NotificationFeed/>
      </View>
    )
}

export default memo(Notifications)

const getStyles = (mode: appearanceStateType) => {
  return StyleSheet.create({
      container: {
          flex: 1,
          backgroundColor: mode.backgroundColor
      },
      text: {
        color: mode.textColor,
        fontFamily: 'bold',
        fontSize: 16,
    }
  })
}