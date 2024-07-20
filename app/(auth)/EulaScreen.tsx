import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Eula from '@/components/Auth/Eula'

const EulaScreen = () => {
  return (
    <View style={styles.container}>
        <Eula/>
    </View>
  )
}

export default EulaScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})