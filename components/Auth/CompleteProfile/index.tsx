import { Image, Text, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { Link, router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { FileObject } from '@supabase/storage-js'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { setAuthenticatedUserData } from '@/state/features/userSlice'
import { randomUUID } from 'expo-crypto'
import { Audio } from 'expo-av'
interface SelectedImageType {
    uri: string,
    type: string
}

const CompleteProfile = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const userId = useSelector((state: RootState) => state.user.authenticatedUserID)
    const dispatch = useDispatch()
    const [bio, setBio] = useState('')
    const [selectedImage, setSelectedImage] = useState<SelectedImageType | null>()
    const [recording, setRecording] = useState(null)
    const [isRecording, setIsRecording] = useState(false)
    const styles = getStyles(appearanceMode)

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if(status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!')
        }
    }


    const pickImage = async () => {
        await requestPermissions()
        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true
        }

        const result = await ImagePicker.launchImageLibraryAsync(options);
        if(!result.canceled) {
            setSelectedImage({uri: result.assets[0].uri || '', type: result?.assets[0]?.type || '' })
        }
    }

    const uploadImage = async () => {
        if(!selectedImage?.uri?.startsWith('file')) {
            return;
        }

        const base64 = await FileSystem.readAsStringAsync(selectedImage.uri, { encoding: 'base64' })
        const filepath = `Users/${userId}/${randomUUID()}.png`;
        const contentType = 'image/png';
        const { data } = await supabase
        .storage
        .from('files')
        .upload(filepath, decode(base64), { contentType })
        if(data) {
            return (data.path)
        }
    }

    const dispatchUserData = async () => {
        const { data, error } = await supabase
        .from('Users')
        .select('*')
        .eq('user_id', String(userId))
        .single()
        if(data) {
            dispatch(setAuthenticatedUserData(data))
        } else if(error) {
            console.log("Couldn't set user")
        }
    }

    const handleCompleteProfile = async () => {
        try {
            if(selectedImage) {
                try {
                    const profileImage = await uploadImage()
                    const { error } = await supabase
                    .from('Users')
                    .update({profileImage})
                    .eq('user_id', String(userId))
                    .single()
                    if(error) {
                        return;
                    } else {
                        console.log("Profile completed")
                    }
                } catch (error) {
                    console.log(error)
                    return;
                }
            }
            if(bio !== '') {
                try {
                    const { error } = await supabase
                    .from('Users')
                    .update({bio})
                    .eq('user_id', String(userId))
                    .select()
                    if(error) {
                        return;
                    } else {
                        console.log("Profile completed")
                    }
                } catch (error) {
                    console.log(error)
                    return;
                }
            }
            await dispatchUserData()
            router.replace('/(tabs)/')
        } catch (error) {
            console.log(error)
        }
    }


    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Complete Profile</Text>
                <Text style={styles.subHeaderText}>Add audio to create an <Link style={styles.link} href={''}>Audio Profile</Link></Text>
            </View>

            <View style={styles.contentContainer}>

                <View style={styles.contentTop}>
                    <View>
                        { selectedImage && <Image style={styles.image} source={{ uri: selectedImage?.uri }}/>}
                        { !selectedImage && <Image style={styles.image} source={require('@/assets/images/blankprofile.png')}/>}
                        <TouchableOpacity onPress={pickImage} style={styles.imageOverlayContainer}>
                            <Text style={styles.imageOverlayText}>Change</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.recordButton}>
                        <Text style={styles.buttonText}>Record Audio</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bioContainer}>
                    <TextInput placeholderTextColor={appearanceMode.faint} value={bio} onChangeText={(bio) => setBio(bio)} placeholder='Write a Bio' style={styles.bioInput}/>
                </View>
            </View>

            <KeyboardAvoidingView 
                style={styles.footer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <TouchableOpacity onPress={handleCompleteProfile} style={styles.createProfileButton}>
                    <Text style={styles.createProfileText}>Create Profile</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </View>
    )
}

export default CompleteProfile

