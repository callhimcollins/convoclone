import { StyleSheet, View } from 'react-native'
import React from 'react'
import PrivateCircle from '@/components/PrivateCircle'

const PrivateCircleScreen = () => {
  return (
    <View style={styles.container}>
        <PrivateCircle/>
    </View>
  )
}

export default PrivateCircleScreen


const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})