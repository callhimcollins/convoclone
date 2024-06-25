import { StyleSheet, Text, View, TextInput, Platform, FlatList, SafeAreaView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import { BlurView } from 'expo-blur'
import { userType } from '@/types'
import { supabase } from '@/lib/supabase'
import RequestUserList from './RequestUserList'

const PAGE_SIZE = 10
const RequestOthersToJoinCircle = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const styles = getStyles(appearanceMode)
    const [content, setContent] = useState('')
    const [userList, setUserList] = useState<Array<userType> | null>([])
    const [userListBySearch, setUserListBySearch] = useState<Array<userType> | null>([])
    const [currentPage, setCurrentPage] = useState(1)


    const getUsers = async () => {
        const { data, error } = await supabase
        .from('Users')
        .select('*')
        .neq('user_id', String(authenticatedUserData?.user_id))
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)
        if(data) {
            setUserList(data.map(user => ({
                id: user.id,
                user_id: user.user_id,
                name: user.name,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                bio: user.bio,
                audio: user.audio,
            })))
        }
        if(error) {
            console.log("Error fetching users from reqeust others to join circle", error.message)
        }
    }

    const getUsersBySearch = async () => {
        console.log("checking")
        const { data, error } = await supabase
        .from('Users')
        .select('*')
        .textSearch('username', content, {
            type: 'websearch',
            config: 'english'
        })
        if(data) {
            setUserListBySearch(data.map(user => ({
                id: user.id,
                user_id: user.user_id,
                name: user.name,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                bio: user.bio,
                audio: user.audio,
            })))
        }
        if(error) {
            console.log("Error fetching users from reqeust others to join circle search", error.message)
        }
    }

    const isContentEmpty = (text:any) => {
        return !text || text.trim() === '';
      }

    const fetchMoreUsers = () => {
        setCurrentPage(prevPage => prevPage + 1)
    }

    useEffect(() => {
        getUsers()
    }, [])


    useEffect(() => {
        if(isContentEmpty(content)) {
            setUserListBySearch([])
        }
    }, [content])

    const renderHeader = () => {
        if(Platform.OS === 'android') {
            return (
                <SafeAreaView style={[styles.header, { marginTop: 30 }]}>
                    <TextInput returnKeyType="search" onSubmitEditing={getUsersBySearch} style={styles.input} placeholder='Search'/>
                </SafeAreaView>
            )
        } else {
            return (
                <BlurView intensity={80} tint={appearanceMode.name === 'light' ? 'light' : 'dark'} style={styles.header}>
                    <TextInput returnKeyType="search" onSubmitEditing={getUsersBySearch} value={content} onChangeText={(text) => setContent(text)} style={styles.input} placeholder='Search'/>
                </BlurView>
            )
        }
    }
    return (
        <View style={styles.container}>
            {renderHeader()}
            { !content && <FlatList
                data={userList}
                contentContainerStyle={{ paddingTop: 80 }}
                renderItem={({item}) => <RequestUserList id={item.id} bio={item.bio} name={item.name} username={item.username} user_id={item.user_id}/>}
                keyExtractor={(item) => item.id.toString()}
                onEndReached={fetchMoreUsers}
                onEndReachedThreshold={0.5}
            />}
            { content && <FlatList
                data={userListBySearch}
                contentContainerStyle={{ paddingTop: 80 }}
                renderItem={({item}) => <RequestUserList id={item.id} bio={item.bio} name={item.name} username={item.username} user_id={item.user_id}/>}
                keyExtractor={(item) => item.id.toString()}
                onEndReached={fetchMoreUsers}
                onEndReachedThreshold={0.5}
            />}
        </View>
    )
}

export default RequestOthersToJoinCircle

