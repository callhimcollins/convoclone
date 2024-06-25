import { Image, Text, TouchableOpacity, View, ScrollView } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { highlightsType } from '@/types'
import { getStyles } from './styles'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import ExternalInputBox from '@/components/ExternalInputBox'
import { FontAwesome6 } from '@expo/vector-icons'
import Animated, { Easing, useAnimatedRef, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { decreaseIndexState, increaseIndexState, setIndexState } from '@/state/features/highlightsSlice'

type Timeout = ReturnType<typeof setTimeout>
const Highlights = ({ id, user, image, video, chats, activeInRoom, location, numberOfKeepUps, dateCreated, lastUpdated, highLightUsers}: highlightsType) => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    // const [activeHighlight, setActiveHighight] = useState<Number>(0)
    const activeHighlight = useSelector((state:RootState) => state.highlights.indexState)
    const experienceCheckState = useSelector((state: RootState) => state.user.experienceCheckState)
    const dispatch = useDispatch()
    const [input, setInput] = useState('')
    const timeoutRef = useRef<Timeout | null>(null)
    const styles = getStyles(appearanceMode)
    const visibleActiveValue = useSharedValue(1);
    const visibleInactiveValue = useSharedValue(1);
    const activeTab = useSharedValue<number>(0)
    const scrollViewRef = useAnimatedRef<ScrollView>()

    const inActiveAnimatedStyles = useAnimatedStyle(() => {
        return {
            opacity: visibleInactiveValue.value,
            zIndex: 100,
        }
    })

    const activeAnimatedStyles = useAnimatedStyle(() => {
        return {
            opacity: visibleActiveValue.value,
            zIndex: 100,
        }
    })

    const startTimeout = () => {
        if(timeoutRef.current){
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            visibleInactiveValue.value = withTiming(0, { duration: 1000, easing: Easing.linear })
            visibleActiveValue.value = withTiming(0.7, { duration: 1000, easing: Easing.linear })
        }, 3000)
    }

    const handlePrevHighlight = () => {
        if(Number(activeHighlight) <= 0) {
            visibleInactiveValue.value = withTiming(1)
            visibleActiveValue.value = withTiming(1)
            return;
        };
        dispatch(decreaseIndexState())
        visibleInactiveValue.value = withTiming(1)
        visibleActiveValue.value = withTiming(1)
        startTimeout()
    }


    const handleNextHighlight = () => {
        if(highLightUsers){
            if(Number(activeHighlight) >= highLightUsers.length - 1) {
                visibleInactiveValue.value = withTiming(1)
                visibleActiveValue.value = withTiming(1)
                return;
            } 
        }
        dispatch(increaseIndexState())
        visibleInactiveValue.value = withTiming(1)
        visibleActiveValue.value = withTiming(1)
        startTimeout()
    }

    const handleSetHighlightIndex = (index: Number) => {
        if(activeHighlight === index) {
            handleActiveTab()
            return;
        }
        dispatch(setIndexState(index))
    }


    useEffect(() => {
        startTimeout()
        return () => {
            if(timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const handleAction = () => {
        return;
    }

    const handleActiveTab = () => {
        if(activeTab.value < 1) {
            visibleActiveValue.value = withTiming(1)
        }
        startTimeout();
    }

    const handleScroll = () => {
        visibleInactiveValue.value = withTiming(1)
        visibleActiveValue.value = withTiming(1)
        startTimeout()
    }


    return (
        <View style={[styles.container, { marginTop: experienceCheckState ? 20 : 120 }]}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Highlights of the Week</Text>
                <Text style={styles.activeInRoom}>{String(activeInRoom)} active</Text>
            </View>
            <Text style={styles.username}>@{user.username}: <Text style={styles.lastChat}>this weekend at fifths was crazyy!!🔥🔥 krystin got wasted😂😂</Text></Text>

            <View style={styles.mediaContainer}>
                    <ScrollView 
                        scrollEventThrottle={16} 
                        ref={scrollViewRef}
                        onScroll={handleScroll}
                        showsHorizontalScrollIndicator={false} 
                        horizontal 
                        style={styles.usersList}>
                        { 
                             highLightUsers && highLightUsers.map((user, index) => {
                                if(activeHighlight === index) {

                                    return (
                                        <Animated.View key={index} style={[activeAnimatedStyles]}>
                                            <TouchableOpacity onPress={() => handleSetHighlightIndex(index)} style={styles.highlightProfileButtonActive} key={index}>
                                            <Image source={{ uri: user.profileImage }} style={styles.highLightUserImage}/> 
                                            <Text style={styles.highLightUsername}>{user.username}</Text>
                                            </TouchableOpacity>
                                        </Animated.View>
                                    )
                                } else return (
                                    <Animated.View key={index} style={[inActiveAnimatedStyles]}>
                                        <TouchableOpacity onPress={() => handleSetHighlightIndex(index)} style={styles.highlightProfileButtonInactive} key={index}>
                                            <Image source={{ uri: user.profileImage }} style={styles.highLightUserImage}/>
                                        </TouchableOpacity>
                                    </Animated.View>
                                )
                            })
                        }
                    </ScrollView>
                    <TouchableOpacity onPress={handlePrevHighlight} style={styles.prevHighlightButton}></TouchableOpacity>
                    <TouchableOpacity onPress={handleNextHighlight} style={styles.nextHighlightButton}/>

                <TouchableOpacity activeOpacity={.5}>
                    <Image source={{ uri: image }} style={styles.image}/>
                </TouchableOpacity>
            </View>

            <ExternalInputBox inputValue={input} onChangeValue={(text) => setInput(text)} action={() => handleAction()} icon={<FontAwesome6 name={"arrow-right-long"} color={'white'} size={14}/>} placeholder={'Send a chat...'}/>
        </View>
    )
}

export default Highlights
