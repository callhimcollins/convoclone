import { KeyboardAvoidingView, Platform, Text, TextInput, View, TouchableOpacity } from 'react-native'
import React, { memo, useState } from 'react'
import getStyles from './styles'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'

const AddName = memo(() => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const userId = useSelector((state: RootState) => state.user.authenticatedUserID)
    const [name, setName] = useState('')
    const styles = getStyles(appearanceMode)

    const handleContinue = async () => {
        if(name === '') {
            return;
        }
        try {
            const { error } = await supabase
            .from('Users')
            .update({ name })
            .eq('user_id', userId)
            .select()
            if(error) {
                console.log(error.message)
            } else {
                router.replace('/(auth)/CompleteProfileScreen')
            }
        } catch (error) {
            console.log('An error occured')
        }
    }
    return (
        <View style={styles.container}>
            <Text style={styles.headerText}>Add Your Name</Text>

            <KeyboardAvoidingView behavior={ Platform.OS === 'ios'? 'padding' : 'height' }  style={styles.footer}>
                <TextInput autoCapitalize='none' value={name} onChangeText={(name) => setName(name)} placeholder='Tyrion Jaime' style={styles.input}/>
                <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
                    <Text style={styles.continueText}>Continue</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </View>
    )
})

export default AddName

