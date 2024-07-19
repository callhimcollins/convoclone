import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import CreateDiscoverPost from '@/components/Search/CreateDiscoverPost'

const CreateDiscoverPostScreen = () => {
  return (
    <View style={styles.container}>
        <CreateDiscoverPost/>
    </View>
  )
}

export default CreateDiscoverPostScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
  })