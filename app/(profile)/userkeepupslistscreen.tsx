import { StyleSheet, View } from 'react-native'
import UserKeepUpsList from '@/components/UserKeepUps'
import React from 'react'

const UserKeepUpsListScreen = () => {
  return (
    <View style={styles.container}>
        <UserKeepUpsList/>
    </View>
  )
}

export default UserKeepUpsListScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})