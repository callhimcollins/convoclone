import { Text, View, Image, TouchableOpacity, TextInput, Dimensions } from 'react-native'
import getStyles from './styles'
import { useDispatch, useSelector } from 'react-redux'
import React, { useEffect, useState } from 'react'
import { RootState } from '@/state/store'
import EditProfileHeader from './EditProfileHeader'
import RemoteImage from '@/components/RemoteImage'
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { supabase } from '@/lib/supabase'
import { setAuthenticatedUserData } from '@/state/features/userSlice'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { Audio } from 'expo-av'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import SystemNotification from '@/components/Notifications/SystemNotifications'

interface SelectedImageType {
    uri: string,
    type: string
}
const inputContainerWidth = Dimensions.get('window').width
const inputFields = ["Change Username", "Edit Name", "Edit Bio", "Change Email", "Change Password"]
const EditProfile = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const [activeInputField, setActiveInputField] = useState<string>()
    const [username, setUsername] = useState<string>()
    const [usernames, setUsernames] = useState<string[]>()
    const [usernameExists, setUsernameExists] = useState<boolean>(false)
    const [emails, setEmails] = useState<string[]>()
    const [emailExists, setEmailExists] = useState<boolean>(false)
    const [name, setName] = useState<string>()
    const [bio, setBio] = useState<string>()
    const [email, setEmail] = useState<string>()
    const [password, setPassword] = useState<string>()
    const [confirmPassword, setConfirmPassword] = useState<string>()
    const [selectedProfileImage, setSelectedProfileImage] = useState<SelectedImageType | null>()
    const [selectedProfileBackground, setSelectedProfileBackground] = useState<SelectedImageType | null>()
    const [passwordMatch, setPasswordMatch] = useState<boolean>(true)
    const [passwordVisible, setPasswordVisible] = useState<boolean>(false)
    const [recording, setRecording] = useState<any>(false)
    const [recordingUri, setRecordingUri] = useState('')
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isRecordingState, setIsRecordingState] = useState<boolean>(false)
    const [isPaused, setIsPaused] = useState(true)
    const inputContainerVisibility = useSharedValue(1)
    const inputContainerPosition = useSharedValue(0)
    const inputVisibility = useSharedValue(0)
    const inputPosition = useSharedValue(0)
    const styles = getStyles(appearanceMode)
    const dispatch = useDispatch()
    const audioLevels = Array(10).fill(0).map(() => useSharedValue(0.1));
    const recordContainerHeight = useSharedValue(0)
    const recordContainerOpacity = useSharedValue(0)

    const recordContainerAnimatedStyle = useAnimatedStyle(() => {
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
            dispatch(setSystemNotificationState(true))
            dispatch(setSystemNotificationData({ type: 'neutral', message: "For The Best Experience, Keep Your Recording Short"}))
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
      
              // Set a timeout to stop the recording after MAX_RECORDING_DURATION
                
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
                  playsInSilentModeIOS: true,
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
                dispatch(setSystemNotificationData({ type: 'error', message: 'Nothing To Play' }));
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


    const uploadImage = async () => {
        if(!selectedProfileImage?.uri?.startsWith('file')) {
            return;
        }
        if(authenticatedUserData) {
            const base64 = await FileSystem.readAsStringAsync(selectedProfileImage.uri, { encoding: 'base64' })
            const filepath = `${authenticatedUserData?.username}-profileImage`;
            const contentType = 'image/png';
            const { data, error } = await supabase
            .storage
            .from('userfiles')
            .upload(filepath, decode(base64), { cacheControl: '3600', upsert: true, contentType })
            if(data) {
                dispatch(setSystemNotificationState(true))
                dispatch(setSystemNotificationData({ type: 'success', message: "Image Updated. Update Will Not Reflect Instantly"}))                
                return (data.path)
            } else if(error) {
                dispatch(setSystemNotificationState(true))
                dispatch(setSystemNotificationData({ type: 'error', message: "An Error Occured"}))
            }
        }
    }


    const uploadProfileBackground = async () => {
        if(!selectedProfileBackground?.uri?.startsWith('file')) {
            return;
        }
        if(authenticatedUserData) {
            const base64 = await FileSystem.readAsStringAsync(selectedProfileBackground.uri, { encoding: 'base64' })
            const filepath = `${authenticatedUserData.username}-backgroundProfileImage`;
            const contentType = 'image/png';
            const { data, error } = await supabase
            .storage
            .from('userfiles')
            .upload(filepath, decode(base64), { cacheControl: '3600', upsert: true, contentType })
            if(data) {
                console.log('Uploaded in database')
                if(!authenticatedUserData.backgroundProfileImage) {
                    const { error:updateError } = await supabase
                    .from('Users')
                    .update({ backgroundProfileImage: `${authenticatedUserData.username}-backgroundProfileImage`})
                    .eq('user_id', String(authenticatedUserData?.user_id))
                    if(!updateError) {
                        dispatch(setSystemNotificationState(true))
                        dispatch(setSystemNotificationData({ type: 'success', message: "Image Updated. Update Will Not Reflect Instantly"}))
                    } else {
                        dispatch(setSystemNotificationState(true))
                        dispatch(setSystemNotificationData({ type: 'error', message: "An Error Occured"}))}
                }
            } else if(error) {
                console.log("error uploading profile background", error.message)
            }
        } else {
            return;
        }
    }

    const uploadAudioProfile = async () => {
        if(!recordingUri?.startsWith('file')) {
            return;
        }
        if(authenticatedUserData) {
            const base64 = await FileSystem.readAsStringAsync(recordingUri, { encoding: 'base64' })
            const filepath = `${authenticatedUserData.username}-audioProfile`;
            const contentType = 'audio/mpeg'
            const { data, error } = await supabase
            .storage
            .from('userfiles')
            .upload(filepath, decode(base64), { cacheControl: '3600', upsert: true, contentType })
            if(data) {
                console.log('Uploaded in database')
                if(!authenticatedUserData.audio) {
                    const { error:updateError } = await supabase
                    .from('Users')
                    .update({ audio: `${authenticatedUserData.username}-audioProfile`})
                    .eq('user_id', String(authenticatedUserData?.user_id))
                    if(!updateError) {
                        console.log("Updated profile background in database")
                    } else {
                        console.log("Couldn't update profile background in database")
                    }
                }
            } else if(error) {
                console.log("error uploading profile background", error.message)
            }
        }
    }

    const pickProfileImage = async () => {
        await requestPermissions()
        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true
        }

        const result = await ImagePicker.launchImageLibraryAsync(options);
        if(!result.canceled) {
            setSelectedProfileImage({uri: result.assets[0].uri || '', type: result?.assets[0]?.type || '' })
        }
    }

    const pickProfileBackground = async () => {
        await requestPermissions()
        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true
        }

        const result = await ImagePicker.launchImageLibraryAsync(options);
        if(!result.canceled) {
            setSelectedProfileBackground({uri: result.assets[0].uri || '', type: result?.assets[0]?.type || '' })
        }
    }

    const animatedInputContainer = useAnimatedStyle(() => {
        return {
            opacity: inputContainerVisibility.value,
            transform: [{
                translateY: inputContainerPosition.value
            }]
        }
    })
    const animatedInputStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                translateY: inputPosition.value
            }],
            opacity: inputVisibility.value
        }
    })

    const handleUsernameChange = (text:string) => {
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

    const setAllEmails = async () => {
        try {
            const { data, error } = await supabase
            .from('Users')
            .select('email')
            if(data) {
                setEmails(data.map((username) => username.email))
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
        if(usernames) {
            const usernameFiltered = usernames.filter((username) => username !== authenticatedUserData?.username)
            const usernameCheck = usernameFiltered.includes(String(username))
            setUsernameExists(usernameCheck)
        }
    }

    const checkEmail = () => {
        if(email === '') {
            return;
        }
        if(emails) {
            const emailFiltered = emails.filter((email) => email !== authenticatedUserData?.email)
            const emailCheck = emailFiltered.includes(String(email))
            setEmailExists(emailCheck)
        }
    }

    useEffect(() => {
        setAllUsernames()
        setAllEmails()
    }, [])

    useEffect(() => {
        checkUsername()
    }, [username])

    useEffect(() => {
        checkEmail()
    }, [email])

    const toggleInputContainer = (index: number) => {
        setActiveInputField(inputFields[index])
        inputContainerVisibility.value = withTiming(0)
        inputVisibility.value = withTiming(1)
        inputContainerPosition.value = withTiming(inputContainerWidth)
        inputPosition.value = withTiming(-150)
    }

    const handleDone = () => {
        inputContainerVisibility.value = withTiming(1)
        inputContainerPosition.value = withTiming(0)
        inputPosition.value = withTiming(0)
        inputVisibility.value = withTiming(0)
    }

    useEffect(() => {
        if(password !== confirmPassword) {
            setPasswordMatch(false)
        } else {
            setPasswordMatch(true)
        }
    }, [password, confirmPassword])

    const handleSaveChanges = async () => {
        try {
            if(bio !== '') {
                const { error } = await supabase
                .from('Users')
                .update({ bio })
                .eq('user_id', authenticatedUserData?.user_id)
                .single()
                if(!error) {
                    console.log("Successfully updated bio")
                } else {
                    console.log("Error updating bio", error.message)
                }
            }

            if(name !== '') {
                const { error } = await supabase
                .from('Users')
                .update({ name })
                .eq('user_id', authenticatedUserData?.user_id)
                .single()
                if(!error) {
                    console.log("Successfully updated name")
                } else {
                    console.log("Error updating name", error.message)
                }
            }

            if(username !== '') {
                if(username === authenticatedUserData?.username) {
                    console.log("No changes")
                    return;
                }
                const { error } = await supabase
                .from('Users')
                .update({ username })
                .eq('user_id', authenticatedUserData?.user_id)
                .single()
                if(!error) {
                    console.log("Successfully updated username")
                } else {
                    console.log("Error updating name", error.message)
                }
            }

            if(email !== '') {
                const { error } = await supabase.auth.updateUser({ email })
                if(!error) {
                    console.log("Successfully updated email")
                } else {
                    console.log("Error updating email", error.message)
                }
            }

            if(password !== '') {
                const { error } =  await supabase.auth.updateUser({ password })
                if(!error) {
                    console.log("Successfully updated password")
                } else {
                    console.log("Error updating password", error.message)
                }
            }
            if(selectedProfileImage !== null) {
                await uploadImage()
            }
            if(selectedProfileBackground !== null) {
                await uploadProfileBackground()
            }
            if(recordingUri !== '') {
                await uploadAudioProfile();
            }
        } catch (error) {
            
        } finally {
            const { data, error } = await supabase
            .from('Users')
            .select('*')
            .eq('user_id', authenticatedUserData?.user_id)
            .single()

            if(!error) {
                console.log("Checking")
                dispatch(setAuthenticatedUserData(data))
                router.back();
            }
        }
    }

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible)
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
            <EditProfileHeader/>
            <View style={styles.notificationContainer}>
                <SystemNotification/>
              </View>
            <KeyboardAwareScrollView  style={styles.contentContainer}>
                <View>
                    <View style={styles.profileBackgroundImageContainer}>
                        <TouchableOpacity onPress={pickProfileBackground} style={styles.profileBackgroundImageButton}>
                            <Text style={styles.profileBackgroundImageButtonText}>Change</Text>
                        </TouchableOpacity>
                        { !selectedProfileBackground && <RemoteImage skeletonHeight={styles.profileBackgroundImage.height} skeletonWidth={Dimensions.get('window').width * .95} style={styles.profileBackgroundImage} path={authenticatedUserData?.backgroundProfileImage}/>}
                        { selectedProfileBackground && <Image style={styles.profileBackgroundImage} source={{ uri: selectedProfileBackground.uri }}/>}
                    </View>
                    <TouchableOpacity style={[styles.removeImageButton, { marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={styles.removeImageButtonText}>Remove Image</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.profileImageContainer}>
                    <View>
                        <TouchableOpacity onPress={pickProfileImage} style={styles.profileImageButton}>
                            <Text style={styles.profileImageButtonText}>Change</Text>
                        </TouchableOpacity>
                        { !selectedProfileImage && <RemoteImage skeletonHeight={styles.profileImage.height} skeletonWidth={styles.profileImage.width} style={styles.profileImage} path={`${authenticatedUserData?.username}-profileImage`}/>}
                        { selectedProfileImage && <Image style={styles.profileImage} source={{ uri: selectedProfileImage.uri }}/> }
                    </View>

                    <TouchableOpacity style={styles.removeImageButton}>
                        <Text style={styles.removeImageButtonText}>Remove Image</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.audioContainer}>
                   { isPaused &&  <TouchableOpacity onPress={playRecording} style={styles.playButtonContainer}>
                        <View style={styles.playButton}>
                            <Image style={styles.playButtonImage} source={require('@/assets/images/play.png')}/>
                        </View>

                        <Text style={styles.playButtonText}>Play Audio Profile</Text>
                    </TouchableOpacity>}
                   { !isPaused &&  <TouchableOpacity onPress={pauseRecording} style={styles.playButtonContainer}>
                        <View style={styles.playButton}>
                            <Image style={styles.playButtonImage} source={require('@/assets/images/pause.png')}/>
                        </View>

                        <Text style={styles.playButtonText}>Pause Audio Profile</Text>
                    </TouchableOpacity>}

                    <View style={{ flexDirection: 'row', gap: 5 }}>
                        <TouchableOpacity onPress={startRecording} style={styles.changeAudioProfileButton}>
                            <Text style={styles.changeAudioProfileButtonText}>{ isRecordingState ? "Listening..." : "Change Audio Profile" }</Text>
                        </TouchableOpacity>
                        { isRecordingState && <TouchableOpacity onPress={stopAndSaveRecording} style={styles.changeAudioProfileButton}>
                            <Image style={styles.playButtonImage} source={require('@/assets/images/stop.png')}/>
                        </TouchableOpacity>}
                    </View>
                </View>

                <Animated.View style={[styles.visualizer, recordContainerAnimatedStyle]}>
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


                <Animated.View  style={[styles.textInputContaniner, animatedInputContainer]}>
                    {inputFields.map((input, index) => {
                        return (
                            <TouchableOpacity onPress={() => toggleInputContainer(index)} style={styles.inputButton} key={index}>
                                <Text style={styles.inputButtonText}>{input}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </Animated.View>

                { activeInputField && activeInputField === "Change Username" && 
                    <View>
                        <Animated.View style={[styles.inputMainContainer,animatedInputStyle]}>
                            <TextInput value={username} placeholderTextColor={'gray'} onChangeText={handleUsernameChange} style={styles.textInput} placeholder={String(authenticatedUserData?.username)}/>

                            { !usernameExists && <View>
                                <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
                                    <Text style={styles.doneButtonText}>Done</Text>
                                </TouchableOpacity>
                            </View>}
                        { usernameExists && <Text style={styles.usernameExistsText}>Username Exists</Text>}
                        </Animated.View>

                    </View>
                }
                { activeInputField && activeInputField === "Edit Name" && 
                    <Animated.View style={[styles.inputMainContainer,animatedInputStyle]}>
                        <TextInput value={name} onChangeText={(e) => setName(e)} style={styles.textInput} placeholder={String(authenticatedUserData?.name) || "Edit Name"}/>
                        <View>
                            <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
                                <Text style={styles.doneButtonText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                }
                { activeInputField && activeInputField === "Edit Bio" && 
                    <Animated.View style={[styles.inputMainContainer,animatedInputStyle]}>
                        <TextInput value={bio} onChangeText={(e) => setBio(e)} style={styles.textInput} placeholder={String(authenticatedUserData?.bio) || "Edit Bio"}/>

                        <View>
                            <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
                                <Text style={styles.doneButtonText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                }
                { activeInputField && activeInputField === "Change Email" && 
                    <Animated.View style={[styles.inputMainContainer,animatedInputStyle]}>
                        <TextInput value={email} onChangeText={(e) => setEmail(e)} style={styles.textInput} placeholder={activeInputField}/>

                        { !emailExists && <View>
                            <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
                                <Text style={styles.doneButtonText}>Done</Text>
                            </TouchableOpacity>
                        </View>}
                        { emailExists && <Text style={{ color: appearanceMode.textColor, fontFamily: 'extrabold' }}>Email Exists With Another Account</Text>}
                    </Animated.View>
                }
                { activeInputField && activeInputField === "Change Password" && 
                    <Animated.View style={[animatedInputStyle]}>
                        <View style={[styles.inputMainContainer]}>
                            <TextInput secureTextEntry={!passwordVisible} value={password} onChangeText={(e) => setPassword(e)} style={styles.textInput} placeholder={activeInputField}/>
                            <TextInput secureTextEntry={!passwordVisible} value={confirmPassword} onChangeText={(e) => setConfirmPassword(e)} style={styles.textInput} placeholder="Confirm Password"/>
                            <TouchableOpacity onPress={togglePasswordVisibility}>
                                { passwordVisible ? <Image style={{ width: 35, height: 35 }} source={require('@/assets/images/passwordunlock.png')}/> : <Image style={{ width: 35, height: 35 }} source={require('@/assets/images/passwordlock.png')}/>}
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginHorizontal: 20, transform: [{ translateY: -40 }] }}>
                            { !passwordMatch && <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                                <Text style={styles.passwordsDontMatchText}>Passwords Don't Match</Text>
                                <TouchableOpacity onPress={handleDone} style={[styles.removeImageButton, { justifyContent: 'center', paddingHorizontal: 20 }]}>
                                    <Text style={styles.removeImageButtonText}>Close</Text>
                                </TouchableOpacity>
                            </View>}
                            { passwordMatch && <View>
                                <TouchableOpacity onPress={handleDone} style={[styles.doneButton, { justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={styles.doneButtonText}>Done</Text>
                                </TouchableOpacity>
                            </View>}
                        </View>
                    </Animated.View>
                }
            </KeyboardAwareScrollView>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default EditProfile

