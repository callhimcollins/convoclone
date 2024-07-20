import { Text, View, ScrollView, TouchableOpacity, Image, Switch, useColorScheme, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { BlurView } from 'expo-blur'
import { supabase } from '@/lib/supabase'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getUserData, setAuthenticatedUserData, setAuthenticatedUserID } from '@/state/features/userSlice'
import { getDefaultAppearance, setAppearance, setDefaultAppearance } from '@/state/features/appearanceSlice'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import { sendPushNotification } from '@/pushNotifications'

const ProfileSettings = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const defaultAppearance = useSelector((state:RootState) => state.appearance.defaultAppearance)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const authenticatedUserID = useSelector((state:RootState) => state.user.authenticatedUserID)
    const userData = useSelector((state:RootState) => state.user.userData)
    const router = useRouter()
    const [autoPlay, setAutoPlay] = useState(false)
    const [userIsBlocked, setUserIsBlocked] = useState(false)
    const [userIsBlockedLoading, setUserIsBlockedLoading] = useState(true)
    const [inPrivateCircleLoading, setInPrivateCircleLoading] = useState(true)
    const [status, setStatus] = useState <string | null>(null)
    const styles = getStyles(appearanceMode)
    const dispatch = useDispatch()
    const toggleAutoPlaySwitch = () => setAutoPlay((prevState) => !prevState)
    const colorScheme = useColorScheme()
    const { profileID } = useLocalSearchParams()

    const handleSignOut = async () => {
        if(profileID === authenticatedUserData?.user_id) {
            try {
                console.log("Sign out successful")
                const { error:updateError } = await supabase
                .from('Users')
                .update({ pushToken: null })
                .eq('user_id', String(authenticatedUserData?.user_id))
                if(!updateError) {
                    console.log("Push Deleted")
                    const { error } = await supabase.auth.signOut()
                    if(error) {
                        await dispatch(setSystemNotificationState(true))
                        await dispatch(setSystemNotificationData({ type: 'error', message: 'Couldn\'t Sign Out' }))
                    } else {
                        await dispatch(setAuthenticatedUserData(null))
                        await dispatch(setAuthenticatedUserID(null))
                        await dispatch(getUserData(null))
                        await dispatch(setSystemNotificationState(true))
                        await dispatch(setSystemNotificationData({ type: 'neutral', message: 'Signed Out. Please Restart App' }))
                        await AsyncStorage.clear();
                        router.replace('/(auth)/LoginScreen')
                    }
                } else {
                    console.log('Problem occured on update push', updateError)
                }
            } catch (error) {
                console.log("Unexpected error in sign out: ", error)
            }
        }
    }

    const navigateToEditProfile = () => {
        router.replace({
            pathname: '/(profile)/editprofilescreen'
        })
    }

    const privateCircleData = {
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        receiver_id: userData?.user_id,
        receiverUserData: userData,
        senderIsBlocked: false,
        type: 'requesttojoin'
    }

    const requestForPrivatCircleNotification = {
        sender_id: authenticatedUserData?.user_id,
        senderUserData: authenticatedUserData,
        receiver_id: userData?.user_id,
        type: 'privatecircle',
    }


    const handleBlockUser = async () => {
        const { data, error } = await supabase
        .from('blockedUsers')
        .select('*')
        .eq('blockedUserID', String(userData?.user_id))
        .eq('user_id', String(authenticatedUserData?.user_id))
        .single()
        if(!data) {
            const { error: insertError } = await supabase
            .from('blockedUsers')
            .insert([{ user_id: authenticatedUserData?.user_id, blockedUserID: userData?.user_id, blockedUserData: userData }])
            .single()
            if(!insertError) {
                router.back();
                console.log('User successfully blocked')
                setUserIsBlocked(true)
                nullifyUserInCircle()
                dispatch(setSystemNotificationState(true));
                dispatch(setSystemNotificationData({ type: 'success', message: 'User Successfully Blocked' }))
            } else {
                dispatch(setSystemNotificationState(true));
                dispatch(setSystemNotificationData({ type: 'error', message: 'Couldn\'t Block User. An Error Occured' }))
            }
        } else {
            dispatch(setSystemNotificationState(true));
            dispatch(setSystemNotificationData({ type: 'neutral', message: 'User Already Blocked' }))
        }
        if(error) {
            return;
        }
    }

    const handleUnblockUser = async () => {
        const { error } = await supabase
        .from('blockedUsers')
        .delete()
        .eq('user_id', String(authenticatedUserData?.user_id))
        .eq('blockedUserID', String(userData?.user_id))
        if(!error) {
            router.back()
            console.log("User unblocked")
            dispatch(setSystemNotificationState(true))
            dispatch(setSystemNotificationData({ type: 'success', message: 'User Unblocked' }))
            setUserIsBlocked(false)
            reviveUserInCircle()
        } else {
            console.log("Could not unblock user", error.message)
            dispatch(setSystemNotificationState(true))
            dispatch(setSystemNotificationData({ type: 'error', message: 'An Error Occured' }))
        }
    }


    const nullifyUserInCircle = async () => {
        const { error } = await supabase
        .from('privateCircle')
        .update({ senderIsBlocked: true })
        .eq('sender_id', String(userData?.user_id))
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .single()

        if(!error) {
            console.log("User successfully nullified in private circle")
        } else {
            console.log("Couldn't nullify user in private circle", error.message)
        }
    }

    const reviveUserInCircle = async () => {
        const { error } = await supabase
        .from('privateCircle')
        .update({ senderIsBlocked: false })
        .eq('sender_id', String(userData?.user_id))
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .single()
        if(!error) {
            console.log("User successfully revived in private circle") 
        } else {
            console.log("Couldn't revive user in private circle", error.message)
        }
    }

    const checkUserIsBlocked = async () => {
        const { data, error } = await supabase
        .from('blockedUsers')
        .select('*')
        .eq('blockedUserID', String(userData?.user_id))
        .eq('user_id', String(authenticatedUserData?.user_id))
        .single()

        if(data) {
            setUserIsBlocked(true)
            setUserIsBlockedLoading(false)
        } else {
            setUserIsBlockedLoading(false)
        }
        if(error) {
            setUserIsBlockedLoading(false)
        } else {
            setUserIsBlockedLoading(false)
        }
    }

    const handleDefaultAppearance = async () => {
        if(profileID === authenticatedUserData?.user_id) {
            await dispatch(setDefaultAppearance())
        }
    }

    const userSetAppearance = () => {
        dispatch(setAppearance())
    }

    const handleBlockedUsersNavigation = () => {
        router.replace({
            pathname: '/(profile)/blockedusersscreen'
        })
    }

    const handleUserKeepUpsNavigation = () => {
        router.replace({
            pathname: '/(profile)/userkeepupslistscreen'
        })
    }

    const handlePrivateCircleNavigation = () => {
        router.replace({
            pathname: '/(profile)/privatecirclescreen'
        })
    }

    const sendNotificationRequestForPrivateCircle = async () => {
        const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(userData?.user_id))
        .eq('type', 'privatecircle')
        .single()
        if(data) {
            console.log("request notification already exists")
        } else {
            const { error } = await supabase
            .from('notifications')
            .insert([requestForPrivatCircleNotification])
            .single()

            if(!error) {
                console.log("Request notification sent")
                const { data } = await supabase
                .from('Users')
                .select('pushToken, user_id')
                .eq('user_id', String(userData?.user_id))
                .single()
                if(data) {
                    sendPushNotification(data.pushToken, "Private", `${authenticatedUserData?.username} is requesting to join your Private Circle`, 'profile', authenticatedUserData, null, userData?.user_id)
                }
            } else {
                console.log("Problem sending notification")
            }
        } 

        if(error) {
            console.log("Couldn't fetch notification", error.message)
        }
    }

    const sendRequestForPrivateCircle = async () => {
        const { data } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(userData?.user_id))
        .single()

        if(data) {
            console.log("Request sent earlier")
        } else {
            const { data, error } = await supabase
            .from('blockedUsers')
            .select('*')
            .eq('blockedUserID', String(authenticatedUserData?.user_id))
            .eq('user_id', String(userData?.user_id))
            .single()
            if(data) {
                console.log("Data exists")
                return;
            } else {
                const { error } = await supabase
                .from('privateCircle')
                .insert([privateCircleData])
                .single()
                if(!error) {
                    setStatus('pending')
                    sendNotificationRequestForPrivateCircle()
                    console.log("Private circle request sent")
                    router.back();
                } else {
                    console.log("Problem sending private circle request", error.message)
                    setStatus(null)
                }
            }
        }
    }

    const cancelRequestForPrivateCircle = async () => {
        const { error } = await supabase
        .from('privateCircle')
        .delete()
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(userData?.user_id))
        if(!error) {
            console.log("private circle request deleted")
            const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('sender_id', String(authenticatedUserData?.user_id))
            .eq('receiver_id', String(userData?.user_id))
            .eq('type', 'privatecircle')
            if(!error) {
               console.log("Notification deleted!")
               setStatus(null) 
               router.back()
            } else {
                console.log("Problem deleting notification", error.message)
            }
        } else {
            console.log("Problem deleting private circle request", error.message)
        }
    }

    const removeSelfFromPrivateCircle = async () => {
        const { error } = await supabase
        .from('privateCircle')
        .delete()
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(userData?.user_id))
        if(!error) {
            console.log("private circle request deleted")
            const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('sender_id', String(authenticatedUserData?.user_id))
            .eq('receiver_id', String(userData?.user_id))
            .eq('type', 'privatecircle')
            if(!error) {
               console.log("Notification deleted!")
               setStatus(null) 
               router.back()
               const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('sender_id', String(userData?.user_id))
                .eq('receiver_id', String(authenticatedUserData?.user_id))
                .eq('type', 'privatecircleacceptance')
                if(!error) {
                    console.log("notification acceptance deleted!")
                }
            } else {
                console.log("Problem deleting notification", error.message)
            }
        } else {
            console.log("Problem deleting private circle request", error.message)
        }
    }

    const removeUserFromPrivateCircle = async () => {
        const { error } = await supabase
        .from('privateCircle')
        .delete()
        .eq('sender_id', String(userData?.user_id))
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        if(!error) {
            console.log("private circle request deleted")
            const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('sender_id', String(userData?.user_id))
            .eq('receiver_id', String(authenticatedUserData?.user_id))
            .eq('type', 'privatecircle')
            if(!error) {
               console.log("Notification deleted!")
               setStatus(null) 
               router.back()
               const { data, error } = await supabase
                .from('notifications')
                .delete()
                .eq('sender_id', String(authenticatedUserData?.user_id))
                .eq('receiver_id', String(userData?.user_id))
                .eq('type', 'privatecircleacceptance')
                if(!error) {
                    console.log("notification acceptance deleted!")
                }
            } else {
                console.log("Problem deleting notification", error.message)
            }
        } else {
            console.log("Problem deleting private circle request", error.message)
        }
    }

    const handleRemoveSelfFromPrivateCircle = async () => {
        Alert.alert(
            `Kick Yourself?`,
            `Are you sure you want to kick yourself from ${userData?.username}'s private circle?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Remove',
                    onPress: removeSelfFromPrivateCircle,
                }
            ],
            { cancelable: false }
        )
    }

    const handleRemoveUserFromPrivateCircle = async () => {
        Alert.alert(
            `Kick ${userData?.username}?`,
            `Are you sure you want to kick ${userData?.username}'s from your private circle?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Remove',
                    onPress: removeUserFromPrivateCircle,
                }
            ],
            { cancelable: false }
        )
    }


    const checkForRequestForPrivateCircle = async () => {
        const { data, error } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('receiver_id', String(userData?.user_id))
        .single()
        if(data) {
            if(data?.status === 'pending') {
                console.log("request is pending")
                setStatus('pending')
                setInPrivateCircleLoading(false)
            } else if(data?.status === 'accepted' && data?.type === 'requesttojoin') {
                console.log("request has been accepted")
                setStatus('request accepted')
                setInPrivateCircleLoading(false)
            } else if(data?.status === 'accepted' && data?.type === 'invite') {
                console.log("invite request accepted")
                setStatus('invite accepted')
                setInPrivateCircleLoading(false)
            }
        } else if(error) {
            setInPrivateCircleLoading(false)
        } else {
            setInPrivateCircleLoading(false)
        }
    }



    useEffect(() => {
        checkForRequestForPrivateCircle()
    }, [])

    useEffect(() => {
        checkUserIsBlocked()
    }, [])

    useEffect(() => {
        AsyncStorage.setItem('defaultAppearance', String(defaultAppearance))
        .catch(error => {
            console.error('Error saving to AsyncStorage', error)
        })
    }, [defaultAppearance])

    useEffect(() => {
        AsyncStorage.setItem('userSetAppearance', String(appearanceMode.name))
        .catch(error => {
            console.log("Error saving to AsyncStorage", error)
        })
    }, [appearanceMode])

    useEffect(() => {
        if(defaultAppearance) {
            dispatch(getDefaultAppearance(colorScheme))
        }
    }, [handleDefaultAppearance])

    const deleteAccount = async () => {
            const { data, error } = await supabase
            .from('Users')
            .delete()
            .eq('user_id', String(authenticatedUserData?.user_id))
            .select()
            .single()
            if(!error) {
                const { error:storageError } = await supabase.storage
                .from('userfiles')
                .remove([String(authenticatedUserData?.profileImage), String(authenticatedUserData?.backgroundProfileImage), String(authenticatedUserData?.audio)])
                if(!storageError) {
                    console.log('Files Removed successfully')
                }
                dispatch(setSystemNotificationState(true))
                dispatch(setSystemNotificationData({ type: 'neutral', message: "Account Deleted. Please Restart App"}))
                const { error } = await supabase.auth.signOut();
                if(!error) {
                    await router.replace('(auth)/LoginScreen')
                }
            } else {
                dispatch(setSystemNotificationState(true))
                dispatch(setSystemNotificationData({ type: 'error', message: "Couldn't Delete Account"}))
                return;
            }
    }

    const handleDeleteAccount = async () => {
        Alert.alert(
            `Delete Account?`,
            `Are you sure you want to delete your account. All Data Will Be Lost.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    onPress: deleteAccount,
                }
            ],
            { cancelable: false }
        )
    }

    const reportUser = async () => {
        const { error } = await supabase
        .from('userReports')
        .insert({ reporting_user_id: authenticatedUserData?.user_id, reported_user_id: userData?.user_id })
        .single()
        if(!error) {
            dispatch(setSystemNotificationState(true))
            dispatch(setSystemNotificationData({ type: 'success', message: "User Reported. We'll Keep Working To Make Convo A Safe Place"}))
            router.back()
        } else {
            console.log('An Error Occured', error.message)
            dispatch(setSystemNotificationState(true))
            dispatch(setSystemNotificationData({ type: 'error', message: "A Problem Occured"}))
        }
    }

    return (
        <View style={styles.container}>
            <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.header}>
                <Text style={styles.headerText}>Settings</Text>
            </BlurView>

            { profileID === authenticatedUserData?.user_id && <ScrollView contentContainerStyle={{ paddingTop: 80 }}>
            <View style={[styles.button, {paddingRight: 30, flexDirection: 'column' }]}>
                    <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/appearancedarkmode.png')} style={styles.icon} />}
                            { appearanceMode.name === 'light' && <Image source={require('@/assets/images/appearancelightmode.png')} style={styles.icon} />}
                            <Text style={styles.buttonText}>Dark Mode</Text>
                        </View>

                        { !defaultAppearance && <Switch
                                trackColor={{ false: "#767577", true: "#8F8CFA" }}
                                thumbColor={autoPlay ? appearanceMode.primary : "#f4f3f4"}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={userSetAppearance}
                                value={appearanceMode.name === 'light' ? false : true}
                            />}
                    </View>
                    <TouchableOpacity onPress={handleDefaultAppearance} style={{ marginTop: 30, backgroundColor: defaultAppearance ? appearanceMode.primary : appearanceMode.faint, width: '80%', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 20 }}>
                        { defaultAppearance && <Text style={{ color: "white", fontFamily: 'bold' }}>Default Appearance On</Text>}
                        { !defaultAppearance && <Text style={{ color: appearanceMode.textColor, fontFamily: 'bold' }}>Default Appearance Off</Text>}
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={navigateToEditProfile} style={styles.button}>
                    { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/edituserdarkmode.png')} style={styles.icon} />}
                    { appearanceMode.name === 'light' && <Image source={require('@/assets/images/edituserlightmode.png')} style={styles.icon} />}
                    <Text style={styles.buttonText}>Edit Profile</Text>
                </TouchableOpacity>
                <View style={[styles.button, { justifyContent: 'space-between', paddingRight: 30 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/shareprofiledarkmode.png')} style={styles.icon} />}
                        { appearanceMode.name === 'light' && <Image source={require('@/assets/images/shareprofilelightmode.png')} style={styles.icon} />}
                        <Text style={styles.buttonText}>Share Profile</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={handlePrivateCircleNavigation} style={styles.button}>
                    { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/privatedarkmode.png')} style={styles.icon} />}
                    { appearanceMode.name === 'light' && <Image source={require('@/assets/images/privatelightmode.png')} style={styles.icon} />}
                    <Text style={styles.buttonText}>Private Circle</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUserKeepUpsNavigation} style={styles.button}>
                    { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/keepupsettingsdarkmode.png')} style={styles.icon} />}
                    { appearanceMode.name === 'light' && <Image source={require('@/assets/images/keepupsettingslightmode.png')} style={styles.icon} />}
                    <Text style={styles.buttonText}>People You're Keeping Up With</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBlockedUsersNavigation} style={styles.button}>
                    { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/blockeduserdarkmode.png')} style={styles.icon} />}
                    { appearanceMode.name === 'light' && <Image source={require('@/assets/images/blockeduserlightmode.png')} style={styles.icon} />}
                    <Text style={styles.buttonText}>Blocked People</Text>
                </TouchableOpacity>

                
                <TouchableOpacity onPress={handleSignOut} style={styles.button}>
                    <Image source={require('@/assets/images/signout.png')} style={styles.icon} />
                    <Text style={[styles.buttonText, { color: '#E33629' }]}>Sign Out</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleDeleteAccount} style={styles.button}>
                    <Image source={require('@/assets/images/deleteaccount.png')} style={styles.icon} />
                    <Text style={[styles.buttonText, { color: '#E33629' }]}>Delete Account</Text>
                </TouchableOpacity>
            </ScrollView>}


            { profileID !== authenticatedUserData?.user_id && <ScrollView contentContainerStyle={{ paddingTop: 80 }}>
                { !userIsBlocked && status === null && !inPrivateCircleLoading &&<TouchableOpacity onPress={sendRequestForPrivateCircle} style={styles.button}>
                    { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/joinprivatecircledarkmode.png')} style={styles.icon} />}
                    { appearanceMode.name === 'light' && <Image source={require('@/assets/images/joinprivatecirclelightmode.png')} style={styles.icon} />}
                    <Text style={styles.buttonText}>Request To Join Private Circle</Text>
                </TouchableOpacity>}
                { inPrivateCircleLoading &&
                <View style={styles.button}>
                    <Text style={styles.buttonText}>Checking...</Text>
                </View>}

                
                { !userIsBlocked && status === 'pending' && !inPrivateCircleLoading && <TouchableOpacity onPress={cancelRequestForPrivateCircle} style={[styles.button, { flexWrap: 'wrap' }]}>
                    { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/joinprivatecircledarkmode.png')} style={styles.icon} />}
                    { appearanceMode.name === 'light' && <Image source={require('@/assets/images/joinprivatecirclelightmode.png')} style={styles.icon} />}
                    <Text style={[styles.buttonText, { color: appearanceMode.secondary }]}>Request Pending.  <Text style={{ color: appearanceMode.primary }}>Tap To Cancel</Text></Text>
                </TouchableOpacity>}

                { !userIsBlocked && status === 'request accepted' && <TouchableOpacity onPress={handleRemoveSelfFromPrivateCircle} style={[styles.button, { flexWrap: 'wrap' }]}>
                    { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/privatedarkmode.png')} style={styles.icon} />}
                    { appearanceMode.name === 'light' && <Image source={require('@/assets/images/privatelightmode.png')} style={styles.icon} />}
                    <Text style={[styles.buttonText, { color: appearanceMode.secondary }]}>You are in {userData?.username}'s Private Circle. <Text style={{ color: appearanceMode.primary }}> Tap Kick Yourself Out</Text></Text>
                </TouchableOpacity>}

                { !userIsBlocked && status === 'invite accepted' && <TouchableOpacity onPress={handleRemoveUserFromPrivateCircle} style={[styles.button, { flexWrap: 'wrap' }]}>
                    { appearanceMode.name === 'dark' && <Image source={require('@/assets/images/privatedarkmode.png')} style={styles.icon} />}
                    { appearanceMode.name === 'light' && <Image source={require('@/assets/images/privatelightmode.png')} style={styles.icon} />}
                    <Text style={[styles.buttonText, { color: appearanceMode.secondary }]}>{userData?.username} is in your Private Circle. <Text style={{ color: appearanceMode.primary }}>Tap To Kick Out</Text></Text>
                </TouchableOpacity>}

                <TouchableOpacity onPress={reportUser} style={styles.button}>
                    <Image source={require('@/assets/images/reportuser.png')} style={styles.icon} />
                    <Text style={[styles.buttonText, { color: '#FF3333' }]}>Report User</Text>
                </TouchableOpacity>
                { !userIsBlocked && !userIsBlockedLoading && <TouchableOpacity onPress={handleBlockUser} style={styles.button}>
                    <Image source={require('@/assets/images/blockuser.png')} style={styles.icon} />
                    <Text style={[styles.buttonText, { color: '#FF3333' }]}>Block User </Text>
                </TouchableOpacity>}

                { userIsBlocked && !userIsBlockedLoading &&<TouchableOpacity onPress={handleUnblockUser} style={styles.button}>
                    <Image source={require('@/assets/images/unblockuser.png')} style={styles.icon} />
                    <Text style={[styles.buttonText, { color: appearanceMode.secondary }]}>Unblock User</Text>
                </TouchableOpacity>}
            </ScrollView>}

            { userIsBlockedLoading &&
                <View style={styles.button}>
                    <Text style={styles.buttonText}>Checking...</Text>
                </View>}
        </View>
    )
}

export default ProfileSettings

