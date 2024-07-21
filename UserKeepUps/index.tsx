import { Text, View, ScrollView } from 'react-native'
import getStyles from './styles'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import UserKeepUpBox from './UserKeepUpBox'
import UserKeepUpsHeader from './UserKeepUpsHeader'
import { supabase } from '@/lib/supabase'
import { userKeepUpType } from '@/types'

const UserKeepUpsList: React.FC = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
    const [userKeepUps, setUserKeepUps] = useState<userKeepUpType[]>([])
    const styles = getStyles(appearanceMode)


    const getUserKeepUps = async () => {
        const { data } = await supabase
        .from('userKeepUps')
        .select('*')
        .eq('user_id', String(authenticatedUserData?.user_id))
        .order('dateCreated', { ascending: false })
        if(data) {
            const typedData: userKeepUpType[] = data.map((item: any) => ({
                id: item.id,
                user_id: item.user_id,
                keepup_user_id: item.keepup_user_id,
                keepUpUserData: item.keepUpUserData,
                dateCreated: item.dateCreated,
              }));
            setUserKeepUps(typedData)
        }
    }

    useEffect(() => {
        getUserKeepUps()
    }, [])



    useEffect(() => {
        const channel = supabase.channel(`custom-keepup-channel-${authenticatedUserData?.user_id}`)
        .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'userKeepUps', filter: `user_id=eq.${authenticatedUserData?.user_id}` },
            (payload) => {
                setUserKeepUps((prevKeepUps) => prevKeepUps.filter(item => item.id !== payload.old.id))
            }
        ).subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [authenticatedUserData?.user_id]) 
    
    return (
        <View>
            <UserKeepUpsHeader/>
            { userKeepUps.length > 0 && <ScrollView contentContainerStyle={{ paddingTop: 120 }}>
                {
                    userKeepUps.map((item, index) => {
                        return (
                            <UserKeepUpBox id={item.id} key={index} user_id={item.user_id} keepUpUserData={item.keepUpUserData} keepup_user_id={item.keepup_user_id} />
                        )
                    })
                }
            </ScrollView>}

            { userKeepUps.length === 0 && 
            <View style={styles.noblockedUsersContainer}>
                <Text style={styles.noblockedUsersText}>You Aren't Keeping Up with Anyone</Text>
            </View>
            }
        </View>
    )
}

export default UserKeepUpsList

