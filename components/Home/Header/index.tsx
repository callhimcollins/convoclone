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


const Header = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const authenticatedUserID = useSelector((state: RootState) => state.user.authenticatedUserID)
    const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
    const dispatch = useDispatch()
    const styles = getStyles(appearanceMode)

    const handleNavigation = () => {
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
            return <View style={[styles.headerContainer, { backgroundColor: appearanceMode.backgroundColor }]}>
                <View style={styles.contentContainer}>
                    <Image source={require(`@/assets/images/logo.png`)} style={styles.logo}/>
                    <TouchableOpacity onPress={handleNavigation}>
                        {/* <RemoteImage path={authenticatedUserData?.profileImage} style={styles.profileImage}/> */}
                        <Image source={require(`@/assets/images/blankprofile.png`)} style={styles.profileImage}/>
                    </TouchableOpacity>
                </View>
            </View>
        } else {
            return <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.headerContainer}>
                <View style={styles.contentContainer}>
                    <Image source={require(`@/assets/images/logo.png`)} style={styles.logo}/>
                    <TouchableOpacity onPress={handleNavigation}>
                        {/* <RemoteImage path={authenticatedUserData?.profileImage} style={styles.profileImage}/> */}
                        <Image source={require(`@/assets/images/blankprofile.png`)} style={styles.profileImage}/>
                    </TouchableOpacity>
                </View>
            </BlurView>
        }
    }
    
    return (
        <>
        {renderHeader()}
        </>
    )
}

export default Header

