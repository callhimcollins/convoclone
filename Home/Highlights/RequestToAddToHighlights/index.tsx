import { StyleSheet, Text, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Image } from 'react-native'
import React, { useCallback, useState } from 'react'
import getStyles from './styles'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { Entypo, FontAwesome6, Ionicons } from '@expo/vector-icons'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { router } from 'expo-router'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { setFiles } from '@/state/features/startConvoSlice'
import { ResizeMode, Video } from 'expo-av'
import { supabase } from '@/lib/supabase'
import { fileType } from '@/types'
import { decode } from 'base64-arraybuffer'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import { BlurView } from 'expo-blur'
import { togglePlayPause } from '@/state/features/mediaSlice'
import SystemNotification from '@/components/Notifications/SystemNotifications'


const RequestToAddToHighlights = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
    const files = useSelector((state: RootState) => state.startConvo.files)
    const [content, setContent] = useState<string>('')
    const isPlaying = useSelector((state:RootState) => state.media.playState)
    const styles = getStyles(appearanceMode)
    const dispatch = useDispatch()

    const convoData = {
        convoStarter: content,
        user_id: authenticatedUserData?.user_id,
        userData: authenticatedUserData,
        private: false,
        link: null,
        dialogue: false,
        isHighlight: true
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
        dispatch(setSystemNotificationState(true))
        dispatch(setSystemNotificationData({ message: 'Uploading file. This may take a moment. You will Be Redirected', type: 'neutral' }));
        const extension = file.uri.split('.').pop()?.toLowerCase();
        const filepath = `Highlights/${convo_id}/${index}.${extension}`;
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

    const handleSendRequest = async () => {
        if(!content && files.length === 0) {
            return;
        }
        const { data, error } = await supabase
        .from('Convos')
        .insert([convoData])
        .select()
        .single()
        if(!error) {
            const filepath = await uploadFile(files[0], 0, data.id)
            const { error } = await supabase
            .from('Convos')
            .update({ files: [filepath] })
            .eq('convo_id', data.convo_id)
            if(error) {
                console.log("Error updating convo", error.message)
            } else {
                console.log("Convo updated successfully")
                const { error } = await supabase
                .from('highlights')
                .insert({ convo_id: data.convo_id })
                if(!error) {
                    dispatch(setSystemNotificationState(true))
                    dispatch(setSystemNotificationData({ message: 'Request Sent', type: 'success' }))
                    setContent('')
                    dispatch(setFiles([]))
                    router.back()
                } else {
                    console.log("Error creating highlight: ", error.message)
                }
            }
        } else {
            console.log("Error creating convo: ", error.message)
        }
    }

    const handlePlayPause = useCallback(async (file: string) => {
        const videoId = `${file}`;
        await dispatch(togglePlayPause({ index: videoId }));
    }, [dispatch])

    return (
        <View style={styles.container}>
            <View style={styles.notificationContainer}>
                <SystemNotification/>
            </View>
            <View style={styles.header}>
                <Text style={styles.headerText}>Request To Add To Highlights</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={38} color={appearanceMode.textColor} />
                </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView>
                <View style={styles.contentContainer}>
                    <View style={styles.infoContainer}>
                        <Text style={styles.infoText}>To Increase Your Chances Of Approval, Make Sure Your Content Is Conversation-Worthy</Text>
                    </View>
                    <TouchableOpacity onPress={pickFile} style={[styles.mediaContainer, files.length > 0 && { borderWidth: 0 }]}>
                        { files.length === 0  ? <Ionicons size={100} color={appearanceMode.faint} name='image'/> : 
                        <View>
                            { files[0].type === 'image' ? <Image style={styles.media} source={{ uri: files[0].uri }}/> :
                            <View>
                                <View style={styles.buttonContainerLayout}>
                                    <TouchableOpacity onPress={() => handlePlayPause(files[0].uri)}>
                                        <BlurView style={styles.buttonBackDrop}>
                                            { isPlaying?.index === files[0].uri && isPlaying?.playState ? <Image style={styles.mediaControlImage} source={require('@/assets/images/pause.png')}/> : <Image style={styles.mediaControlImage} source={require('@/assets/images/play.png')}/>}
                                        </BlurView>
                                    </TouchableOpacity>
                                </View>
                                <Video isLooping shouldPlay={isPlaying?.index === files[0].uri && isPlaying?.playState ? true : false} resizeMode={ResizeMode.COVER} style={styles.media} source={{ uri: files[0].uri }}/> 
                            </View>
                             }
                        </View>                        
                        }
                    </TouchableOpacity>

                    <TextInput value={content} onChangeText={(text) => setContent(text)} placeholderTextColor={appearanceMode.faint} placeholder='Type Something' style={styles.textInput}/>
                </View>
            </KeyboardAwareScrollView>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleSendRequest} style={styles.requestButton}>
                    <Text style={styles.requestButtonText}>Request</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default RequestToAddToHighlights

