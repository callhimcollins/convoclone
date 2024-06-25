import { Text, View, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native'
import getStyles from './styles'
import { useDispatch, useSelector } from 'react-redux'
import React, { useEffect, useState } from 'react'
import { RootState } from '@/state/store'
import EditProfileHeader from './EditProfileHeader'
import RemoteImage from '@/components/RemoteImage'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { supabase } from '@/lib/supabase'
import { setAuthenticatedUserData } from '@/state/features/userSlice'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { randomUUID } from 'expo-crypto'

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
    const inputContainerVisibility = useSharedValue(1)
    const inputContainerPosition = useSharedValue(0)
    const inputVisibility = useSharedValue(0)
    const inputPosition = useSharedValue(0)
    const styles = getStyles(appearanceMode)
    const dispatch = useDispatch()

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if(status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!')
        }
    }

    const uploadImage = async () => {
        if(!selectedProfileImage?.uri?.startsWith('file')) {
            return;
        }

        const { data:userData, error: userError } = await supabase
        .from('Users')
        .select('*')
        .eq('user_id', authenticatedUserData?.user_id)
        .single()
        if(userData) {
            const base64 = await FileSystem.readAsStringAsync(selectedProfileImage.uri, { encoding: 'base64' })
            const filepath = `${userData.profileImage}`;
            const contentType = 'image/png';
            const { data, error } = await supabase
            .storage
            .from('files')
            .upload(filepath, decode(base64), { cacheControl: '3600', upsert: true, contentType })
            if(data) {
                console.log("Image uploaded", data.path)
                return (data.path)
            } else if(error) {
                console.log("error uploading image", error.message)
            }
        } else {
            console.log("Error getting user data", userError?.message)
        }
    }


    const uploadProfileBackground = async () => {
        if(!selectedProfileBackground?.uri?.startsWith('file')) {
            return;
        }
        const { data:userData, error: userError } = await supabase
        .from('Users')
        .select('*')
        .eq('user_id', authenticatedUserData?.user_id)
        .single()
        if(userData) {
            if(userData.backgroundProfileImage) {
                const base64 = await FileSystem.readAsStringAsync(selectedProfileBackground.uri, { encoding: 'base64' })
                const filepath = `${userData.backgroundProfileImage}`;
                const contentType = 'image/png';
                const { data, error } = await supabase
                .storage
                .from('files')
                .upload(filepath, decode(base64), { cacheControl: '3600', upsert: true, contentType })
                if(data) {
                    const { error } = await supabase
                    .from('Users')
                    .update({ backgroundProfileImage: data.path })
                    .eq('user_id', userData?.user_id)
                    .single()
                    if(!error) {
                        console.log("Profile background successfully uploaded")
                    } else {
                        console.log("Problem uploading profile background", error.message)
                    }
                } else if(error) {
                    console.log("error uploading profile background", error.message)
                }
            } else {
                const base64 = await FileSystem.readAsStringAsync(selectedProfileBackground.uri, { encoding: 'base64' })
                const filepath = `Users/${userData.user_id}/${randomUUID()}-background.png`;
                const contentType = 'image/png';
                const { data } = await supabase
                .storage
                .from('files')
                .upload(filepath, decode(base64), { contentType })
                if(data) {
                    const { error } = await supabase
                    .from('Users')
                    .update({ backgroundProfileImage: data.path })
                    .eq('user_id', userData?.user_id)
                    .single()
                    if(!error) {
                        console.log("Profile background successfully uploaded")
                    } else {
                        console.log("Problem uploading profile background", error.message)
                    }
                }
            }
        } else {
            console.log("Error getting user data", userError?.message)
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

    return (
        <View style={styles.container}>
            <EditProfileHeader/>

            <KeyboardAwareScrollView style={styles.contentContainer}>
                <View>
                    <View style={styles.profileBackgroundImageContainer}>
                        <TouchableOpacity onPress={pickProfileBackground} style={styles.profileBackgroundImageButton}>
                            <Text style={styles.profileBackgroundImageButtonText}>Change</Text>
                        </TouchableOpacity>
                        { !selectedProfileBackground && <RemoteImage style={styles.profileBackgroundImage} path={authenticatedUserData?.backgroundProfileImage}/>}
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
                        { !selectedProfileImage && <RemoteImage style={styles.profileImage} path={authenticatedUserData?.profileImage}/>}
                        { selectedProfileImage && <Image style={styles.profileImage} source={{ uri: selectedProfileImage.uri }}/> }
                    </View>

                    <TouchableOpacity style={styles.removeImageButton}>
                        <Text style={styles.removeImageButtonText}>Remove Image</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.audioContainer}>
                    <TouchableOpacity style={styles.playButtonContainer}>
                        <View style={styles.playButton}>
                            <Image style={styles.playButtonImage} source={require('@/assets/images/play.png')}/>
                        </View>

                        <Text style={styles.playButtonText}>Play Audio Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.changeAudioProfileButton}>
                        <Text style={styles.changeAudioProfileButtonText}>Change Audio Profile</Text>
                    </TouchableOpacity>
                </View>


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

