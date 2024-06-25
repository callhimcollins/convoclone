import { StyleSheet, View } from 'react-native'
import React from 'react'
import Chats from '@/components/Chats'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'

const ChatScreen = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    return (
        <View style={[styles.container, { backgroundColor: appearanceMode.backgroundColor }]}>
            <Chats/>
        </View>
    )
}

export default ChatScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})