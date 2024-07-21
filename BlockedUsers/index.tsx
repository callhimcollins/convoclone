import { Text, View, ScrollView } from 'react-native'
import getStyles from './styles'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import BlockedUsersHeader from './BlockedUsersHeader'
import { supabase } from '@/lib/supabase'
import BlockedUserBox from './BlockedUserBox'
import { blockedUserType } from '@/types'

const BlockedUsers: React.FC = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
    const [blockedUsers, setBlockedUsers] = useState<blockedUserType[]>([])
    const styles = getStyles(appearanceMode)

    const getBlockedUsers = async () => {
        const { data, error } = await supabase
        .from('blockedUsers')
        .select('*')
        .eq('user_id', String(authenticatedUserData?.user_id))
        .order('dateCreated', { ascending: false })
        if(data) {
            const typedData: blockedUserType[] = data.map((item: any) => ({
                id: item.id,
                user_id: item.user_id,
                blockedUserID: item.blockedUserID,
                blockedUserData: item.blockedUserData,
                dateCreated: item.dateCreated,
              }));
            setBlockedUsers(typedData)
        }
    }

    useEffect(() => {
        getBlockedUsers()
    }, [])
    
    useEffect(() => {
        const channel = supabase.channel(`blockedUsers-channel-${authenticatedUserData?.user_id}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'blockedUsers' },
            (payload) => {
                if(payload.eventType === 'DELETE') {
                    setBlockedUsers(prev => prev.filter(item => item.id !== payload.old.id))
                } else if(payload.eventType === 'INSERT') {
                    setBlockedUsers(prev => [payload.new, ...prev])
                }
            }
        ).subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [])
    
    return (
        <View>
            <BlockedUsersHeader/>
            { blockedUsers.length > 0 && <ScrollView contentContainerStyle={{ paddingTop: 120 }}>
                {
                    blockedUsers.map((item, index) => {
                        return (
                            <BlockedUserBox id={item.id} key={index} user_id={item.user_id} blockedUserData={item.blockedUserData} blockedUserID={item.blockedUserID}/>
                        )
                    })
                }
            </ScrollView>}

            { blockedUsers.length === 0 && 
            <View style={styles.noblockedUsersContainer}>
                <Text style={styles.noblockedUsersText}>No blocked users</Text>
            </View>
            }
        </View>
    )
}

export default BlockedUsers

