import { View, FlatList, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import NotificationBox from '../NotificationBox'
import notifications from '@/assets/data/notifications'
import { supabase } from '@/lib/supabase'

const NotificationFeed = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
    const styles = getStyles(appearanceMode)
    const [notificationData, setNotificationData] = useState<any[]>()
    const dispatch = useDispatch()

    const getNotificationData = async () => {
        const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .order('dateCreated', { ascending: false })
        if(data) {
            setNotificationData(data)
        } else if(error) {
            console.log("Couldn't get notifications", error.message)
        }
    }

    useEffect(() => {
        getNotificationData()
    }, [])

    useEffect(() => {
        const channel = supabase.channel(`custom-notification-channel-${authenticatedUserData?.user_id}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications' },
            (payload) => {
                if(payload.eventType === 'INSERT'){
                    setNotificationData(prevData => [payload.new, ...(prevData ?? [])]);
                } else if(payload.eventType === 'DELETE') {
                    setNotificationData(prevData => prevData?.filter(notification => notification.id !== payload.old.id));
                }
            }
        ).subscribe();

        return () => {
            channel.unsubscribe();
        }
    }, [authenticatedUserData])

    const renderContent = () => {
        if(notificationData?.length === 0) {
            return (
                <View style={styles.noNotificationsContainer}>
                    <Text style={styles.noNotificationsText}>No Notifications Yet. Engage!</Text>
                </View>
            )
        } else {
            return (
                <View>
                    <FlatList
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 120, paddingBottom: 120 }}
                    keyExtractor={(notificationData) => notificationData.id.toString()}
                    data={notificationData}
                    renderItem={({ item }) => <NotificationBox dateCreated={item.dateCreated} seen={item.seen} senderUserData={item.senderUserData} data={item?.data} message={item.message} convo={item.convo} type={item.type} from={item.from} id={item.id} topic={item.topic}/>}
                    />
                </View>
            )
        }
    }
    
    return (
       <>
       {renderContent()}
       </>
    )
}

export default NotificationFeed
