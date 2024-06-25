import { StyleSheet, View, ScrollView, FlatList } from 'react-native'
import React, { memo, useEffect, useState } from 'react'
import { appearanceStateType } from '@/state/features/appearanceSlice'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import SearchHeader from './SearchHeader'
import ProfileCard from '../Profile/ProfileCard'
import users from '@/assets/data/users'
import { supabase } from '@/lib/supabase'
import { convoType, userType } from '@/types'
import Convo from '../Convo'

const Search = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)
    const [search, setSearch] = useState('')
    const [convoResults, setConvoResults] = useState<convoType[]>([])
    const [usersResults, setUsersResults] = useState<userType[]>([])

    const getSearch = async () => {
        const { data: convoData, error: convoSearchError } = await supabase
        .from('Convos')
        .select()
        .textSearch('convoStarter', `${search}`, {
            type: 'websearch',
            config: 'english'
        })
        if(convoData) {
            setConvoResults(convoData)
        }
        if(convoSearchError) {
            console.log(convoSearchError.message)
        }


        const { data: userData, error: userSearchError } = await supabase
        .from('Users')
        .select()
        .textSearch('name', `${search}`, {
            type: 'websearch',
            config: 'english'
        })
        if(userData) {
            setUsersResults(userData)
        }
        if(userSearchError) {
            console.log(userSearchError.message)
        }
    }

    useEffect(() =>{
        getSearch()
    }, [search])


    return (
        <View style={styles.container}>
            <SearchHeader searchValue={search} searchFuntion={(value) => setSearch(value)}/>
            { search && <FlatList
            data={convoResults}
            contentContainerStyle={{ paddingTop: usersResults.length !== 0 ? 0 : 120 }}
            ListHeaderComponent={() => {
                if(usersResults.length !== 0) {
                return <ScrollView horizontal contentContainerStyle={{ paddingTop: 120, width: '100%', height: 290 }}>
                <View style={{ flexDirection: 'row', padding: 10 }}>
                    {
                        usersResults.map((user, index) => (
                            <ProfileCard key={Number(user.id)} id={user.id} username={user.username} name={user.name} profileImage={user.profileImage}/>
                        ))
                    }
                </View>
            </ScrollView>
                }
            }}
            renderItem={({item}) => {
                return <Convo
                user_id={item.user_id}
                lastChat={item.lastChat}
                convo_id={item.convo_id} 
                dateCreated={item.dateCreated} 
                activeInRoom={item.activeInRoom} 
                userData={item.userData} 
                id={item.id} 
                files={item.files} 
                numberOfKeepUps={item.numberOfKeepUps} 
                convoStarter={item.convoStarter}
                />
            }}
            />}
            
        </View>
    )
}

export default memo(Search)

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: appearanceMode.backgroundColor
        },
        text: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 15,
            marginVertical: 15,
            marginLeft: 10
        },
        usercardContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: 5,
            justifyContent: 'space-between',
            backgroundColor: appearanceMode.backgroundColor
        }
    })
}