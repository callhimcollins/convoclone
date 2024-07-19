import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import PendingHighlightRequests from '@/components/Home/Highlights/PendingHighlightRequests'

const pendinghighlightrequestsscreen = () => {
  return (
    <View style={styles.container}>
        <PendingHighlightRequests/>
    </View>
  )
}

export default pendinghighlightrequestsscreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})