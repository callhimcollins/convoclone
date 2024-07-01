import { Text, View, TouchableOpacity, Dimensions, TextInput, Image, ScrollView, Platform } from 'react-native'
import getStyles from './styles'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { BlurView } from 'expo-blur'
import Animated, { SlideInDown, useSharedValue, useAnimatedStyle, withTiming, FadeOut, SlideOutDown } from 'react-native-reanimated'
import { toggleConvoStarterButton } from '@/state/features/navigationSlice'
import { Octicons } from '@expo/vector-icons'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { getConvoForChat, setReplyChat } from '@/state/features/chatSlice'
import * as ImagePicker from 'expo-image-picker'
import { emptyFiles, setDialogue, setFiles, setFileUploading, setPrivate } from '@/state/features/startConvoSlice'
import { AVPlaybackStatus, AVPlaybackStatusSuccess, ResizeMode, Video } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { randomUUID } from 'expo-crypto'
import { decode } from 'base64-arraybuffer'
import { convoType, fileType, userType } from '@/types'
import { setNotificationState, setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import UrlPreview from '../UrlPreview'
import { useDebounce } from 'use-debounce'
import { openai } from '@/lib/openAIInitializer'


type OnPlaybackStatusUpdate = (status: AVPlaybackStatus) => void;
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
const PICK_ACTION_DATA = ["Sing", "Talk", "Act", "Write"]
const BottomSheet = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const convoStarterState = useSelector((state: RootState) => state.navigation.convoStarter)
    const files = useSelector((state:RootState) => state.startConvo.files)
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
    const height = files && files.length > 0 ? DEVICE_HEIGHT * 0.95 : DEVICE_HEIGHT * 0.55
    const styles = getStyles(appearanceMode, height)
    const mainInputInitialWidth = useSharedValue(Dimensions.get('window').width * 0.4)
    const recordButtonInitialWidth = useSharedValue(Dimensions.get('window').width * 0.4)
    const opacityForRecordButton = useSharedValue(1)
    const opacityForWidthInput = useSharedValue(1)
    const opacityForLinkInput = useSharedValue(0)
    const widthForLinkInput = useSharedValue(DEVICE_WIDTH * 0.8)
    const opacityForLinkButton = useSharedValue(1)
    const widthForLinkButton = useSharedValue(DEVICE_WIDTH * 0.9)
    const videoRefs = useRef<Video[]>([])
    const dispatch = useDispatch()
    let dialogueConversation = `Dialogue Robot ${selectedAction}s Like ${dialogueCharacter}`

    const convoData = {
        convoStarter: convoStarter === '' ? dialogueConversation : convoStarter,
        user_id: authenticatedUserID,
        userData: authenticatedUserData,
        files: filePaths,
        private: privateConvo,
        link: linkURL,
        location,
        dialogue
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

    const validateURL = (linkURL:string) => {
        const regex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/
        return regex.test(linkURL)
    }

    const DEBOUNCE_DELAY = 500
    const [debouncedLinkURL] = useDebounce(linkURL, DEBOUNCE_DELAY)

    const handleUrlChange = (text:string) => {
        setLinkURL(text.toLowerCase())
        setValidURL(validateURL(text))
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
                data.map((user) => {
                    sendNotificationToUsersInPrivateCircle(user.receiver_id, convoData)
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
                data2.map((user) => {
                    sendNotificationToUsersInPrivateCircle(user.sender_id, convoData)
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
            bio: `I was created to talk in a room: ${dialogueConversation}created by ${authenticatedUserData?.username}`,
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
                setConvoStarter('')
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
                    router.push({
                        pathname: '(chat)/[convoID]',
                        params: {
                            convoID: data.convo_id
                        }
                    })
                    await uploadFiles(data.convo_id)
                    // setPrivate(false)
                    if(filePaths.length > 0) {
                        await updateConvoFiles(data.convo_id, filePaths)
                    }
                } else {
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
        dispatch(setFileUploading(true))
        if (files.length === 0) {
            return;
        }
    
        // Create a temporary array to store the new file paths
        const newFilePaths: string[] = [];
    
        const uploadFile = async (file: fileType) => {
            const extension = file.uri.split('.').pop()?.toLowerCase();
            if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') {
                const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
                const filepath = `Convos/${convo_id}/${randomUUID()}`;
                const contentType = 'image/png';
                const { data } = await supabase.storage
                    .from('files')
                    .upload(filepath, decode(base64), { contentType });
                if (data) {
                    newFilePaths.push(filepath);
                }
            } else if (extension === 'mp4' || extension === 'mov' || extension === 'avi') {
                const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
                const filepath = `Convos/${convo_id}/${randomUUID()}.mp4`;
                const contentType = 'video/mp4';
                const { data } = await supabase.storage
                    .from('files')
                    .upload(filepath, decode(base64), { contentType });
                if (data) {
                    newFilePaths.push(filepath);
                }
            } else {
                console.warn(`Unsupported file type: ${extension}`);
            }
        };
    
        await Promise.all(files.map(file => uploadFile(file)))
    
        setFilePaths(prev => {
            const updatedFilePaths = [...prev, ...newFilePaths];
            updateConvoFiles(convo_id, updatedFilePaths);
            return updatedFilePaths;
        })

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
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            quality: 1,
            videoQuality: 1,
            videoMaxDuration: 60,
        })

        if(!result.canceled) {
            dispatch(setFiles((result.assets)))
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


    const handleCloseBottomSheet = () => {
        dispatch(toggleConvoStarterButton());
        dispatch(setDialogue(false));
        dispatch(setPrivate(false))
    }

    const renderBottomSheet = () => {
        if(Platform.OS === 'android') {
            return <View style={[styles.backgroundContainer, { elevation: 10 }]}>
            <TouchableOpacity onPress={handleCloseBottomSheet} style={styles.close}/>
            { convoStarterState && 
            <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.bottomSheetContainer]}>
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
                        <TextInput style={styles.locationInput} placeholderTextColor={appearanceMode.faint} placeholder='Location'/>
                    </View>

                    { !dialogue && <View style={styles.mainContainer}>
                        <Animated.View style={[animatedStylesForRecord, { display: convoStarter !== '' ? 'none': 'flex' }]}>
                            <TouchableOpacity style={styles.recordButton}>
                                <Image source={require('../../assets/images/record.png')} style={styles.iconImage}/>
                                <Text style={styles.recordText}>Record</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View style={[animatedStylesForInput]}>
                            <TextInput value={convoStarter} placeholderTextColor={appearanceMode.faint} onChangeText={(text) => setConvoStarter(text)} style={styles.mainInput} placeholder='Type Something...'/>
                        </Animated.View>
                        
                    </View>}


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
                    {validURL && linkURL !== '' && !dialogue && <UrlPreview url={`https://${debouncedLinkURL}`}/>
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
                        <View style={styles.mediaLeft}>
                            <TouchableOpacity onPress={pickFiles}>
                                {appearanceMode.name === 'light' &&<Image style={styles.iconImage} source={require('../../assets/images/medialightmode.png')}/>}
                                {appearanceMode.name === 'dark' &&<Image style={styles.iconImage} source={require('../../assets/images/mediadarkmode.png')}/>}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.specialContainer}>
                            <TouchableOpacity onPress={togglePrivateButton} style={ privateConvo ? styles.privateButtonSelected : styles.privateButton }>
                                <Text style={styles.privateText}>Private</Text>
                            </TouchableOpacity>

                            { !dialogue && <TouchableOpacity onPress={activateDialogue}>
                                { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/dialoguerobotinactivedarkmode.png')} style={styles.dialogueRobot}/>}
                                { appearanceMode.name === 'light' && <Image source={require('@/assets/images/dialoguerobotinactivelightmode.png')} style={styles.dialogueRobot}/>}
                            </TouchableOpacity>}
                            { dialogue && <TouchableOpacity onPress={activateDialogue}>
                                { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/dialoguerobotactivedarkmode.png')} style={styles.dialogueRobot}/>}
                                { appearanceMode.name === 'light' && <Image source={require('@/assets/images/dialoguerobotactivelightmode.png')} style={styles.dialogueRobot}/>}
                            </TouchableOpacity>}
                        </View>

                        { !dialogue && <TouchableOpacity disabled={linkURL !== '' ? !validURL : validURL} onPress={handleConvoStarter}>
                            <Text style={[styles.startConvoText, linkURL !== '' && { color: validURL ? appearanceMode.primary : appearanceMode.secondary }]}>{ privateConvo ? 'Start Private Convo' : 'Start Convo' }</Text>
                        </TouchableOpacity>}
                        { dialogue && <TouchableOpacity disabled={linkURL !== '' ? !validURL : validURL} onPress={handleConvoStarter}>
                            <Text style={[styles.startConvoText, linkURL !== '' && { color: validURL ? appearanceMode.primary : appearanceMode.secondary }]}>{ privateConvo ? 'Start Private Dialogue' : 'Start Dialogue' }</Text>
                        </TouchableOpacity>}
                    </View>


                    <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: 20}} horizontal>
                        {files?.map((file, index) => {
                            if(file.type === 'image') {
                                return (
                                    <View key={index}>
                                        <Image key={index} source={{uri: file.uri}} style={styles.image}/>
                                    </View>
                                )
                            } else if(file.type === 'video') {
                                return (
                                    <View key={index}>
                                        { currentPlayingVideoIndex !== index ? (<TouchableOpacity onPress={() => playVideo(index)} style={styles.videoContainer}>
                                            <BlurView style={styles.playButton} tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} >
                                                <Image style={styles.playButtonImage} source={require('@/assets/images/play.png')}/>
                                            </BlurView>
                                        </TouchableOpacity>) :
                                        (<TouchableOpacity onPress={() => pauseVideo(index)} style={styles.videoContainer}>
                                            <BlurView style={styles.playButton} tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} >
                                                <Image style={styles.playButtonImage} source={require('@/assets/images/pause.png')}/>
                                            </BlurView>
                                        </TouchableOpacity>)
                                        }
                                        <Video
                                        ref={(ref: Video) => videoRefs.current[index] = ref}
                                        style={[styles.video, files.length === 1 && { width: Dimensions.get('window').width - 40}]}
                                        source={{ uri: file.uri }}
                                        isLooping
                                        onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status)}
                                        resizeMode={ResizeMode.COVER}
                                        />
                                    </View>
                                )
                            }
                        })}
                    </ScrollView>
                </View>
                </KeyboardAwareScrollView>

            </Animated.View>}
        </View>
        } else {
            return <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.backgroundContainer}>
            <TouchableOpacity onPress={handleCloseBottomSheet} style={styles.close}/>
            { convoStarterState && 
            <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.bottomSheetContainer]}>
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
                        <TextInput style={styles.locationInput} placeholderTextColor={appearanceMode.faint} placeholder='Location'/>
                    </View>

                    { !dialogue && <View style={styles.mainContainer}>
                        <Animated.View style={[animatedStylesForRecord, { display: convoStarter !== '' ? 'none': 'flex' }]}>
                            <TouchableOpacity style={styles.recordButton}>
                                <Image source={require('../../assets/images/record.png')} style={styles.iconImage}/>
                                <Text style={styles.recordText}>Record</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View style={[animatedStylesForInput]}>
                            <TextInput value={convoStarter} placeholderTextColor={appearanceMode.faint} onChangeText={(text) => setConvoStarter(text)} style={styles.mainInput} placeholder='Type Something...'/>
                        </Animated.View>
                        
                    </View>}


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
                    {validURL && linkURL !== '' && !dialogue && <UrlPreview url={`https://${debouncedLinkURL}`}/>
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
                        <View style={styles.mediaLeft}>
                            <TouchableOpacity onPress={pickFiles}>
                                {appearanceMode.name === 'light' &&<Image style={styles.iconImage} source={require('../../assets/images/medialightmode.png')}/>}
                                {appearanceMode.name === 'dark' &&<Image style={styles.iconImage} source={require('../../assets/images/mediadarkmode.png')}/>}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.specialContainer}>
                            <TouchableOpacity onPress={togglePrivateButton} style={ privateConvo ? styles.privateButtonSelected : styles.privateButton }>
                                <Text style={styles.privateText}>Private</Text>
                            </TouchableOpacity>

                            { !dialogue && <TouchableOpacity onPress={activateDialogue}>
                                { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/dialoguerobotinactivedarkmode.png')} style={styles.dialogueRobot}/>}
                                { appearanceMode.name === 'light' && <Image source={require('@/assets/images/dialoguerobotinactivelightmode.png')} style={styles.dialogueRobot}/>}
                            </TouchableOpacity>}
                            { dialogue && <TouchableOpacity onPress={activateDialogue}>
                                { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/dialoguerobotactivedarkmode.png')} style={styles.dialogueRobot}/>}
                                { appearanceMode.name === 'light' && <Image source={require('@/assets/images/dialoguerobotactivelightmode.png')} style={styles.dialogueRobot}/>}
                            </TouchableOpacity>}
                        </View>

                        { !dialogue && <TouchableOpacity disabled={linkURL !== '' ? !validURL : validURL} onPress={handleConvoStarter}>
                            <Text style={[styles.startConvoText, linkURL !== '' && { color: validURL ? appearanceMode.primary : appearanceMode.secondary }]}>{ privateConvo ? 'Start Private Convo' : 'Start Convo' }</Text>
                        </TouchableOpacity>}
                        { dialogue && <TouchableOpacity disabled={linkURL !== '' ? !validURL : validURL} onPress={handleConvoStarter}>
                            <Text style={[styles.startConvoText, linkURL !== '' && { color: validURL ? appearanceMode.primary : appearanceMode.secondary }]}>{ privateConvo ? 'Start Private Dialogue' : 'Start Dialogue' }</Text>
                        </TouchableOpacity>}
                    </View>


                    <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: 20}} horizontal>
                        {files?.map((file, index) => {
                            if(file.type === 'image') {
                                return (
                                    <View key={index}>
                                        <Image key={index} source={{uri: file.uri}} style={styles.image}/>
                                    </View>
                                )
                            } else if(file.type === 'video') {
                                return (
                                    <View key={index}>
                                        { currentPlayingVideoIndex !== index ? (<TouchableOpacity onPress={() => playVideo(index)} style={styles.videoContainer}>
                                            <BlurView style={styles.playButton} tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} >
                                                <Image style={styles.playButtonImage} source={require('@/assets/images/play.png')}/>
                                            </BlurView>
                                        </TouchableOpacity>) :
                                        (<TouchableOpacity onPress={() => pauseVideo(index)} style={styles.videoContainer}>
                                            <BlurView style={styles.playButton} tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} >
                                                <Image style={styles.playButtonImage} source={require('@/assets/images/pause.png')}/>
                                            </BlurView>
                                        </TouchableOpacity>)
                                        }
                                        <Video
                                        ref={(ref: Video) => videoRefs.current[index] = ref}
                                        style={[styles.video, files.length === 1 && { width: Dimensions.get('window').width - 40}]}
                                        source={{ uri: file.uri }}
                                        isLooping
                                        onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status)}
                                        resizeMode={ResizeMode.COVER}
                                        />
                                    </View>
                                )
                            }
                        })}
                    </ScrollView>
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

