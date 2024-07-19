import { Text, View, TouchableOpacity, TextInput, Image } from 'react-native'
import React, { useState } from 'react'
import getStyles from './styles'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { Feather } from '@expo/vector-icons'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import * as ImagePicker from 'expo-image-picker'
import { setFiles } from '@/state/features/startConvoSlice'
import { supabase } from '@/lib/supabase'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import { convoType, fileType } from '@/types'
import { decode } from 'base64-arraybuffer'
import * as FileSystem from 'expo-file-system'
import { router } from 'expo-router'
import { ResizeMode, Video } from 'expo-av'
import { sendPushNotification } from '@/pushNotifications'

const CreateDiscoverPost = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const file = useSelector((state:RootState) => state.startConvo.files)
    const styles = getStyles(appearanceMode)
    const [title, setTitle] = useState<string>()
    const [caption, setCaption] = useState<string>()
    const [url, setUrl] = useState<string>()
    const dispatch = useDispatch()
    const convoData = {
        convoStarter: caption,
        user_id: authenticatedUserData?.user_id,
        userData: authenticatedUserData,
        private: false,
        link: url,
        dialogue: false,
        isDiscoverable: true
    }
    const handleCreatePost = async () => {
        if(file.length === 0) {
            return;
        }
        const { data, error } = await supabase
        .from('Convos')
        .insert([convoData])
        .select('*')
        .single()
        if(data) {
            const fileUploadPath = await uploadFile(file[0], 0, data.id)
            const { error:updateError } = await supabase
            .from('Convos')
            .update({ files: [fileUploadPath] })
            .eq('convo_id', String(data.convo_id))
            if(!updateError) {
                const { error } = await supabase
                .from('discoverables')
                .insert({ title, convo_id: data.convo_id })
                if(!error) {
                    await dispatch(setSystemNotificationState(true))
                    await dispatch(setSystemNotificationData({ type: 'success', message: 'Discover Post Created' }))
                    await sendNotification()
                    await router.back()
                } else {
                    dispatch(setSystemNotificationState(true))
                    dispatch(setSystemNotificationData({ type: 'error', message: 'An Error Occured' }))
                }
            }
        } else if(error) {
            dispatch(setSystemNotificationState(true))
            dispatch(setSystemNotificationData({ type: 'success', message: 'An Error Occured' }))
        }
    }

    const pickFile = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if(status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!')
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            quality: 1,
            videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
            videoMaxDuration: 60,
            selectionLimit: 1
        })

        if(!result.canceled) {
            dispatch(setFiles((result.assets)))
        }
    }

    const uploadFile = async (file: fileType, index: number, convo_id: string): Promise<string | null> => {
        const extension = file.uri.split('.').pop()?.toLowerCase();
        const filepath = `Discoverables/${convo_id}/${index}.${extension}`;
        let contentType: string;
    
        if (['jpg', 'jpeg', 'png', 'webp'].includes(String(extension))) {
            contentType = `image/${extension}`;
        } else if (['mp4', 'mov', 'avi'].includes(String(extension))) {
            contentType = `video/${extension}`;
        } else {
            throw new Error(`Unsupported file type: ${extension}`);
        }
    
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
        
        // Convert base64 to ArrayBuffer
        const arrayBuffer = decode(base64);
        const { error } = await supabase.storage
            .from('userfiles')
            .upload(filepath, arrayBuffer, {
                contentType,
                cacheControl: '31536000',
                upsert: true // This will replace the file if it already exists
            });
        if (error) {
            throw error;
        }
        return filepath;
    };

    const readyNotification = async (user_id:string) => {
        try {
            const notificationData = {
                sender_id: authenticatedUserData?.user_id,
                senderUserData: authenticatedUserData,
                receiver_id: user_id,
                data: { title, caption, file },
                type: 'discover',
            }
    
            const { error } = await supabase
            .from('notifications')
            .insert([notificationData])
            if(!error) {
                console.log("Notification sent successfully")
            } else {
                console.log("Error sending notification: ", error.message)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const sendNotification = async () => {
        try {
            const { data, error } = await supabase
                .from('Users')
                .select();
            
            if (error) {
                console.log("Problem fetching users: ", error.message);
                return;
            }
            if (data) {
                dispatch(setSystemNotificationState(true))
                dispatch(setSystemNotificationData({ type: 'neutral', message: 'Sending Notifications For Highlights...' }))
                for (const user of data) {
                    await readyNotification(String(user.user_id));
                    await sendPushNotification(String(user.pushToken), `${title}`, `${caption}`, 'discover', null, null, user.user_id)
                }
            }
        } catch (error) {
            console.log("Unexpected error: ", error);
        }
    }

    return (
        <KeyboardAwareScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Create Discover Post</Text>
            </View>

            <View style={[styles.mediaContainer, file.length > 0 && { borderStyle: 'solid', borderColor: appearanceMode.backgroundColor }]}>
                { file.length === 0 && <TouchableOpacity onPress={pickFile} style={styles.mediaButton}>
                    <Feather size={100} color={appearanceMode.textColor} name='image'/>
                </TouchableOpacity> }
                { file.length === 1 && file[0].type === 'image' && <TouchableOpacity onPress={pickFile} style={[styles.mediaButton]}>
                    <Image source={{ uri: file[0].uri }} style={styles.mediaImage}/>
                </TouchableOpacity> }
                { file.length === 1 && file[0].type === 'video' && <TouchableOpacity onPress={pickFile} style={[styles.mediaButton]}>
                    <Video
                        source={{ uri: file[0].uri }}
                        style={styles.mediaImage}
                        resizeMode={ResizeMode.COVER}
                    />
                </TouchableOpacity> }
            </View>

            <View style={styles.inputContainer}>
                <TextInput value={title} onChangeText={(text) => setTitle(text)} style={styles.textInput} placeholder='Title'/>
                <TextInput value={caption} onChangeText={(text) => setCaption(text)} style={styles.textInput} placeholder='Caption'/>
                <TextInput value={url} onChangeText={(text) => setUrl(text)} style={styles.textInput} placeholder='Link'/>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleCreatePost} style={styles.createButton}>
                    <Text style={styles.createButtonText}>Create Post</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAwareScrollView>
    )
}

export default CreateDiscoverPost
