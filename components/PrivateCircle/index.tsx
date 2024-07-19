import { Text, TouchableOpacity, View, FlatList } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import getStyles from './styles'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import PrivateCircleHeader from './PrivateCircleHeader'
import { BlurView } from 'expo-blur'
import { supabase } from '@/lib/supabase'
import { privateCircleType } from '@/types'
import InYourCircle from './InYourCircle'
import { router } from 'expo-router'
import YourRequestBox from './YourRequestBox'
import IncomingRequestBox from './IncomingRequestBox'
import { updateAppInView } from '@/pushNotifications'
const PrivateCircle = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const [peopleInPrivateCircle, setPeopleInPrivateCircle] = useState<Array<privateCircleType>>()
    const [peopleInYourPendingRequests, setPeopleInYourPendingRequests] = useState<Array<privateCircleType>>()
    const [peopleInYourIncomingRequests, setPeopleInYourIncomingRequests] = useState<Array<privateCircleType>>()
    const activePrivateCircleTab = useSelector((state:RootState) => state.navigation.activePrivateCircleTab)
    const styles = getStyles(appearanceMode)


    const getPeopleInPrivateCircle = async () => {
        const { data, error } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .eq('status', 'accepted')
        .eq('type', 'requesttojoin')
        .eq('senderIsBlocked', false)

        const { data: data2, error: error2 } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('status', 'accepted')
        .eq('type', 'invite')
        .eq('senderIsBlocked', false)

        if(data && data2) {
            setPeopleInPrivateCircle([...data, ...data2].map(user => ({
                id: user.id,
                sender_id: user.sender_id,
                receiver_id: user.receiver_id,
                senderUserData: user.senderUserData,
                receiverUserData: user.receiverUserData,
                status: user.status,
                type: user.type
            })))
        }
        if(error) {
            console.log("Couldn't get users in private circle", error.message)
        }
    }

    const getPeopleInYourPendingRequests = async () => {
        const { data } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', authenticatedUserData?.user_id)
        .eq('senderIsBlocked', false)
        .eq('status', 'pending')
        if(data) {
            setPeopleInYourPendingRequests(data.map(user => ({
                id: user.id,
                sender_id: user.sender_id,
                receiver_id: user.receiver_id,
                senderUserData: user.senderUserData,
                receiverUserData: user.receiverUserData,
                status: user.status,
                type: user.type
            })))
        }
    }


    const getPeopleInYourIncomingRequests = async () => {
        const { data, error } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .eq('senderIsBlocked', false)
        .eq('status', 'pending')

        if(data) {
            setPeopleInYourIncomingRequests(data.map(user => ({
                id: user.id,
                sender_id: user.sender_id,
                receiver_id: user.receiver_id,
                senderUserData: user.senderUserData,
                receiverUserData: user.receiverUserData,
                status: user.status,
                type: user.type
            })))
        } 
        if(error) {
            console.log("Couldn't get users yet to accept your request", error.message)
        }
    }

    useEffect(() => {
        getPeopleInPrivateCircle()
        getPeopleInYourPendingRequests()
        getPeopleInYourIncomingRequests()
    }, [])

    useEffect(() => {
        const channel = supabase.channel(`custom-kickout-channel-${authenticatedUserData?.user_id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'privateCircle' },
          (payload) => {
            if(payload.eventType === 'DELETE') {
                setPeopleInPrivateCircle(prevUsers => prevUsers?.filter(user => user.id !== payload.old.id))
            } else if(payload.eventType === 'UPDATE') {
                setPeopleInPrivateCircle(prevUsers => [payload.new, ...prevUsers])
            }
          }
        ).subscribe()

        return () => {
          channel.unsubscribe()
        }
      }, [])

    useEffect(() => {
        const channel = supabase.channel(`cancel-privatecircle-request-${authenticatedUserData?.user_id}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'privateCircle' },
            (payload) => {
                if(payload.eventType === 'DELETE') {
                    setPeopleInYourPendingRequests(prevUsers => prevUsers?.filter(user => user.id !== payload.old.id))
                } else if(payload.eventType === 'UPDATE') {
                    setPeopleInYourPendingRequests(prevUsers => [payload.new, ...prevUsers])
                }
            }
        ).subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [])

    useEffect(() => {
        const channel = supabase.channel(`accept-privatecircle-request-${authenticatedUserData?.user_id}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'privateCircle' },
            (payload) => {
                setPeopleInYourIncomingRequests(prevUsers => prevUsers?.filter(user => user.id !== payload.new.id))
            }
        ).subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [])

    return (
        <View style={styles.container}>
            <PrivateCircleHeader/>
            {  activePrivateCircleTab === "In Your Circle" && <>
            { peopleInPrivateCircle && peopleInPrivateCircle?.length > 0 && <FlatList
            contentContainerStyle={{ paddingTop: 140 }}
            data={peopleInPrivateCircle}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => <InYourCircle type={item.type} receiverUserData={item.receiverUserData} id={item.id} receiver_id={item.receiver_id} sender_id={item.sender_id} senderUserData={item.senderUserData} status={item.status}/>}
            />}
            { peopleInPrivateCircle && peopleInPrivateCircle?.length > 0 && <BlurView intensity={80} tint={appearanceMode.name === 'light' ? 'light' : 'dark'} style={styles.requestOthersButtonContainer}>
                <TouchableOpacity onPress={() => router.push('/(profile)/requestotherstojoincirclescreen')} style={styles.requestOthersButton}>
                    <Text style={styles.requestOthersButtonText}>Request Others To Join Your Circle</Text>
                </TouchableOpacity>
            </BlurView>}

            { activePrivateCircleTab === "In Your Circle" && peopleInPrivateCircle?.length === 0 && 
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'bold', fontSize: 16, color: appearanceMode.textColor}}>No people in your circle</Text>
                <TouchableOpacity onPress={() => router.push('/(profile)/requestotherstojoincirclescreen')}>
                    <Text style={{ fontFamily: 'bold', color: appearanceMode.primary, marginTop: 5, fontSize: 16}}>Request Others To Join Your Circle</Text>
                </TouchableOpacity>
            </View> }
            </>}

            { activePrivateCircleTab === "Your Requests" && 
            <>
            { peopleInYourPendingRequests && peopleInYourPendingRequests?.length > 0 && 
                <FlatList
                contentContainerStyle={{ paddingTop: 140 }}
                data={peopleInYourPendingRequests}
                keyExtractor={item => item.id.toString()}
                renderItem={({item}) => <YourRequestBox type={item.type} receiverUserData={item.receiverUserData} id={item.id} receiver_id={item.receiver_id} sender_id={item.sender_id} senderUserData={item.senderUserData} status={item.status}/>}
                />}
            </>}
            { activePrivateCircleTab === "Your Requests" && peopleInYourPendingRequests?.length === 0 &&
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'bold', fontSize: 15, color: appearanceMode.textColor}}>You Have No Pending Requests</Text>
                </View>
            }

            { activePrivateCircleTab === "Incoming Requests" && 
            <>
            { peopleInYourIncomingRequests && peopleInYourIncomingRequests?.length > 0 && 
                <FlatList
                contentContainerStyle={{ paddingTop: 140 }}
                data={peopleInYourIncomingRequests}
                keyExtractor={item => item.id.toString()}
                renderItem={({item}) => <IncomingRequestBox type={item.type} receiverUserData={item.receiverUserData} id={item.id} receiver_id={item.receiver_id} sender_id={item.sender_id} senderUserData={item.senderUserData} status={item.status}/>}
                />}
            </>}
            { activePrivateCircleTab === "Incoming Requests" && peopleInYourIncomingRequests?.length === 0 &&
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'bold', fontSize: 15, color: appearanceMode.textColor}}>You Have No Incoming Requests</Text>
                </View>
            }
        </View>
    )
}

export default PrivateCircle

