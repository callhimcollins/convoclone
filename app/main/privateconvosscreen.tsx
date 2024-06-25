import { StyleSheet, View } from 'react-native'
import React from 'react'
import NotificationPopUp from '@/components/Notifications/NotificationPopUp'
import SystemNotification from '@/components/Notifications/SystemNotifications'
import PrivateConvos from '@/components/Home/PrivateConvos'

const PrivateConvosScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.notificationContainer}>
        <NotificationPopUp/>
      </View>
      <View style={styles.notificationContainer}>
        <SystemNotification/>
      </View>
      <PrivateConvos/>
    </View>
  )
}

export default PrivateConvosScreen

const styles = StyleSheet.create({
  container: {
      flex: 1,
  },
  notificationContainer: {
    backgroundColor: 'transparent', 
    position: 'absolute', 
    width: '100%', 
    zIndex: 200, 
    borderRadius: 10
}
})