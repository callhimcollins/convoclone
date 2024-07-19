import { TextInput, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { RootState } from '@/state/store'
import { useSelector } from 'react-redux'
import { externalInputBoxType } from '@/types'
import { getStyles } from './styles'

const ExternalInputBox = ({ placeholder, icon, inputValue, onChangeValue, action, actionForKeyPress }:externalInputBoxType) => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)
    return (
        <View style={styles.container}>
            <TextInput onKeyPress={actionForKeyPress} value={inputValue} onChangeText={onChangeValue} placeholderTextColor={appearanceMode.textColor} placeholder={placeholder} style={styles.textInput}/>
            <TouchableOpacity onPress={action} style={styles.actionButton}>
                {icon}
            </TouchableOpacity>
        </View>
    )
}

export default ExternalInputBox
