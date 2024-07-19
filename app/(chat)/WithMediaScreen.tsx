import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import WithMedia from '@/components/Chats/WithMedia'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'

const WithMediaScreen = () => {
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  return (
    <View style={[styles.container, { backgroundColor: appearanceMode.backgroundColor }]}>
        <WithMedia/>
    </View>
  )
}

export default WithMediaScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})