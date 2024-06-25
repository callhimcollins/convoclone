import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import RequestOthersToJoinCircle from '@/components/PrivateCircle/RequestOthersToJoinCircle'

const RequestOthersToJoinCircleScreen = () => {
  return (
    <View style={styles.container}>
        <RequestOthersToJoinCircle/>
    </View>
  )
}

export default RequestOthersToJoinCircleScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})