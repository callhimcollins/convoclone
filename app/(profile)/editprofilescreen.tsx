import { StyleSheet, View } from 'react-native'
import React from 'react'
import EditProfile from '@/components/Profile/EditProfile'

const EditProfileScreen = () => {
  return (
    <View style={styles.container}>
      <EditProfile/>
    </View>
  )
}

export default EditProfileScreen

const styles = StyleSheet.create({
  container: {
      flex: 1,
  }
})