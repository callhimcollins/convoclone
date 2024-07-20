import { Image, Platform, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { userType } from '@/types'
import { BlurView } from 'expo-blur'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { getStyles } from './styles'
import { router } from 'expo-router'
import { getUserData } from '@/state/features/userSlice'
import RemoteImage from '@/components/RemoteImage'
import { togglePlayPause } from '@/state/features/mediaSlice'


const Header = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const authenticatedUserID = useSelector((state: RootState) => state.user.authenticatedUserID)
    const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
    const dispatch = useDispatch()
    const styles = getStyles(appearanceMode)

    const handleNavigation = () => {
        dispatch(togglePlayPause({ index: '' }))
        dispatch(getUserData(authenticatedUserData))
        router.push({
            pathname: '/(profile)/[profileID]',
            params: {
                profileID: String(authenticatedUserID)
            }
        })
    }

    const renderHeader = () => {
        if(Platform.OS === 'android') {
            return <View key={String(authenticatedUserData?.username)} style={[styles.headerContainer, { backgroundColor: appearanceMode.backgroundColor }]}>
                <View style={styles.contentContainer}>
                        { appearanceMode.name === 'light' && <Image source={require(`@/assets/images/applogolightmode.png`)} style={styles.logo}/>}
                        { appearanceMode.name === 'dark' && <Image source={require(`@/assets/images/applogodarkmode.png`)} style={styles.logo}/>}                    <TouchableOpacity style={styles.profileButton} onPress={handleNavigation}>
                        <RemoteImage skeletonHeight={styles.profileImage.height} skeletonWidth={styles.profileImage.width} path={`${authenticatedUserData?.username}-profileImage`} style={styles.profileImage}/>
                    </TouchableOpacity>
                </View>
            </View>
        } else {
            return (<BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.headerContainer}>
                <View style={styles.contentContainer}>
                    { appearanceMode.name === 'light' && <Image source={require(`@/assets/images/applogolightmode.png`)} style={styles.logo}/>}
                    { appearanceMode.name === 'dark' && <Image source={require(`@/assets/images/applogodarkmode.png`)} style={styles.logo}/>}
                    <TouchableOpacity style={styles.profileButton}  onPressIn={handleNavigation}>
                        <RemoteImage skeletonHeight={styles.profileImage.height} skeletonWidth={styles.profileImage.width} path={`${authenticatedUserData?.profileImage}`} style={styles.profileImage}/>
                    </TouchableOpacity>
                </View>
            </BlurView>)
        }
    }
    
    return (
        <>
        {renderHeader()}
        </>
    )
}

export default Header

