import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'

const AudioProfileInfo = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserID = useSelector((state:RootState) => state.user.authenticatedUserID)
    const styles = getStyles(appearanceMode)

    const setUserNewToFalse = async () => {
        const { error } = await supabase
        .from('Users')
        .update({ isNew: false })
        .eq('user_id', String(authenticatedUserID))
        if(!error) {
            console.log("User No Longer New")
        } else {
            console.log('An Error Occured', error.message)
        }
    }

    useEffect(() => {
        setUserNewToFalse()
    }, [])

    return (
        <View style={styles.container}>
            <Text style={styles.headerText}>Not Your Regular Text-Based Social Platform</Text>
            <Text style={styles.headerSubText}>Pff... What's Different?</Text>

            <ScrollView contentContainerStyle={{ gap: 30 }}>
            <View style={styles.boxContainer}>
                <Image style={styles.boxImage} source={require('@/assets/images/tyler.jpg')}/>
                <Text style={styles.boxText}>Create An Audio Profile From The Get-go So Others Can Feel More Connected With You {'\n\n\n'}To Listen To An Audio Profile, In The Feed, Long Press Profile Picture. In User Profile, Just Tap Profile Picture</Text>
            </View>
            <View style={styles.boxContainer}>
                <Image style={styles.boxImage} source={require('@/assets/images/minecraft.jpg')}/>
                <Text style={styles.boxText}>Don't Be Boring. Start Convos With Your Voice!</Text>
            </View>
            <View style={styles.boxContainer}>
                <Image style={styles.boxImage} source={require('@/assets/images/robothead.jpg')}/>
                <Text style={styles.boxText}>Did Convo Forget to Say Its Robot Integration Is Unique Compared To Other Platforms? {'\n\n\n'}Chat With Robots Who Emulate Characters You Can Think Of</Text>
            </View>
            <View style={styles.boxContainer}>
                <Image style={styles.boxImage} source={require('@/assets/images/rick.jpg')}/>
                <Text style={styles.boxText}>And Oh... Talk About Anime, And Games😉</Text>
            </View>
            <View style={styles.boxContainer}>
                <Image style={styles.boxImage} source={require('@/assets/images/logo.png')}/>
                <Text style={styles.boxText}>Venture Into A New Social World Where Status Is Non-Existent. Just Conversations With People Who Have Similar Interests With You... {'\n\n'} Or Maybe Friends In Your Private Circle</Text>
            </View>
            </ScrollView>
        </View>
    )
}

export default AudioProfileInfo
