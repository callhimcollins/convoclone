import { Text, View, TouchableOpacity, Dimensions, TextInput, Image, ScrollView, Platform } from 'react-native'
import getStyles from './styles'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { BlurView } from 'expo-blur'
import Animated, { SlideInDown, useSharedValue, useAnimatedStyle, withTiming, SlideOutDown, FadeIn, withSpring, Easing } from 'react-native-reanimated'
import { toggleConvoStarterButton } from '@/state/features/navigationSlice'
import { Octicons } from '@expo/vector-icons'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { getConvoForChat, setReplyChat } from '@/state/features/chatSlice'
import * as ImagePicker from 'expo-image-picker'
import { emptyFiles, setDialogue, setFiles, setFileUploading, setPrivate, removeFile } from '@/state/features/startConvoSlice'
import { AVPlaybackStatus, AVPlaybackStatusSuccess, Audio, ResizeMode, Video } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { convoType, fileType, userType } from '@/types'
import { setNotificationState, setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import UrlPreview from '../UrlPreview'
import { useDebounce } from 'use-debounce'
import { openai } from '@/lib/openAIInitializer'
import { sendPushNotification } from '@/pushNotifications'


type OnPlaybackStatusUpdate = (status: AVPlaybackStatus) => void;
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
const PICK_ACTION_DATA = ["Sing", "Talk", "Act", "Write"]
const BottomSheet = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const convoStarterState = useSelector((state: RootState) => state.navigation.convoStarter)
    const [files, setFiles] = useState<fileType[]>([])
    const authenticatedUserID = useSelector((state:RootState) => state.user.authenticatedUserID)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const [convoStarter, setConvoStarter] = useState('')
    const [filePaths, setFilePaths] = useState<string[]>([])
    const [location, setLocation] = useState('')
    const [status, setStatus] = useState<AVPlaybackStatus | null>(null)
    const [linkURL, setLinkURL] = useState('')
    const [validURL, setValidURL] = useState(false)
    const [linkInputActive, setLinkInputActive] = useState(false)
    const [selectedAction, setSelectedAction] = useState('')
    const [dialogueCharacter, setDialogueCharacter] = useState('')
    const privateConvo = useSelector((state:RootState) => state.startConvo.private)
    const dialogue = useSelector((state:RootState) => state.startConvo.dialogue)
    const [currentPlayingVideoIndex, setCurrentPlayingVideoIndex] = useState<number | null>(null)
    const height = files && files.length > 0 ? DEVICE_HEIGHT * 0.8 : DEVICE_HEIGHT * 0.55
    const styles = getStyles(appearanceMode, height)
    const mainInputInitialWidth = useSharedValue(Dimensions.get('window').width * 0.4)
    const recordButtonInitialWidth = useSharedValue(Dimensions.get('window').width * 0.4)
    const opacityForRecordButton = useSharedValue(1)
    const opacityForWidthInput = useSharedValue(1)
    const opacityForLinkInput = useSharedValue(0)
    const widthForLinkInput = useSharedValue(DEVICE_WIDTH * 0.8)
    const opacityForLinkButton = useSharedValue(1)
    const widthForLinkButton = useSharedValue(DEVICE_WIDTH * 0.9)
    const audioLevels = Array(15).fill(0).map(() => useSharedValue(0.1));
    const [recording, setRecording] = useState<any>(false)
    const [recordingUri, setRecordingUri] = useState('')
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isRecordingState, setIsRecordingState] = useState<boolean>(false)
    const [isPaused, setIsPaused] = useState(true)
    const [url, setUrl] = useState('')
    const videoRefs = useRef<Video[]>([])
    const dispatch = useDispatch()
    let dialogueConversation = `Dialogue Robot ${selectedAction}s Like ${dialogueCharacter}`
    const progressWidth = useSharedValue(0)
    const progressOpacity = useSharedValue(0)
    
    const convoData = {
        convoStarter: convoStarter === '' ? dialogueConversation : convoStarter,
        user_id: authenticatedUserID,
        userData: authenticatedUserData,
        files: filePaths,
        private: privateConvo,
        link: url,
        location,
        dialogue,
    }

    const animatedStylesForInput = useAnimatedStyle(() => {
        return {
            width: mainInputInitialWidth.value,
            opacity: opacityForWidthInput.value
        }
    })

    const animatedStylesForRecord = useAnimatedStyle(() => {
        return {
            width: recordButtonInitialWidth.value,
            opacity: opacityForRecordButton.value
        }
    })

    const animatedStylesForLinkButton = useAnimatedStyle(() => {
        return {
            opacity: opacityForLinkButton.value,
            width: widthForLinkButton.value,
        }
    })

    const animatedStylesForLinkInput = useAnimatedStyle(() => {
        return {
            opacity: opacityForLinkInput.value,
            width: widthForLinkInput.value
        }
    })

    const animatedProgressBar = useAnimatedStyle(() => {
        return {
            opacity: progressOpacity.value,
            width: `${progressWidth.value * 100}%`,
        }
    })

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
              await setRecording(recording);
              setIsRecordingState(true)
            //   recordContainerHeight.value = withTiming(50);
            //   recordContainerOpacity.value = withTiming(1);
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
  

    const pickAction = (action: string) => {
        setSelectedAction(action)
    }

    const addLinkButton = () => {
        setLinkInputActive(true)
        opacityForLinkInput.value = withTiming(1)
        widthForLinkInput.value = withTiming(DEVICE_WIDTH, { duration: 300 })
        opacityForLinkButton.value = withTiming(0)
        widthForLinkButton.value = withTiming(DEVICE_WIDTH * 0.9)
    }

    const extractLink = (link: string) => {
        const urlRegex = /(https?:\/\/)?([^\s]+)/i;
        const match = link.match(urlRegex);
        if (match && match[0]) {
          let url = match[0];
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          setUrl(url);
          return true;
        } else {
          setUrl('');
          return false;
        }
      };
      

    const handleUrlChange = (text:string) => {
        setLinkURL(text.toLowerCase())
        setValidURL(extractLink(text))
    }

    

    useEffect(() => {
        if(convoStarter !== ''){
            recordButtonInitialWidth.value = withTiming(Dimensions.get('window').width * 0)
            opacityForRecordButton.value = withTiming(0)
            mainInputInitialWidth.value = withTiming(Dimensions.get('window').width * 0.9)
        } else {
            recordButtonInitialWidth.value = withTiming(Dimensions.get('window').width * 0.4)
            opacityForRecordButton.value = withTiming(1)
            mainInputInitialWidth.value = withTiming(Dimensions.get('window').width * 0.4) 
        }
    }, [convoStarter])

    const togglePrivateButton = () => {
        if(privateConvo === true) {
            dispatch(setPrivate(false))
        } else {
            dispatch(setPrivate(true))
        }
    }
        

    const sendNotificationToUsersKeepingUp = async (convoData: convoType) => {
        try {
            const { data, error } = await supabase
                .from('userKeepUps')
                .select('user_id')
                .eq('keepup_user_id', authenticatedUserData?.user_id)
                .limit(1000); // Example: Limiting to 1000 records per query
    
            // if (error) {
            //     throw error;
            // }
    
            if (data && data.length > 0) {
                const notifications = data.map(user => ({
                    sender_id: authenticatedUserData?.user_id,
                    senderUserData: authenticatedUserData,
                    receiver_id: user.user_id,
                    type: 'convoforuserskeepingup',
                    data: convoData
                }));
                // Batch insert notifications
                const { error: insertError } = await supabase
                    .from('notifications')
                    .insert(notifications);
    
                if (insertError) {
                    console.log("Error sending notifications:", insertError.message);
                } else {
                    console.log(`${notifications.length} notifications sent successfully`);
                    const userIdsToGet = data?.map(user => user.user_id);
                    const { data:userData } = await supabase
                    .from('Users')
                    .select('user_id, pushToken')
                    .in('user_id', userIdsToGet)
                    if(userData){
                        userData.map((user:userType) => {
                            sendPushNotification(String(user?.pushToken), `${authenticatedUserData?.username} started a ${dialogue ? 'Dialogue' : 'Convo'}`, dialogue ? dialogueConversation : convoStarter, 'convoStart', convoData, null, user?.user_id)
                        })
                    }
                }
            } else {
                console.log("No users found to send notifications");
            }
        } catch (error) {
            console.error("Error in sendNotificationToUsersKeepingUp:", error);
        }
    };


    const handleSendNotificationToUsersInPrivateCircle = async (convoData: convoType) => {
        try {
            const { data, error } = await supabase
            .from('privateCircle')
            .select('*')
            .eq('sender_id', authenticatedUserData?.user_id)
            .eq('type', 'invite')
            .eq('status', 'accepted')
            .eq('senderIsBlocked', false)
            if(data) {
                data.map((privateData) => {
                    sendNotificationToUsersInPrivateCircle(privateData.receiver_id, convoData)
                    sendPushNotification(String(privateData.senderUserData.pushToken), `${authenticatedUserData?.username} started a Private ${dialogue ? 'Dialogue' : 'Convo'}`, dialogue ? dialogueConversation : convoStarter, 'convoStart', convoData, null, privateData.senderUserData.pushToken)
                })
            }
            const { data: data2, error:error2 } = await supabase
            .from('privateCircle')
            .select('*')
            .eq('receiver_id', authenticatedUserData?.user_id)
            .eq('type', 'requesttojoin')
            .eq('status', 'accepted')
            .eq('senderIsBlocked', false)
            if(data2) {
                data2.map((privateData:any) => {
                    sendNotificationToUsersInPrivateCircle(privateData.sender_id, convoData)
                    sendPushNotification(String(privateData.senderUserData.pushToken), `${authenticatedUserData?.username} started a Private ${dialogue ? 'Dialogue' : 'Convo'}`, dialogue ? dialogueConversation : convoStarter, 'convoStart', convoData, privateData.senderUserData.user_id)
                })
            }
        } catch (error) {

        }
    }

    const sendNotificationToUsersInPrivateCircle = async (user_id:string, convoData: convoType) => {
        try {
            const { error } = await supabase
            .from('notifications')
            .insert({
                sender_id: authenticatedUserData?.user_id,
                senderUserData: authenticatedUserData,
                receiver_id: user_id,
                type: 'convoforuserskeepingup',
                data: convoData
            })
            if(!error) {
                console.log("private convo notification sent successfully")
            } else {
                console.log("Couldn't send private notification", error.message)
            }
        } catch (error) {
            
        }
    }


      

    const sendChatByRobot = async (convo_id: string, robot:any, robot_id:string) => {
        const chatCompletion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: `You Are Dialogue Robot. Perform this role: ${convoData?.convoStarter}. Keep it chat-like and as natural as the role. Use Emojis When Necessary. !!! DO NOT DIVERT TO ANOTHER ROLE !!!. Keep your words to less than 100 words` }],
            model: 'gpt-3.5-turbo',
            max_tokens: 100,
        })
        const chatData = {
            convo_id,
            user_id: robot_id,
            content: chatCompletion.choices[0].message.content,
            files: null,
            audio: null,
            userData: robot,
        }

        const { error, data } = await supabase
        .from('Chats')
        .insert(chatData)
        .eq('convo_id', String(convo_id))
        .select()
        if(data) {
            const { error } = await supabase
            .from('Convos')
            .update({lastChat: chatData})
            .eq('convo_id', String(convo_id))
            .select()
            if(error) {
                console.log("Couldn't update last chat by robot", error.message)
            }
        }
        if(error) {
            console.log("Couldn't send chat", error.message)
        }
    }

    const activateDialogueRobot = async (convo_id:string) => {
        const robotData = {
            user_id: convo_id,
            username: `Dialogue Robot-${convo_id}`,
            name: `Dialogue Robot`,
            bio: `I was created to talk in a room: ${dialogueConversation} created by ${authenticatedUserData?.username}`,
            profileImage: '',
            isRobot: true
        }

        const { error } = await supabase
        .from('Users')
        .insert(robotData)
        .single()
        if(!error) {
            console.log("Successfully created robot")
            dispatch(setSystemNotificationState(true))
            dispatch(setSystemNotificationData({ type: 'neutral', message: 'Please Wait...' }))
            await sendChatByRobot(convo_id, robotData, robotData.user_id)
            dispatch(setNotificationState(false))
        } else {
            console.log("Robot not created", error.message)
        }
    }

    const handleConvoStarter = async () => {
    if(convoStarter !== '' || dialogueCharacter && selectedAction !== '') {
        try {
            const { data, error } = await supabase
            .from('Convos')
            .insert(convoData)
            .eq('user_id', String(authenticatedUserData?.user_id))
            .select()
            .single()
            if(data) {
                dispatch(setReplyChat(null))
                dispatch(getConvoForChat(data))
                setLocation('')
                if(data.private === true) {
                    if(data.dialogue === true) {
                        await activateDialogueRobot(data.convo_id)
                    }
                    handleSendNotificationToUsersInPrivateCircle(data)
                } else {
                    if(data.dialogue === true) {
                        await activateDialogueRobot(data.convo_id)
                    }
                    sendNotificationToUsersKeepingUp(data)
                }
                if(files.length > 0) {
                    dispatch(setSystemNotificationState(true))
                    dispatch(setSystemNotificationData({ type: 'neutral', message: `Please wait while your ${files.length === 1 ? 'file' : 'files'} ${files.length === 1 ? 'uploads' : 'upload'}` }))
                    await uploadFiles(data.convo_id)

                    
                    await setTimeout(() => {
                        router.push({
                            pathname: '(chat)/[convoID]',
                            params: {
                                convoID: data.convo_id
                            }
                        });
                    }, 3000);
                    setTimeout(() => {
                        setConvoStarter('')
                        dispatch(toggleConvoStarterButton())
                    }, 5000)
                } else {
                    await setConvoStarter('')
                    router.push({
                        pathname: '(chat)/[convoID]',
                        params: {
                            convoID: data.convo_id
                        }
                    })
                    dispatch(setPrivate(false))
                    dispatch(toggleConvoStarterButton())
                }
            }
            if(error) {
                console.log(error)
            }
        } catch (error) {
            console.log(error)
        } finally {

        }
        } else {
            dispatch(setSystemNotificationState(true))
            dispatch(setSystemNotificationData({ type: 'neutral', message: 'Type or Record A Conversation Starter. No Dialogues Either.' }))
            return;
        }
    }

    const activateDialogue = async () => {
        if(dialogue) {
            dispatch(setDialogue(false))
        } else {
            dispatch(setDialogue(true))
        }
    }

    
    const uploadFiles = async (convo_id: string) => {
        if (files.length === 0) {
            return;
        }
    
        dispatch(setFileUploading(true));
        progressOpacity.value = withTiming(1);
        const newFilePaths: string[] = [];
    
        for (let i = 0; i < files.length; i++) {
            try {
                const filepath = await uploadFile(files[i], i, convo_id);
                if (filepath) {
                    newFilePaths.push(filepath);
                    // Update progress after each file upload
                    const newProgress = (i + 1) / files.length;
                    progressWidth.value = withTiming(newProgress, {
                        duration: 300,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    });
                }
            } catch (error) {
                console.error('Upload failed:', error);
                // Implement retry logic or user notification here
            }
        }
    
        setFilePaths(prev => {
            const updatedFilePaths = [...prev, ...newFilePaths];
            updateConvoFiles(convo_id, updatedFilePaths);
            return updatedFilePaths;
        });
    
        dispatch(setFileUploading(false));
        // Hide progress bar after a short delay
        setTimeout(() => {
            progressWidth.value = withTiming(0);
            progressOpacity.value = withTiming(0);
        }, 3000);
    };
    
    const uploadFile = async (file: fileType, index: number, convo_id: string): Promise<string | null> => {
        const extension = file.uri.split('.').pop()?.toLowerCase();
        const filepath = `Convos/${convo_id}/${index}.${extension}`;
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
    
        const { data, error } = await supabase.storage
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


    const updateConvoFiles = async (convo_id: string, paths: string[]) => {
        const { error } = await supabase
        .from('Convos')
        .update({ files: paths })
        .eq('convo_id', convo_id)
        .single()
        if(!error) {
            console.log("Files updated successfully")
        } else {
            console.log("Problem updating files", error.message)
        }
    }

    const pickFiles = async () => {
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
            selectionLimit: 3
        })

        if(!result.canceled) {
            if(result.assets.length > 3) {
                dispatch(setSystemNotificationState(true))
                dispatch(setSystemNotificationData({ type: 'error', message: 'You can only select up to 4 files.' }))
                return;
            }
            setFiles((result.assets))
        }
    }


    const isPlaybackStatusSuccess = (status: AVPlaybackStatus): status is AVPlaybackStatusSuccess => {
        return (status as AVPlaybackStatusSuccess).isLoaded !== undefined;
    }

    const handlePlaybackStatusUpdate:OnPlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
        setStatus(playbackStatus)
    }


    const playVideo = async (index: number) => {
        try {
            if (currentPlayingVideoIndex !== null && currentPlayingVideoIndex !== index) {
                await pauseVideo(currentPlayingVideoIndex);
            }
    
            if (videoRefs.current[index]) {
                await videoRefs.current[index].playAsync();
                setCurrentPlayingVideoIndex(index);
            }
        } catch (error) {
            console.log("Error playing video", error);
        }
    }

    const pauseVideo = async (index: number) => {
        try {
            if (videoRefs.current[index] && status && isPlaybackStatusSuccess(status) && status.isPlaying) {
                await videoRefs.current[index].pauseAsync();
                setCurrentPlayingVideoIndex(null)
            }
        } catch (error) {
            console.error('Error pausing video:', error);
        }
    }

    const handleStartRecording = async () => {
        if(isRecordingState) {
            await stopAndSaveRecording()
        } else {
            recordButtonInitialWidth.value = withSpring(Dimensions.get('window').width * 0.9, {
                damping: 12,  // Moderate damping to make it a little springy
                stiffness: 100, // Moderate stiffness
                mass: 1,      // Default mass
                overshootClamping: false, // Allow slight overshoot for springy effect
                restDisplacementThreshold: 0.01, // Default threshold for stopping
                restSpeedThreshold: 0.01 // Default speed threshold for stopping
              });          
            opacityForWidthInput.value = withTiming(0)
            mainInputInitialWidth.value = withTiming(Dimensions.get('window').width * 0)
            await startRecording()
        }
    }

    const handleDeleteRecording = async () => {
        if(sound) {
            await sound.pauseAsync();
        }
        recordButtonInitialWidth.value = withSpring(Dimensions.get('window').width * 0.4, {
            damping: 12,  // Moderate damping to make it a little springy
            stiffness: 100, // Moderate stiffness
            mass: 1,      // Default mass
            overshootClamping: false, // Allow slight overshoot for springy effect
            restDisplacementThreshold: 0.01, // Default threshold for stopping
            restSpeedThreshold: 0.01 // Default speed threshold for stopping
          });          
        opacityForWidthInput.value = withTiming(1)
        mainInputInitialWidth.value = withTiming(Dimensions.get('window').width * 0.4)
        setRecordingUri('')
    }

    const handleCloseBottomSheet = async () => {
        dispatch(toggleConvoStarterButton());
        dispatch(setDialogue(false));
        dispatch(setPrivate(false))
        if(isRecordingState) {
            await stopAndSaveRecording();
        }
    }


    const sendConvoWithAudio = async () => {
        if(!recordingUri?.startsWith('file')) {
            return;
        }
        if(authenticatedUserData) {
            const convoDataWithAudio = {
                convoStarter: "Voice Note",
                user_id: authenticatedUserID,
                userData: authenticatedUserData,
                files: filePaths,
                private: privateConvo,
                link: linkURL,
                location,
                dialogue
            }
            const { data:convoInsertData, error:convoInsertError } = await supabase
            .from('Convos')
            .insert(convoDataWithAudio)
            .select()
            .single()
            if(!convoInsertError && convoInsertData) {
              const base64 = await FileSystem.readAsStringAsync(recordingUri, { encoding: 'base64' })
              const filepath = `Convos/${convoInsertData.convo_id}`;
              const contentType = 'audio/mpeg'
              const { data, error } = await supabase
              .storage
              .from('userfiles')
              .upload(filepath, decode(base64), { cacheControl: '31536000', upsert: true, contentType })
              if(data) {
                dispatch(setSystemNotificationState(true))
                dispatch(setSystemNotificationData({ type: 'neutral', message: `Please wait while your ${files.length === 1 ? 'file' : 'files'} ${files.length === 1 ? 'uploads' : 'upload'}` }))
                  console.log('Uploaded in database')
                  dispatch(getConvoForChat(convoInsertData))
                      const { error:updateError } = await supabase
                      .from('Convos')
                      .update({ audio: filepath})
                      .eq('convo_id', String(convoInsertData.convo_id))
                      if(!updateError) {
                          if(files.length > 0) {

                            await uploadFiles(String(convoInsertData.convo_id))

                            await setTimeout(() => {
                                router.push({
                                    pathname: '(chat)/[convoID]',
                                    params: {
                                        convoID: convoInsertData.convo_id
                                    }
                                });
                                dispatch(toggleConvoStarterButton())
                            }, 3000);
                        } else {
                            router.push({
                                pathname: '(chat)/[convoID]',
                                params: {
                                    convoID: String(convoInsertData.convo_id)
                                }
                            })
                            dispatch(setPrivate(false))
                            dispatch(toggleConvoStarterButton())
                        }
                      } else {
                          console.log("Could not upload audio in database", updateError.message)
                      }
              } else if(error) {
                  console.log("error uploading profile background", error.message)
              }
            } else {
              console.log("Could not insert chat data", convoInsertError?.message)
            }
        }
    }

    const removeMedia = (file:fileType) => {
        setFiles(files.filter((item) => item.assetId !== file.assetId))
    }



    const renderBottomSheet = () => {
        if(Platform.OS === 'android') {
            return <View style={[styles.backgroundContainer, { elevation: 10 }]}>
            <TouchableOpacity onPress={handleCloseBottomSheet} style={styles.close}/>
            { convoStarterState && 
            <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.bottomSheetContainer]}>
                <Animated.View style={[styles.progressBar, animatedProgressBar]}/>
                <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.headerInfoContainer}>
                        <Text style={styles.headerText}>What's on your mind today?</Text>
                        <TouchableOpacity onPress={handleCloseBottomSheet}>
                            <Text style={styles.headerText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.locationInputContainer}>
                        <Octicons name='location' color={appearanceMode.faint} size={20}/>
                        <TextInput value={location} onChangeText={(text) => setLocation(text)} style={styles.locationInput} placeholderTextColor={appearanceMode.faint} placeholder='Location'/>
                    </View>

                    <View style={styles.mainContainer}>
                        <Animated.View style={[animatedStylesForRecord, { display: convoStarter !== '' ? 'none': 'flex' }]}>
                           { !recordingUri && !recording && !dialogue && <TouchableOpacity onPress={handleStartRecording} style={styles.recordButton}>
                                <Image source={require('../../assets/images/record.png')} style={styles.iconImage}/>
                                <Text style={styles.recordText}>Record</Text>
                            </TouchableOpacity>}
                            {
                                recordingUri && !dialogue &&
                                <View style={styles.afterRecordContainer}>
                                    <TouchableOpacity onPress={isPaused ? playRecording : pauseRecording} style={styles.playRecord}>
                                        <Text style={styles.playText}>{ isPaused ? 'Play Recording' : 'Pause Recording'}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.deleteRecordingButton} onPress={handleDeleteRecording}>
                                        <Image source={require('@/assets/images/bin.png')} style={styles.delete}/>
                                    </TouchableOpacity>
                                </View>
                            }
                            <View style={{ flexDirection: 'row', width: DEVICE_WIDTH - 60, justifyContent: 'space-between', alignItems: 'center', }}>
                            <Animated.View style={[styles.visualizer, { display: isRecordingState ? 'flex' : 'none', width: '90%'}]}>
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
                            { recording && <TouchableOpacity style={{ paddingVertical: 20 }} onPress={handleStartRecording}>
                                <Text style={{ color: appearanceMode.textColor, fontFamily: 'bold', fontSize: 16, marginLeft: 5 }}>Done</Text>
                            </TouchableOpacity>}
                            </View>
                        </Animated.View>

                        { !dialogue && !recordingUri && <Animated.View style={[animatedStylesForInput]}>
                            <TextInput value={convoStarter} placeholderTextColor={appearanceMode.faint} onChangeText={(text) => setConvoStarter(text)} style={[styles.mainInput, { paddingVertical: 6 }]} placeholder='Type Something...'/>
                        </Animated.View>}
                        
                    </View>


                    { !dialogue && <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 25 }}>
                        { !linkInputActive && <Animated.View style={[styles.linkContainer, animatedStylesForLinkButton]}>
                            <TouchableOpacity onPress={addLinkButton} style={styles.addLinkButton}>
                                <Octicons name='link' color={appearanceMode.secondary} size={20}/>
                                <Text style={styles.addLinkText}>Add Link</Text>
                            </TouchableOpacity>
                        </Animated.View>}

                        { linkInputActive && <Animated.View style={[styles.linkContainer, animatedStylesForLinkInput]}>
                            <TextInput value={linkURL} onChangeText={(text) => handleUrlChange(text)} style={styles.linkInput} placeholder='Type/Paste Link'/>
                            <TouchableOpacity>

                            </TouchableOpacity>
                        </Animated.View>}
                    </View>}

                    { !validURL && linkURL !== '' && <Text style={styles.urlInfo}>URL not valid</Text>}
                    {validURL && linkURL !== '' && !dialogue && <UrlPreview url={`${url}`}/>
                }

                    { dialogue && <View>
                        <Text style={styles.pickRoleText}>Pick An Action</Text>
                        <ScrollView horizontal={true} contentContainerStyle={{ width: '100%', gap: 10, marginBottom: 20, marginTop: 10 }}>
                            {PICK_ACTION_DATA.map((action, index) => {
                                return (
                                    <TouchableOpacity key={index} onPress={() => pickAction(action)} style={selectedAction === action ? styles.actionButtonSelected : styles.actionButton}>
                                        <Text style={selectedAction === action ? styles.actionButtonTextSelected : styles.actionButtonText}>{action}</Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </ScrollView>

                        <Animated.View style={[animatedStylesForInput, { marginBottom: 15 }]}>
                            <TextInput value={dialogueCharacter} placeholderTextColor={appearanceMode.faint} onChangeText={(text) => setDialogueCharacter(text)} style={[styles.mainInput, { height: 40 }]} placeholder='Type Character...'/>
                        </Animated.View>

                        { selectedAction !== '' && dialogueCharacter !== '' && <Text style={styles.dialogueCompletionText}>Dialogue Robot {selectedAction}s Like {dialogueCharacter}</Text>}
                        { selectedAction !== '' && dialogueCharacter == '' && <Text style={styles.dialogueCompletionText}>Dialogue Robot {selectedAction}s Like Who?</Text>}
                    </View>}

                    <View style={styles.mediaContainer}>
                        { !dialogue && <View style={styles.mediaLeft}>
                            <TouchableOpacity onPress={pickFiles}>
                                {appearanceMode.name === 'light' &&<Image style={styles.iconImage} source={require('../../assets/images/medialightmode.png')}/>}
                                {appearanceMode.name === 'dark' &&<Image style={styles.iconImage} source={require('../../assets/images/mediadarkmode.png')}/>}
                            </TouchableOpacity>
                        </View>}

                        <View style={styles.specialContainer}>
                            <TouchableOpacity onPress={togglePrivateButton} style={ privateConvo ? styles.privateButtonSelected : styles.privateButton }>
                                <Text style={[styles.privateText, privateConvo && { color: 'white' }]}>Private</Text>
                            </TouchableOpacity>

                            { !dialogue && !recordingUri && <TouchableOpacity onPress={activateDialogue}>
                                { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/dialoguerobotinactivedarkmode.png')} style={styles.dialogueRobot}/>}
                                { appearanceMode.name === 'light' && <Image source={require('@/assets/images/dialoguerobotinactivelightmode.png')} style={styles.dialogueRobot}/>}
                            </TouchableOpacity>}
                            { dialogue && !recordingUri && <TouchableOpacity onPress={activateDialogue}>
                                { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/dialoguerobotactivedarkmode.png')} style={styles.dialogueRobot}/>}
                                { appearanceMode.name === 'light' && <Image source={require('@/assets/images/dialoguerobotactivelightmode.png')} style={styles.dialogueRobot}/>}
                            </TouchableOpacity>}
                        </View>

                        { !dialogue && <TouchableOpacity disabled={linkURL !== '' ? !validURL : validURL} onPress={recordingUri ? sendConvoWithAudio :handleConvoStarter}>
                            <Text style={[styles.startConvoText, linkURL !== '' && { color: validURL ? appearanceMode.primary : appearanceMode.secondary }]}>{ privateConvo ? 'Start Private Convo' : 'Start Convo' }</Text>
                        </TouchableOpacity>}
                        { dialogue && <TouchableOpacity disabled={linkURL !== '' ? !validURL : validURL} onPress={recordingUri ? sendConvoWithAudio : handleConvoStarter}>
                            <Text style={[styles.startConvoText, { fontSize: privateConvo ? 13:14 }, linkURL !== '' && { color: validURL ? appearanceMode.primary : appearanceMode.secondary }]}>{ privateConvo ? 'Start Private Dialogue' : 'Start Dialogue' }</Text>
                        </TouchableOpacity>}
                    </View>


                    <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: 20}} horizontal>
                        {files?.map((file, index) => {
                            if(file.type === 'image') {
                                return (
                                    <TouchableOpacity onPress={() => removeMedia(file)} key={index}>
                                        <Image key={index} source={{uri: file.uri}} style={styles.image}/>
                                    </TouchableOpacity>
                                )
                            } else if(file.type === 'video') {
                                return (
                                    <TouchableOpacity onPress={() => removeMedia(file)} key={index}>
                                        { currentPlayingVideoIndex !== index ? (
                                            <View style={styles.videoContainer}>
                                                <TouchableOpacity style={styles.playButton} onPress={() => playVideo(index)}>
                                                    <BlurView style={styles.playButtonIcon}>
                                                        <Image style={styles.playButtonImage} source={require('@/assets/images/play.png')}/>
                                                    </BlurView>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={styles.videoContainer}>
                                                <TouchableOpacity style={styles.playButton} onPress={() => pauseVideo(index)}>
                                                    <BlurView style={styles.playButtonIcon}>
                                                        <Image style={styles.playButtonImage} source={require('@/assets/images/pause.png')}/>
                                                    </BlurView>
                                                </TouchableOpacity>
                                            </View>
                                        ) }
                                        <Video
                                        ref={(ref: Video) => videoRefs.current[index] = ref}
                                        style={[styles.video, files.length === 1 && { width: Dimensions.get('window').width - 40}]}
                                        source={{ uri: file.uri }}
                                        isLooping
                                        onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status)}
                                        resizeMode={ResizeMode.COVER}
                                        />
                                    </TouchableOpacity>
                                )
                            }
                        })}
                    </ScrollView>
                    { files.length !== 0 && <Text style={styles.removeMediaText}>Tap Media To Remove</Text>}
                </View>
                </KeyboardAwareScrollView>

            </Animated.View>}
        </View>
        } else {
            return <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.backgroundContainer}>
            <TouchableOpacity onPress={handleCloseBottomSheet} style={styles.close}/>
            { convoStarterState && 
            <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.bottomSheetContainer]}>
                <Animated.View style={[styles.progressBar, animatedProgressBar]}/>
                <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.headerInfoContainer}>
                        <Text style={styles.headerText}>What's on your mind today?</Text>
                        <TouchableOpacity onPress={handleCloseBottomSheet}>
                            <Text style={styles.headerText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.locationInputContainer}>
                        <Octicons name='location' color={appearanceMode.faint} size={20}/>
                        <TextInput value={location} onChangeText={(text) => setLocation(text)} style={styles.locationInput} placeholderTextColor={appearanceMode.faint} placeholder='Location'/>
                    </View>

                    <View style={styles.mainContainer}>
                        <Animated.View style={[animatedStylesForRecord, { display: convoStarter !== '' ? 'none': 'flex' }]}>
                           { !recordingUri && !recording && !dialogue && <TouchableOpacity onPress={handleStartRecording} style={styles.recordButton}>
                                <Image source={require('../../assets/images/record.png')} style={styles.iconImage}/>
                                <Text style={styles.recordText}>Record</Text>
                            </TouchableOpacity>}
                            {
                                recordingUri && !dialogue &&
                                <View style={styles.afterRecordContainer}>
                                    <TouchableOpacity onPress={isPaused ? playRecording : pauseRecording} style={styles.playRecord}>
                                        <Text style={styles.playText}>{ isPaused ? 'Play Recording' : 'Pause Recording'}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={handleDeleteRecording}>
                                        <Image source={require('@/assets/images/bin.png')} style={styles.delete}/>
                                    </TouchableOpacity>
                                </View>
                            }
                            <View style={{ flexDirection: 'row', width: DEVICE_WIDTH - 60, justifyContent: 'space-between', alignItems: 'center', }}>
                            <Animated.View style={[styles.visualizer, { display: isRecordingState ? 'flex' : 'none', width: '90%'}]}>
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
                            { recording && <TouchableOpacity style={{ paddingVertical: 20 }} onPress={handleStartRecording}>
                                {/* <Ionicons name='close' color={appearanceMode.textColor} size={30}/> */}
                                <Text style={{ color: appearanceMode.textColor, fontFamily: 'bold', fontSize: 16, marginLeft: 5 }}>Done</Text>
                            </TouchableOpacity>}
                            </View>
                        </Animated.View>


                        { !dialogue && !recordingUri &&  <Animated.View style={[animatedStylesForInput]}>
                            <TextInput value={convoStarter} placeholderTextColor={appearanceMode.faint} onChangeText={(text) => setConvoStarter(text)} style={[styles.mainInput]} placeholder='Type Something...'/>
                        </Animated.View>}
                        
                    </View>


                    { !dialogue && <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 25 }}>
                        { !linkInputActive && <Animated.View style={[styles.linkContainer, animatedStylesForLinkButton]}>
                            <TouchableOpacity onPress={addLinkButton} style={styles.addLinkButton}>
                                <Octicons name='link' color={appearanceMode.secondary} size={20}/>
                                <Text style={styles.addLinkText}>Add Link</Text>
                            </TouchableOpacity>
                        </Animated.View>}

                        { linkInputActive && <Animated.View style={[styles.linkContainer, animatedStylesForLinkInput]}>
                            <TextInput value={linkURL} onChangeText={(text) => handleUrlChange(text)} style={styles.linkInput} placeholder='Type/Paste Link'/>
                            <TouchableOpacity>

                            </TouchableOpacity>
                        </Animated.View>}
                    </View>}

                    { !validURL && linkURL !== '' && <Text style={styles.urlInfo}>URL not valid</Text>}
                    {validURL && linkURL !== '' && !dialogue && <UrlPreview url={`${url}`}/>
                }

                    { dialogue && <View>
                        <Text style={styles.pickRoleText}>Pick An Action</Text>
                        <ScrollView horizontal={true} contentContainerStyle={{ width: '100%', gap: 10, marginBottom: 20, marginTop: 10 }}>
                            {PICK_ACTION_DATA.map((action, index) => {
                                return (
                                    <TouchableOpacity key={index} onPress={() => pickAction(action)} style={selectedAction === action ? styles.actionButtonSelected : styles.actionButton}>
                                        <Text style={selectedAction === action ? styles.actionButtonTextSelected : styles.actionButtonText}>{action}</Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </ScrollView>

                        <Animated.View style={[animatedStylesForInput, { marginBottom: 15 }]}>
                            <TextInput value={dialogueCharacter} placeholderTextColor={appearanceMode.faint} onChangeText={(text) => setDialogueCharacter(text)} style={[styles.mainInput, { height: 40 }]} placeholder='Type Character...'/>
                        </Animated.View>

                        { selectedAction !== '' && dialogueCharacter !== '' && <Text style={styles.dialogueCompletionText}>Dialogue Robot {selectedAction}s Like {dialogueCharacter}</Text>}
                        { selectedAction !== '' && dialogueCharacter == '' && <Text style={styles.dialogueCompletionText}>Dialogue Robot {selectedAction}s Like Who?</Text>}
                    </View>}

                    <View style={styles.mediaContainer}>
                        { !dialogue && <View style={styles.mediaLeft}>
                            <TouchableOpacity onPress={pickFiles}>
                                {appearanceMode.name === 'light' &&<Image style={styles.iconImage} source={require('../../assets/images/medialightmode.png')}/>}
                                {appearanceMode.name === 'dark' &&<Image style={styles.iconImage} source={require('../../assets/images/mediadarkmode.png')}/>}
                            </TouchableOpacity>
                        </View>}

                        <View style={styles.specialContainer}>
                            <TouchableOpacity onPress={togglePrivateButton} style={ privateConvo ? styles.privateButtonSelected : styles.privateButton }>
                                <Text style={[styles.privateText, privateConvo && { color: 'white' }]}>Private</Text>
                            </TouchableOpacity>

                            { !dialogue && !recordingUri && <TouchableOpacity onPress={activateDialogue}>
                                { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/dialoguerobotinactivedarkmode.png')} style={styles.dialogueRobot}/>}
                                { appearanceMode.name === 'light' && <Image source={require('@/assets/images/dialoguerobotinactivelightmode.png')} style={styles.dialogueRobot}/>}
                            </TouchableOpacity>}
                            { dialogue && !recordingUri && <TouchableOpacity onPress={activateDialogue}>
                                { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/dialoguerobotactivedarkmode.png')} style={styles.dialogueRobot}/>}
                                { appearanceMode.name === 'light' && <Image source={require('@/assets/images/dialoguerobotactivelightmode.png')} style={styles.dialogueRobot}/>}
                            </TouchableOpacity>}
                        </View>

                        { !dialogue && <TouchableOpacity disabled={linkURL !== '' ? !validURL : validURL} onPress={recordingUri ? sendConvoWithAudio :handleConvoStarter}>
                            <Text style={[styles.startConvoText, linkURL !== '' && { color: validURL ? appearanceMode.primary : appearanceMode.secondary }]}>{ privateConvo ? 'Start Private Convo' : 'Start Convo' }</Text>
                        </TouchableOpacity>}
                        { dialogue && <TouchableOpacity disabled={linkURL !== '' ? !validURL : validURL} onPress={recordingUri ? sendConvoWithAudio : handleConvoStarter}>
                            <Text style={[styles.startConvoText, linkURL !== '' && { color: validURL ? appearanceMode.primary : appearanceMode.secondary }]}>{ privateConvo ? 'Start Private Dialogue' : 'Start Dialogue' }</Text>
                        </TouchableOpacity>}
                    </View>


                    <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: 20}} horizontal>
                        {files?.map((file, index) => {
                            if(file.type === 'image') {
                                return (
                                    <TouchableOpacity onPress={() => removeMedia(file)} key={index}>
                                        <Image key={index} source={{uri: file.uri}} style={styles.image}/>
                                    </TouchableOpacity>
                                )
                            } else if(file.type === 'video') {
                                return (
                                    <TouchableOpacity onPress={() => removeMedia(file)} key={index}>
                                        { currentPlayingVideoIndex !== index ? (
                                            <View style={styles.videoContainer}>
                                                <TouchableOpacity style={styles.playButton} onPress={() => playVideo(index)}>
                                                    <BlurView style={styles.playButtonIcon}>
                                                        <Image style={styles.playButtonImage} source={require('@/assets/images/play.png')}/>
                                                    </BlurView>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={styles.videoContainer}>
                                                <TouchableOpacity style={styles.playButton} onPress={() => pauseVideo(index)}>
                                                    <BlurView style={styles.playButtonIcon}>
                                                        <Image style={styles.playButtonImage} source={require('@/assets/images/pause.png')}/>
                                                    </BlurView>
                                                </TouchableOpacity>
                                            </View>
                                        ) }
                                        <Video
                                        ref={(ref: Video) => videoRefs.current[index] = ref}
                                        style={[styles.video, files.length === 1 && { width: Dimensions.get('window').width - 40}]}
                                        source={{ uri: file.uri }}
                                        isLooping
                                        onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status)}
                                        resizeMode={ResizeMode.COVER}
                                        />
                                    </TouchableOpacity>
                                )
                            }
                        })}
                    </ScrollView>
                    { files.length !== 0 && <Text style={styles.removeMediaText}>Tap Media To Remove</Text>}
                </View>
                </KeyboardAwareScrollView>

            </Animated.View>}
        </BlurView>
        }
    }

    return (
        <>
        { renderBottomSheet() }
        </>
    )
} 

export default BottomSheet
