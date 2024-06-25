import { StyleSheet, View } from 'react-native'
import React from 'react'
import BlockedUsers from '@/components/BlockedUsers'

const BlockedUsersScreen = () => {
  return (
    <View style={styles.container}>
        <BlockedUsers/>
    </View>
  )
}

export default BlockedUsersScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})