import { Image, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { getStyles } from './styles'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { convoType, userType } from '@/types'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { getUserData } from '@/state/features/userSlice'
import { addToUserCache, getConvoForChat, setConvoExists } from '@/state/features/chatSlice'
import { Skeleton } from 'moti/skeleton'

const FromPrivate = (convo: convoType) => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const [user, setUser] = useState<userType>()
    const userCache = useSelector((state:RootState) => state.chat.userCache)
    const styles = getStyles(appearanceMode)
    const dispatch = useDispatch()

    const fetchUserData = async () => {
        if(userCache[convo.user_id as string]) {
            setUser(userCache[convo.user_id as string])
            return;
        }
        const { data, error } = await supabase
        .from('Users')
        .select('*')
        .eq('user_id', convo.user_id)
        .single()
        if(!error) {
            setUser(data)
            dispatch(addToUserCache({ [convo.user_id as string]: data }))
        } else {
            console.log("Problem getting user data: ", error.message)
        }
    }

    const handleGuestProfile = useCallback(() => {
        if(user) {
            dispatch(getUserData(user))
            router.push({
                pathname: '/(profile)/[profileID]/',
                params: {
                    profileID: String(convo.user_id)
                }
            })
        } else return;
    }, [user, router, convo.user_id, dispatch])

    const handleChatNavigation = useCallback(() => {
        dispatch(setConvoExists(null))
        dispatch(getConvoForChat(convo))
        router.push({
            pathname: '/(chat)/[convoID]',
            params: {
                convoID: String(convo.convo_id)
            }
        })
    }, [convo, router, dispatch])

    useEffect(() => {
        fetchUserData()
    }, [convo])

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={{ justifyContent: 'space-around', width: '70%' }}>
                    <Skeleton show={user === undefined} height={50} width={100}>
                        <TouchableOpacity onPress={handleGuestProfile} style={styles.header}>
                            <Image source={require('@/assets/images/blankprofile.png')} style={styles.profileImage}/>
                            <Text style={styles.name}>{user?.name}</Text>
                        </TouchableOpacity>
                    </Skeleton>
                    <Text numberOfLines={3} style={styles.convoStarter}>{convo.convoStarter}</Text>
                </View>

                <View style={styles.convoImageContainer}>
                    <Image source={{ uri: 'https://www.rollingstone.com/wp-content/uploads/2024/06/kendrick-lamar-not-like-us.jpg?w=1581&h=1054&crop=1' }} style={styles.convoImage}/>
                </View>
            </View>
            <View style={styles.footer}>
                <TouchableOpacity onPress={handleChatNavigation} style={styles.viewRoomButton}>
                    <Text style={styles.viewRoomText}>View Room</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default FromPrivate

