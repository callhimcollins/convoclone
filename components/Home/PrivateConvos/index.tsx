import { FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native'
import getStyles from './styles'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import PrivateConvosHeader from './PrivateConvosHeader'
import { convoType } from '@/types'
import Convo from '@/components/Convo'
import { supabase } from '@/lib/supabase'
import { Skeleton } from 'moti/skeleton'

const PrivateConvos = () => {
    const [privateConvoList, setPrivateConvoList] = useState<Array<convoType>>([])
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const [loading, setLoading] = useState(true)
    const styles = getStyles(appearanceMode)
    const getPrivateCircleConvos = async (user_id: string) => {
        const { data, error } = await supabase
        .from('Convos')
        .select('*')
        .eq('user_id', user_id)
        .eq('private', true)
        .order('dateCreated', { ascending: false })
        if(data) {
            return data
        }
        if(error) {
            console.log("Error getting private circle convos", error.message)
        }
    }

    const privateCircleUsers = async () => {
        const { data, error } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('receiver_id', String(authenticatedUserData?.user_id))
        .eq('type', 'invite')
        .eq('status', 'accepted')
        .single()
        const { data: data2, error: error2 } = await supabase
        .from('privateCircle')
        .select('*')
        .eq('sender_id', String(authenticatedUserData?.user_id))
        .eq('type', 'requesttojoin')
        .eq('status', 'accepted')
        .single()
        if(data || data2) {
            const inviteType = await getPrivateCircleConvos(data.sender_id)
            const requestType = await getPrivateCircleConvos(data2.receiver_id)
            setPrivateConvoList([...(inviteType ?? ''), ...(requestType ?? '')])
            setLoading(false)
        }
    }

    useEffect(() => {
        privateCircleUsers()
    }, [])
    return (
        <KeyboardAvoidingView style={{ backgroundColor: appearanceMode.backgroundColor }} behavior={ Platform.OS === "ios" ? "padding" : "height" }>
            <PrivateConvosHeader/>
            { privateConvoList.length > 0 && !loading && <FlatList
            contentContainerStyle={{paddingTop: 130}}
            showsVerticalScrollIndicator={false}
            data={privateConvoList}
            renderItem={({item, index}) => (
                <Convo
                link={item.link} 
                files={item.files} 
                user_id={item.user_id} 
                numberOfKeepUps={item.numberOfKeepUps} 
                convo_id={item.convo_id} 
                lastChat={item.lastChat} 
                lastUpdated={item.lastUpdated} 
                dateCreated={item.dateCreated} 
                id={item.id} 
                userData={item.userData} 
                convoStarter={item.convoStarter} 
                activeInRoom={item.activeInRoom} 
                key={index}
                />
                )}
            />}

            {privateConvoList.length === 0 && !loading &&
            <View style={styles.noConvosContainer}>
                <Text style={styles.noConvosText}>No Private Convos</Text>
            </View>
            }
            {loading && 
                <View style={{paddingTop: 130, width: '100%', alignItems: 'center'}}>
                    <Skeleton width={'90%'} height={180}/>
                </View>
            }
        </KeyboardAvoidingView>
    )
}

export default PrivateConvos

