import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Video, ResizeMode, Audio, InterruptionModeIOS } from 'expo-av';
import { BlurView } from 'expo-blur';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { appearanceStateType } from '@/state/features/appearanceSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { playVideo, setShowFullScreen, togglePlayPause } from '@/state/features/mediaSlice';
import RemoteVideo from './RemoteVideo';
import RemoteImage from './RemoteImage';

interface GestureContext {
    translateY: number,
    translateX: number,
    [key: string]: unknown;
  }

const DEVICE_HEIGHT = Dimensions.get('window').height;
const DEVICE_WIDTH = Dimensions.get('window').width;
const MediaFullScreen = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)
    const videoRef = useRef<Video | null>(null);
    const controlVisibility = useSharedValue(0);
    const titleOpacity = useSharedValue(1);
    const videoTranslationY = useSharedValue(0);
    const videoTranslationX = useSharedValue(0);
    const isPlaying = useSelector((state: RootState) => state.media.playState)
    const dispatch = useDispatch();
    const fullScreenSource = useSelector((state:RootState) => state.media.fullScreenSource)
    const animatedControlContainerStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: controlVisibility.value }],
        }
    })

    const animatedTitleStyle = useAnimatedStyle(() => {
        return {
            opacity: titleOpacity.value,
        }
    })

    const animatedTranslationStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: videoTranslationY.value }, 
                { translateX: videoTranslationX.value }
            ],
        }
    })

    const handlePlayVideo = async () => {
        dispatch(togglePlayPause({ index: String(isPlaying?.index) }))
    };


    const showControls = () => {
        if(controlVisibility.value === 0){
            controlVisibility.value = withTiming(100)
            titleOpacity.value = withTiming(0)
        } else {
            controlVisibility.value = withTiming(0)
            titleOpacity.value = withTiming(1)
        }
    }

    const closeMediaFullScreen = async () => {
        videoTranslationY.value = withTiming((DEVICE_HEIGHT))
        await changeFullMediaVisibility(false)
    }

    useEffect(() => {
        (async () => {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                playsInSilentModeIOS: true, // Allow audio to play in silent mode
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });
        })();
    }, []);

    const changeFullMediaVisibility = (show: boolean) => {
        dispatch(setShowFullScreen(show))
    }

    const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
        onStart: (event, context) => {
            context.translateY = videoTranslationY.value
        },
        onActive: (event, context) => {
            videoTranslationY.value = event.translationY + context.translateY
        },
        onEnd: async () => {
            if(Math.abs(videoTranslationY.value) > 150) {
                videoTranslationY.value = withTiming((DEVICE_HEIGHT))
                await runOnJS(changeFullMediaVisibility)(false)
            } else {
                videoTranslationX.value = withSpring(0)
                videoTranslationY.value = withSpring(0)
            }
        }
    })

    
    return (
        <GestureHandlerRootView>
            <PanGestureHandler onGestureEvent={panGestureEvent}>
                <Animated.View style={[styles.container, animatedTranslationStyle]}>
                    <Animated.View style={[animatedTitleStyle, styles.mediaHeader]}>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.mediaHeaderText}>{fullScreenSource?.convoStarter}</Text>
                        <TouchableOpacity onPress={closeMediaFullScreen}>
                            <Ionicons name="close" size={38} color="white" />
                        </TouchableOpacity>
                    </Animated.View>
                    <View style={styles.mediaContainer}>
                        <TouchableOpacity onPress={showControls} activeOpacity={1}>
                        { fullScreenSource?.file.endsWith('.mp4') ? (<RemoteVideo
                            style={styles.media}
                            resizeMode={ResizeMode.CONTAIN}
                            path={fullScreenSource?.file}
                            shouldPlay={isPlaying?.playState}
                            isLooping
                        />) : (
                            <RemoteImage
                            skeletonHeight={styles.media.height}
                            skeletonWidth={styles.media.width}
                            path={String(fullScreenSource?.file)} 
                            style={styles.media}
                            resizeMode={ResizeMode.CONTAIN}
                            />
                        )}
                        </TouchableOpacity>
                        { fullScreenSource?.file.endsWith('.mp4') && <Animated.View style={[animatedControlContainerStyle, styles.footer]}>
                            <BlurView intensity={80} style={styles.controlContainer}>
                                { !isPlaying?.playState && <TouchableOpacity onPress={handlePlayVideo}>
                                    <Image style={styles.playButtonImage} source={require('@/assets/images/play.png')}/>
                                </TouchableOpacity>}
                                { isPlaying?.playState && <TouchableOpacity onPress={handlePlayVideo}>
                                    <Image style={styles.playButtonImage} source={require('@/assets/images/pause.png')}/>
                                </TouchableOpacity>}
                            </BlurView>
                        </Animated.View>}
                    </View>
                </Animated.View>
            </PanGestureHandler>
        </GestureHandlerRootView>
    );
};

export default MediaFullScreen;

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            height: DEVICE_HEIGHT,
            width: DEVICE_WIDTH,
            backgroundColor: 'black',
        },
        mediaHeader: {
            position: 'absolute',
            width: '100%',
            top: 40,
            zIndex: 100,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 10,
        },
        mediaContainer: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        media: {
            width: DEVICE_WIDTH,
            height: DEVICE_HEIGHT,
            marginHorizontal: 10,
            borderRadius: 10,
        },
        mediaHeaderText: {
            color: 'white',
            fontFamily: 'extrabold',
            fontSize: 20,
            width: '88%',
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
        },
        controlContainer: {
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: 30,
            paddingTop: 20,
            overflow: 'hidden',
        },
        playButtonImage: {
            width: 45,
            height: 45
        }
    });
    
}