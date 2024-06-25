import { StyleSheet, View } from 'react-native'
import React from 'react'
import AddName from '@/components/Auth/AddName'

const AddNameScreen = () => {
  return (
    <View style={styles.container}>
      <AddName/>
    </View>
  )
}

export default AddNameScreen

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})