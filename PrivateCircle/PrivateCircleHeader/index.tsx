import { Text, View, TouchableOpacity, Platform, SafeAreaView } from 'react-native'
import React, { useState } from 'react'
import getStyles from './styles'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { BlurView } from 'expo-blur'
import { Entypo } from '@expo/vector-icons'
import { router } from 'expo-router'
import { setActivePrivateCircleTab } from '@/state/features/navigationSlice'


const PrivateCircleHeader = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)
    const tabs = useSelector((state:RootState) => state.navigation.privateCircleTabs)
    const activeTab = useSelector((state:RootState) => state.navigation.activePrivateCircleTab)
    const dispatch = useDispatch()

    const handleActiveTab = (index: number) => {
        dispatch(setActivePrivateCircleTab(index))
    }

    const renderHeader = () => {
        if(Platform.OS === 'android') {
            return (
                <View style={styles.container}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10}}>
                        <Entypo name="chevron-left" size={26} color="white" />
                    </TouchableOpacity>
                    <View style={styles.tabContainer}>
                        {
                            tabs.map((tab, index) => {
                                if(tab === activeTab) {
                                    return (
                                    <TouchableOpacity key={index} onPress={() =>handleActiveTab(index)}>
                                        <Text style={{ fontFamily: 'extrabold', color: appearanceMode.textColor, fontSize: 15 }}>{tab}</Text>
                                    </TouchableOpacity>
                                    )
                                } else return (
                                    <TouchableOpacity key={index} onPress={() =>handleActiveTab(index)}>
                                        <Text style={{ fontFamily: 'extrabold', color: '#7A7A7A', fontSize: 15 }}>{tab}</Text>
                                    </TouchableOpacity>
                                )
                            })
                        }
                    </View>
            </View>
        )
        } else {
            return (
                <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} style={styles.container} intensity={80}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10}}>
                        <Entypo name="chevron-left" size={26} color={appearanceMode.textColor} />
                    </TouchableOpacity>
                    <View style={styles.tabContainer}>
                        {
                            tabs.map((tab, index) => {
                                if(tab === activeTab) {
                                    return (
                                    <TouchableOpacity key={index} onPress={() =>handleActiveTab(index)}>
                                        <Text style={{ fontFamily: 'extrabold', color: appearanceMode.textColor, fontSize: 15 }}>{tab}</Text>
                                    </TouchableOpacity>
                                    )
                                } else return (
                                    <TouchableOpacity key={index} onPress={() =>handleActiveTab(index)}>
                                        <Text style={{ fontFamily: 'extrabold', color: '#7A7A7A', fontSize: 15 }}>{tab}</Text>
                                    </TouchableOpacity>
                                )
                            })
                        }
                    </View>
                </BlurView>  
            )
        }
    }
    return (
        <>
            {renderHeader()}
        </>
    )
}

export default PrivateCircleHeader
