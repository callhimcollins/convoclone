import { Platform, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { BlurView } from 'expo-blur'
import { supabase } from '@/lib/supabase'
import notifications from '@/assets/data/notifications'

const NotificationHeader = () => {
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
  const numberOfNotifications = useSelector((state: RootState) => state.notifications.numberOfNotifications)
  const styles = getStyles(appearanceMode)

  const renderHeader = () => {
    if(Platform.OS === 'android') {
      return (<View style={styles.container}>
        { numberOfNotifications === 0 && <Text style={styles.headerText}>No new notifications</Text>}
        { numberOfNotifications === 1 && <Text style={styles.headerText}>1 new notification</Text>}
        { numberOfNotifications > 1 && <Text style={styles.headerText}>{numberOfNotifications} new notifications</Text>}
      </View>)
    } else {
      return (<BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.container}>
      { numberOfNotifications === 0 && <Text style={styles.headerText}>No new notifications</Text>}
      { numberOfNotifications === 1 && <Text style={styles.headerText}>1 new notification</Text>}
      { numberOfNotifications > 1 && <Text style={styles.headerText}>{numberOfNotifications} new notifications</Text>}
    </BlurView>)
    }
  }

  return (
    <>
      {renderHeader()}
    </>
  )
}

export default NotificationHeader