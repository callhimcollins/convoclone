import { Text, View, FlatList } from 'react-native'
import React, { memo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { supabase } from '@/lib/supabase'
import Convo from '../Convo'
import KeepUpHeader from './KeepUpHeader'
import { Skeleton } from 'moti/skeleton'
import { convoType } from '@/types'


const KeepUp = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
    const [convoKeepUps, setConvoKeepUps] = useState<convoType[] | null>([])
    const [refreshing, setRefreshing] = useState(false)
    const [loading, setLoading] = useState(true)
    const styles = getStyles(appearanceMode)

    const getConvoKeepUps = async () => {
      const { data, error } = await supabase
      .from('convoKeepUps')
      .select('convoData')
      .eq('user_id', String(authenticatedUserData?.user_id))
      .order('dateCreated', { ascending: false })
      if(data) {
        setConvoKeepUps(data)
        setLoading(false)
      } 
      if(error) {
        console.log("Couldn't get keepups", error.message)
      }
    }

    useEffect(() => {
      getConvoKeepUps()
    }, [authenticatedUserData])


    useEffect(() => {
      const channel = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'convoKeepUps' },
        (payload) => {
          setRefreshing(true)
          if(payload.eventType === 'DELETE') {
            setConvoKeepUps((prevKeepUps) => prevKeepUps && prevKeepUps.filter(keepUp => keepUp.id !== payload.old.id)
            )
            setRefreshing(false)
          } else if(payload.eventType === 'INSERT') {
            setConvoKeepUps((prevKeepUps) => [...(prevKeepUps), payload.new])
            setRefreshing(false)
          }
        }
      )
      .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }, [])

    const renderContent = () => {
      if(convoKeepUps?.length === 0) {
        return (
          <View style={styles.noKeepUpsContainer}>
            <Text style={styles.noKeepUpsText}>You Are Not Keeping Up With Any Conversations</Text>
          </View>
        )
      } else {
        return (
          <View>
            { !loading && <FlatList
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 120, backgroundColor: appearanceMode.backgroundColor }}
              data={convoKeepUps}
              keyExtractor={(convoKeepUp) => String(convoKeepUp.convoData.id)}
              onRefresh={getConvoKeepUps}
              refreshing={refreshing}
              renderItem={({item, index}) => {
                  return (<Convo
                      user_id={item.convoData.user_id}
                      lastChat={item.convoData.lastChat}
                      convo_id={item.convoData.convo_id} 
                      dateCreated={item.convoData.dateCreated} 
                      activeInRoom={item.convoData.activeInRoom} 
                      Users={item.convoData.Users} 
                      id={item.convoData.id} 
                      audio={item.convoData.audio}
                      files={item.convoData.files} 
                      numberOfKeepUps={item.convoData.numberOfKeepUps} 
                      convoStarter={item.convoData.convoStarter}
                      dialogue={item.convoData.dialogue}
                      mediaIndex={index + .5}
                      />)}}
              />}
              {
                loading && 
                <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 10, paddingTop: 120 }}>
                  <Skeleton show height={160} width={'96%'}/>
                </View>  
              }
          </View>
        )
      }
    }

    return (
      <View style={styles.container}>
        <KeepUpHeader/>
        {renderContent()}
      </View>
    )
}

export default KeepUp

