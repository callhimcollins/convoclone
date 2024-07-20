import { Image, Text, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
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
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import AsyncStorage from '@react-native-async-storage/async-storage'
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
    const [recording, setRecording] = useState<any>(false)
    const [recordingUri, setRecordingUri] = useState('')
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isRecordingState, setIsRecordingState] = useState<boolean>(false)
    const [isPaused, setIsPaused] = useState(true)
    const audioLevels = Array(10).fill(0).map(() => useSharedValue(0.1));
    const recordContainerHeight = useSharedValue(0)
    const recordContainerOpacity = useSharedValue(0)
    const styles = getStyles(appearanceMode)
    const animatedRecordContainerstyle = useAnimatedStyle(() => {
        return {
            height: recordContainerHeight.value,
            opacity: recordContainerOpacity.value
        }
    })

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if(status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!')
        }
    }

    const onRecordingStatusUpdate = (status: any) => {
        if (status.metering !== undefined) {
          const level = Math.min(Math.max((status.metering + 160) / 160, 0), 1);
          
          audioLevels.forEach((sharedValue) => {
            if (Math.random() > 0.5) {
              const newValue = Math.max(Math.random() * (level + 0.2), 0.1); // Ensure minimum value
              sharedValue.value = withSpring(newValue, {
                damping: 10,
                stiffness: 80,
              });
            }
          });
        }
    };

    const startRecording = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true
            });


            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY,
                onRecordingStatusUpdate,
                100 // Update every 100ms
            );
            setRecording(recording);
            setIsRecordingState(true)
            recordContainerHeight.value = withTiming(50);
            recordContainerOpacity.value = withTiming(1);
            // If there's an existing sound, unload it
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }
        } catch (error) {
            console.log('Failed To Start Recording', error);
        }
    };


    const stopAndSaveRecording = async () => {
        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecordingUri(uri)
            setRecording(null);

            recordContainerHeight.value = withTiming(0);
            recordContainerOpacity.value = withTiming(0);

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: false,
                staysActiveInBackground: false,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: false,
            });

            // Create a new sound object with the latest recording
            const { sound: newSound } = await Audio.Sound.createAsync({ uri });
            setSound(newSound);
            setIsPaused(true);
            setIsRecordingState(false)
        } catch (error) {
            console.error("Error stopping the recording:", error);
        }
    };

    const playRecording = async () => {
        try {
            if (sound) {
                if (isPaused) {
                    await sound.playAsync();
                    sound.setOnPlaybackStatusUpdate(async (status: any) => {
                        if (status.didJustFinish) {
                            await sound.setPositionAsync(0);
                            setIsPaused(true);
                        }
                    })
                } else {
                    await sound.setPositionAsync(0);
                    await sound.playAsync();
                }
                setIsPaused(false);
            } else if (recordingUri) {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: recordingUri },
                    { shouldPlay: true }
                );
                setSound(newSound);
                setIsPaused(false);

                newSound.setOnPlaybackStatusUpdate(async (status: any) => {
                    if (status.didJustFinish) {
                        setIsPaused(true);
                        await newSound.setPositionAsync(0);
                    }
                });
            } else {
                dispatch(setSystemNotificationState(true));
                dispatch(setSystemNotificationData({ type: 'neutral', message: 'Nothing To Play' }));
            }
        } catch (error) {
            dispatch(setSystemNotificationState(true));
            dispatch(setSystemNotificationData({ type: 'error', message: 'An Error Occurred' }));
        }
    };

    const pauseRecording = async () => {
        if (sound && !isPaused) {
            try {
                await sound.pauseAsync();
                setIsPaused(true);
            } catch (error) {
                console.error("Error pausing the recording:", error);
            }
        }
    };

    const deleteRecording = async () => {
        setSound(null);
        setRecordingUri('')
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
        const username = await AsyncStorage.getItem('username')
        if(username) {
            const base64 = await FileSystem.readAsStringAsync(selectedImage.uri, { encoding: 'base64' })
            const filepath = `${username}-profileImage`;
            const contentType = 'image/png';
            const { data } = await supabase
            .storage
            .from('userfiles')
            .upload(filepath, decode(base64), { contentType, cacheControl: '31536000', upsert: true })
            if(data) {
                return data?.path
            } else {
                dispatch(setSystemNotificationState(true));
                dispatch(setSystemNotificationData({ type: 'error', message: 'Failed To Upload Image' }));
            }
        }
    }

    const uploadAudioProfile = async () => {
        if(!recordingUri?.startsWith('file')) {
            return;
        }
        const username = await AsyncStorage.getItem('username')
        if(username && recordingUri) {
            const base64 = await FileSystem.readAsStringAsync(recordingUri, { encoding: 'base64' })
            const filepath = `${username}-audioProfile`;
            const contentType = 'audio/mpeg'
            const { data, error } = await supabase
            .storage
            .from('userfiles')
            .upload(filepath, decode(base64), { cacheControl: '3600', upsert: true, contentType })
            if(data) {
                console.log('Uploaded in database')
                const { error:updateError } = await supabase
                .from('Users')
                .update({ audio: `${username}-audioProfile`})
                .eq('user_id', String(userId))
                if(!updateError) {
                    console.log("Updated profile background in database")
                } else {
                    console.log("Couldn't update profile background in database")
                }
            } else if(error) {
                console.log("error uploading profile background", error.message)
            }
        } else {
            console.log('No Audio')
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
                const username = await AsyncStorage.getItem('username')
                try {
                    const imageUpload = await uploadImage()
                    if(imageUpload){
                        const { error } = await supabase
                        .from('Users')
                        .update({ profileImage: `${username}-profileImage`})
                        .eq('user_id', String(userId))
                        if(!error) {
                            console.log("image updated in db successfully")
                        }
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
            await uploadAudioProfile()
            await dispatchUserData()
            router.replace('/(tabs)/')
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        return sound
            ? () => {
                  sound.unloadAsync();
              }
            : undefined;
    }, [sound]);


    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Complete Profile</Text>
                <Text style={styles.subHeaderText}>Add audio to create an <Link style={styles.link} href={'/(auth)/AudioProfileInfoScreen'}>Audio Profile</Link></Text>
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


                    <View style={styles.recordingContainer}>
                        { !isRecordingState && <TouchableOpacity onPress={startRecording} style={styles.recordButton}>
                            <Text style={styles.buttonText}>Record Audio</Text>
                        </TouchableOpacity>}
                        { isRecordingState && <TouchableOpacity onPress={stopAndSaveRecording} style={styles.recordButton}>
                            <Text style={styles.buttonText}>Stop Recording</Text>
                        </TouchableOpacity>}

                        { sound && recordingUri && <View style={styles.mediaActionContainer}>
                            { sound && isPaused && <TouchableOpacity onPress={playRecording} style={styles.mediaButton}>
                                <Image source={require('@/assets/images/play.png')} style={styles.iconImage}/>
                                <Text style={styles.mediaText}>Play</Text>
                            </TouchableOpacity>}

                            { sound && !isPaused && <TouchableOpacity onPress={pauseRecording} style={styles.mediaButton}>
                                <Image source={require('@/assets/images/pause.png')} style={styles.iconImage}/>
                                <Text style={styles.mediaText}>Pause</Text>
                            </TouchableOpacity>}
                            
                            <TouchableOpacity onPress={deleteRecording} style={styles.deleteButton}>
                                <Image source={require('@/assets/images/bin.png')} style={styles.iconImage}/>
                            </TouchableOpacity>
                        </View>}

                        <Animated.View style={[styles.visualizer, animatedRecordContainerstyle]}>
                        {audioLevels.map((sharedValue, index) => {
                            const animatedStyle = useAnimatedStyle(() => {
                            const height = Math.max(sharedValue.value * 50, 5); // Ensure minimum height
                            return {
                                height,
                                backgroundColor: `rgba(98, 95, 224, ${Math.max(sharedValue.value, 0.2)})`,
                            };
                            });
                            return (
                            <Animated.View
                                key={index}
                                entering={FadeIn}
                                style={[styles.bar, animatedStyle]}
                            />
                            );
                        })}
                        </Animated.View>
                    </View>

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

