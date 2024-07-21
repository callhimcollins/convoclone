import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View, TextInput, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import getStyles from './styles'
import { RootState } from '@/state/store'
import { useSelector } from 'react-redux'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Session } from '@supabase/supabase-js'

const Username = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const userId = useSelector((state: RootState) => state.user.authenticatedUserID)
    const styles = getStyles(appearanceMode)
    const [username, setUsername] = useState('')
    const [usernameAvailability, setUsernameAvailability] = useState(false)
    const [usernames, setUsernames] = useState<string[]>([])

    const handleTextChange = (text:string) => {
        const filteredText = text.replace(/\s/g, '');
        setUsername(filteredText.toLowerCase());
    }

    const setAllUsernames = async () => {
        try {
            const { data, error } = await supabase
            .from('Users')
            .select('username')
            if(data) {
                setUsernames(data.map((username) => username.username))
                
            } 
            if(error) {
                console.log(error)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const checkUsername = () => {
        if(username === '') {
            return;
        }
        const usernameCheck = usernames.includes(username)
        setUsernameAvailability(usernameCheck)
    }

    useEffect(() => {
        setAllUsernames()
    }, [])

    useEffect(() => {
        checkUsername()
    }, [username])
    

    const handleContinue = async () => {
        try {
            if(username === '') {
              return;  
            } else {
                const { error } = await supabase
                .from('Users')
                .update({ username })
                .eq('user_id', userId)
                .single()
                if(error) {
                    Alert.alert('Username exists')
                    return;
                }
                await AsyncStorage.setItem('username', username)
                router.replace('/(auth)/AddNameScreen')
            }
        } catch (error) {
            Alert.alert("An error occured")
        }  
    }


    

    return (
        <View style={styles.container}>
            <Text style={styles.headerText}>Create Username</Text>

            <KeyboardAvoidingView behavior={ Platform.OS === 'ios'? 'padding' : 'height' }  style={styles.footer}>
                <TextInput autoCapitalize='none' value={username} onChangeText={(username) => handleTextChange(username)} placeholder='Start Typing...' style={styles.input}/>
                { !usernameAvailability && <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
                    <Text style={styles.continueText}>Continue</Text>
                </TouchableOpacity>}
                { usernameAvailability && <View style={[styles.continueButton, { backgroundColor: appearanceMode.faint }]}>
                    <Text style={styles.continueText}>Username Exists</Text>
                </View>}
            </KeyboardAvoidingView>
        </View>
    )
}

export default Username

