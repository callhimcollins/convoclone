import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import AudioProfileInfo from '@/components/Auth/AudioProfileInfo'

const AudioProfileInfoScreen = () => {
  return (
    <View style={styles.container}>
        <AudioProfileInfo/>
    </View>
  )
}

export default AudioProfileInfoScreen

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})