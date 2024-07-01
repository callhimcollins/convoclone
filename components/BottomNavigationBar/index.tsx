import { BlurView } from 'expo-blur'
import { Text, View } from '../Themed'
import getStyles from './styles'
import React, { useEffect } from 'react'
import { Image, Platform, TouchableOpacity, useColorScheme } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { FontAwesome } from '@expo/vector-icons'
import { setActiveTab, toggleConvoStarterButton } from '@/state/features/navigationSlice'
import Animated from 'react-native-reanimated'
import { getDefaultAppearance, setAppearanceManually, setDefaultAppearanceManually } from '@/state/features/appearanceSlice'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setNotificationData } from '@/state/features/notificationSlice'


const BottomNavigationBar = () => {
  const colorScheme = useColorScheme()
  const tabs = useSelector((state:RootState) => state.navigation.tabs)
  const activeTab = useSelector((state:RootState) => state.navigation.activeTab)
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const numberOfNotifications = useSelector((state:RootState) => state.notifications.numberOfNotifications)
  const notificationData = useSelector((state:RootState) => state.notifications.notificationData)
  const dispatch = useDispatch()
  const styles = getStyles(appearanceMode)

  

  useEffect(() => {
    if(activeTab.name === 'Notifications') {
      let timeoutID;
      timeoutID = setTimeout(() => {
        dispatch(setNotificationData(null))
      }, 3000)
      return () => clearTimeout(timeoutID)
    }
  }, [activeTab])
  
  const getAppearanceFromStorage = async () => {
    try {
      const value = await AsyncStorage.getItem('defaultAppearance');
      if(value === String(true)) {
        dispatch(getDefaultAppearance(colorScheme))
      } else {
        const value = await AsyncStorage.getItem('userSetAppearance')
        dispatch(setAppearanceManually(String(value)))
        dispatch(setDefaultAppearanceManually(false))
      }
    } catch (error) {
      console.error('Error retrieving value from AsyncStorage:', error);
    }
  }

  useEffect(() => {
    getAppearanceFromStorage()
  }, [colorScheme])

  
  const showConvoStarter = () => {
    dispatch(toggleConvoStarterButton())
  }

  const renderBottomNavigation = () => {
    if(Platform.OS === 'android') {
      return (
        <View style={[styles.container, { backgroundColor: appearanceMode.backgroundColor }]}>
        <View style={styles.tabContainer}>
          <View style={styles.tabs}>
            {tabs.map((tab, index) => {
              if(tab.name === activeTab.name) {
              return(
              <Animated.View key={index}>
                <TouchableOpacity style={styles.activeTab} key={index}>
                  <Image style={styles.icon} source={tab.darkModeIcon}/>
                  {activeTab.name === 'Notifications' && <Image style={styles.icon} source={tab.notificationAbsentDarkModeIcon}/>}
                  <Text style={styles.tabActiveName} key={index}>{tab.name}</Text>
                </TouchableOpacity>
              </Animated.View>
               )
              } else {
                return(
                  <Animated.View key={index}>
                  <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center' }} onPress={() => dispatch(setActiveTab(index))} key={index}>
                  { tab.name !== 'Notifications' && <Image style={styles.icon} source={appearanceMode.name === 'light' ? tab.lightModeIcon : tab.darkModeIcon}/>}
                    { tab.name === 'Notifications' && numberOfNotifications > 0 && <Image style={styles.icon} source={appearanceMode.name === 'light' ?  tab.notificationPresentLightModeIcon : tab.notificationPresentDarkModeIcon }/>}
                    { tab.name === 'Notifications' && numberOfNotifications === 0 && <Image style={styles.icon} source={appearanceMode.name === 'light' ?  tab.notificationAbsentLightModeIcon : tab.notificationAbsentDarkModeIcon }/>}
                  </TouchableOpacity>
                </Animated.View>
                )
              }
            })}
          </View>
          <TouchableOpacity onPress={showConvoStarter} style={styles.startConvoButton}>
            <FontAwesome name='paper-plane' color={'white'} size={24}/>
          </TouchableOpacity>
        </View>
      </View>
      )
    } else {
      return (
        <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark' } intensity={100} style={styles.container}>
        <View style={styles.tabContainer}>
          <View style={styles.tabs}>
            {tabs.map((tab, index) => {
              if(tab.name === activeTab.name) {
              return(
              <Animated.View key={index}>
                <TouchableOpacity style={styles.activeTab} key={index}>
                  <Image style={styles.icon} source={tab.darkModeIcon}/>
                  {activeTab.name === 'Notifications' && <Image style={styles.icon} source={tab.notificationAbsentDarkModeIcon}/>}
                  <Text style={styles.tabActiveName} key={index}>{tab.name}</Text>
                </TouchableOpacity>
              </Animated.View>
               )
              } else {
                return(
                  <Animated.View key={index}>
                  <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center' }} onPress={() => dispatch(setActiveTab(index))} key={index}>
                    { tab.name !== 'Notifications' && <Image style={styles.icon} source={appearanceMode.name === 'light' ? tab.lightModeIcon : tab.darkModeIcon}/>}
                    { tab.name === 'Notifications' && notificationData && <Image style={styles.icon} source={appearanceMode.name === 'light' ?  tab.notificationPresentLightModeIcon : tab.notificationPresentDarkModeIcon }/>}
                    { tab.name === 'Notifications' && !notificationData && <Image style={styles.icon} source={appearanceMode.name === 'light' ?  tab.notificationAbsentLightModeIcon : tab.notificationAbsentDarkModeIcon }/>}
                  </TouchableOpacity>
                </Animated.View>
                )
              }
            })}
          </View>
          <TouchableOpacity onPress={showConvoStarter} style={styles.startConvoButton}>
            <FontAwesome name='paper-plane' color={'white'} size={24}/>
          </TouchableOpacity>
        </View>
      </BlurView>
      )
    }
  }

  return (
      <>
        {renderBottomNavigation()}
      </>
  )
}

export default BottomNavigationBar

