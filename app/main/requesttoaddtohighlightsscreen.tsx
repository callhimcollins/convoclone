import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import RequestToAddToHighlights from '@/components/Home/Highlights/RequestToAddToHighlights'

const RequestToAddToHighlightsScreen = () => {
  return (
    <View style={styles.container}>
        <RequestToAddToHighlights/>
    </View>
  )
}

export default RequestToAddToHighlightsScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
  })