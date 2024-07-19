import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { Ionicons } from '@expo/vector-icons'
import { router, useRootNavigationState } from 'expo-router'
import { convoType, highlightsType2, userType } from '@/types'
import { supabase } from '@/lib/supabase'
import PendingConvoBox from './PendingConvoBox'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import MediaFullScreen from '@/components/MediaFullScreen'
import { sendPushNotification } from '@/pushNotifications'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'


const DEVICE_HEIGHT = Dimensions.get('window').height
const PendingHighlightRequests = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const [convos, setConvos] = useState<highlightsType2[]>([])
    const showFullScreenMedia = useSelector((state: RootState) => state.media.showFullScreen)
    const dispatch = useDispatch()
    const navigationState = useRootNavigationState() as any
    const mediaPosition = useSharedValue(DEVICE_HEIGHT)
    const mediaOpacity = useSharedValue(2)
    const styles = getStyles(appearanceMode)


    const animatedMediaStyles = useAnimatedStyle(() => {
        return {
          transform: [
            {
              translateY: mediaPosition.value
            }
          ],
          opacity: mediaOpacity.value
        }
      })

    const fetchPendingRequests = async () => {
        // Fetch pending requests from API
        const { data, error } = await supabase
        .from('highlights')
        .select('*, Convos(*, Users(*))')
        .eq('status', 'pending')
        .order('dateCreated', { ascending: false })
        if(!error) {
            setConvos(data)
        } else {
            console.log("Problem fetching pending requests: ", error.message)
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
                    await sendPushNotification(String(user.pushToken), "New Highlights!", `There are new highlights ${user.username}. Check it out!`, 'highlights', null, null, user.user_id)
                }
            }
        } catch (error) {
            console.log("Unexpected error: ", error);
        }
    }

    const readyNotification = async (user_id:string) => {
        try {
            const notificationData = {
                sender_id: authenticatedUserData?.user_id,
                senderUserData: authenticatedUserData,
                receiver_id: user_id,
                type: 'highlights',
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


    useEffect(() => {
        fetchPendingRequests()
    }, [])

    useEffect(() => {

        const channel = supabase.channel('custom-highlight-channel')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'highlights'},
            (payload) => {
                setConvos(prev => prev.filter(item => item.convo_id !== payload.new.convo_id))
            }
        ).subscribe()
        return () => {
            channel.unsubscribe()
        }
    }, [])


    return (
        <View style={styles.container}>
            { showFullScreenMedia && 
            <Animated.View style={[styles.mediaContainer, animatedMediaStyles, { display: showFullScreenMedia ? 'flex' : 'none' }]}>
                <MediaFullScreen />
            </Animated.View>}

            <View style={styles.header}>
                <Text style={styles.headerText}>Pending Highlight Requests</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={38} color={appearanceMode.textColor} />
                </TouchableOpacity>
            </View>
            <FlatList
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 7, paddingBottom: 30 }}
            ListHeaderComponent={() => (
                <TouchableOpacity onPress={sendNotification} style={styles.sendNotificationToAllButton}>
                    <Text style={styles.sendNotificationToAllButtonText}>Send Notification To All</Text>
                </TouchableOpacity>
            )}
            ListEmptyComponent={() => 
            <View style={styles.noPendingRequestsContainer}>
                <Text style={styles.noPendingRequestsText}>No pending requests</Text>
            </View>
            }
            data={convos}
            renderItem={({ item }) => <PendingConvoBox convo_id={item.Convos.convo_id} Convos={item.Convos} />}
            />
        </View>
    )
}

export default PendingHighlightRequests

