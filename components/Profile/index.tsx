import { Dimensions, Linking, Platform, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import ProfileHeader from './ProfileHeader'
import ProfileFeed from './ProfileFeed'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { convoType, linkType } from '@/types'
import NotificationPopUp from '../Notifications/NotificationPopUp'
import SystemNotification from '../Notifications/SystemNotifications'
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent, ScrollView } from 'react-native-gesture-handler'
import { BlurView } from 'expo-blur'
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import UrlPreview from '../UrlPreview'
import { setSystemNotificationData, setSystemNotificationState } from '@/state/features/notificationSlice'
import { setShowProfileModal } from '@/state/features/userSlice'

interface GestureContext {
  translateY: number,
  [key: string]: unknown;
}
const DEVICE_HEIGHT = Dimensions.get('window').height
const DEVICE_WIDTH = Dimensions.get('window').width
const Profile = () => {
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
    const activeTab = useSelector((state:RootState) => state.user.activeTab)
    const showProfileModal = useSelector((state:RootState) => state.user.showProfileModal)
    const styles = getStyles(appearanceMode)
    const {profileID}  = useLocalSearchParams()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [convos, setConvos] = useState<convoType[]>()
    const dispatch = useDispatch()
    const profileModalVisibility = useSharedValue(DEVICE_HEIGHT)

    const animatedProfileModal = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: profileModalVisibility.value }]
      }
    })


    useEffect(() => {
      if(showProfileModal) {
        profileModalVisibility.value = withTiming(0, { duration: 300 })
      }
    }, [showProfileModal])


    const handleOpenLink = async (link: string) => {
      const url = link?.startsWith('https://') ? link : `https://${link}`
      const supported = await Linking.canOpenURL(url as string)

      if(supported) {
          await Linking.openURL(url as string)
      } else {
          dispatch(setSystemNotificationState(true))
          dispatch(setSystemNotificationData({ type: 'error', message: "Couldn't open link" }))
      }
  }

    const getProfileUser = async () => {
        if(profileID) {
            const { data, error } = await supabase
            .from('Users')
            .select('*')
            .eq('user_id', String(profileID))
            .single()
            if(data) {
                setUser(data)
            }
            if(error) {
                console.log(error)
            }
        }
    }

    const fetchConvos = async () => {
        if(activeTab === 'Convos') {
          const { data, error } = await supabase
          .from('Convos')
          .select('*')
          .eq('user_id', String(profileID))
          .eq('private', false)
          .order('dateCreated', { ascending: false })
          if(data) {
            setConvos(data)
          }
          if(error) {
            console.log(error)
          }
        } else if(activeTab === 'Private') {
          const { data, error } = await supabase
          .from('Convos')
          .select('*')
          .eq('user_id', String(profileID))
          .eq('private', true)
          .order('dateCreated', { ascending: false })
          if(data) {
            setConvos(data)
          }
          if(error) {
            console.log(error)
          }
        }
    }

    useEffect(() => {
        setLoading(true);
        const channel = supabase.channel('custom-ID-channel')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Convos' },
            (payload) => {
              if (payload.eventType === 'DELETE') {
                setConvos(prevConvos => prevConvos && prevConvos.filter(convo => convo.convo_id !== payload.old.convo_id));
              } else if (payload.eventType === 'INSERT') {
                setConvos(prevConvos => [payload.new, ...prevConvos]);
              }
            }
          )
          .subscribe();
    
        return () => {
          supabase.removeChannel(channel);
        };
      }, [profileID]);
    
      useEffect(() => {
        if (profileID !== authenticatedUserData?.user_id) {
          getProfileUser();
        }
      }, [profileID]);
    

      useEffect(() => {
        fetchConvos();
      }, [activeTab, dispatch])

      const closeModalPopUp = (state: boolean) => {
        dispatch(setShowProfileModal(state))
      }
    
      const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
          onStart: (event, context) => {
            context.translateY = profileModalVisibility.value
          },
          onActive: (event, context) => {
            profileModalVisibility.value = event.translationY + context.translateY
            if(profileModalVisibility.value < 0) {
              profileModalVisibility.value = withSpring(0)
            }
          },
          onEnd: () => {
            if(profileModalVisibility.value > 150) {
              profileModalVisibility.value = withTiming(DEVICE_HEIGHT, { duration: 300 })
              runOnJS(closeModalPopUp)(false)
            } else {
              profileModalVisibility.value = withSpring(0, { damping: 100,
                stiffness: 100,
                overshootClamping: false,
                restSpeedThreshold: 0.01,
                restDisplacementThreshold: 0.01,
              })
            }
          }
      })

      const renderPopUp = () => {
        if(Platform.OS === 'android') {
          return (
            <Animated.View style={[styles.profileModalContainer, animatedProfileModal]}>
              { authenticatedUserData && <View style={styles.profileModal}>
                <TouchableOpacity style={styles.closeButton}>
                  <View style={styles.closeBar}/>
                </TouchableOpacity>
                <ScrollView contentContainerStyle={{ marginTop: 80, padding: 10, width: DEVICE_WIDTH }}>
                  <View style={styles.modalUsernameContainer}>
                    <Text style={styles.modalUsername}>{authenticatedUserData.username}</Text>
                    <Text style={styles.modalBio}>{authenticatedUserData.bio}</Text>
                  </View>

                    { authenticatedUserData.links?.map((link, index) => (
                      <TouchableOpacity onPress={() => handleOpenLink(link.url)} style={{ width: 365 }} key={index}>
                        <UrlPreview url={link.url}/>
                      </TouchableOpacity>
                    )) }

                </ScrollView>
              </View>}
            </Animated.View>
          )
        } else return (
            <Animated.View style={[styles.profileModalContainer, animatedProfileModal]}>
              { authenticatedUserData && <BlurView intensity={80} tint={appearanceMode.name === 'dark' ? 'dark' : 'light'} style={styles.profileModal}>
                <TouchableOpacity style={styles.closeButton}>
                  <View style={styles.closeBar}/>
                </TouchableOpacity>
                <ScrollView contentContainerStyle={{ marginTop: 80, padding: 10 }}>
                  <View style={styles.modalUsernameContainer}>
                    <Text style={styles.modalUsername}>{authenticatedUserData.username}</Text>
                    <Text style={styles.modalBio}>{authenticatedUserData.bio}</Text>
                  </View>

                    { authenticatedUserData.links?.map((link, index) => (
                      <TouchableOpacity onPress={() => handleOpenLink(link.url)} style={{ width: 365 }} key={index}>
                        <UrlPreview url={link.url}/>
                      </TouchableOpacity>
                    )) }

                </ScrollView>
              </BlurView>}
            </Animated.View>
        )
      }

      return (
          <>
          { authenticatedUserData && authenticatedUserData?.user_id === profileID &&
            <GestureHandlerRootView>
              <View style={styles.container}>

              <View style={styles.notificationContainer}>
                <NotificationPopUp/>
              </View>

              <View style={styles.notificationContainer}>
                <SystemNotification/>
              </View>

              <PanGestureHandler onGestureEvent={panGestureEvent}>
                {renderPopUp()}
              </PanGestureHandler>

              <ProfileHeader backgroundProfileImage={authenticatedUserData.backgroundProfileImage}  id={authenticatedUserData.id} name={authenticatedUserData.name}/>
              <ProfileFeed links={authenticatedUserData.links} convos={convos} username={authenticatedUserData.username} bio={authenticatedUserData.bio} id={authenticatedUserData.id}/>
          </View>
          </GestureHandlerRootView>
          }
          { user && authenticatedUserData?.user_id !== profileID && 
            <GestureHandlerRootView>
              <View style={styles.container}>
                  <View style={styles.notificationContainer}>
                    <NotificationPopUp/>
                  </View>

                  <View style={styles.notificationContainer}>
                <SystemNotification/>
              </View>

              <PanGestureHandler onGestureEvent={panGestureEvent}>
                <Animated.View style={[styles.profileModalContainer, animatedProfileModal]}>
                  <BlurView intensity={80} tint={appearanceMode.name === 'dark' ? 'dark' : 'light'} style={styles.profileModal}>
                    <TouchableOpacity style={styles.closeButton}>
                      <View style={styles.closeBar}/>
                    </TouchableOpacity>
                    <ScrollView contentContainerStyle={{ marginTop: 80, padding: 10 }}>
                      <View style={styles.modalUsernameContainer}>
                        <Text style={styles.modalUsername}>{user.username}</Text>
                        <Text style={styles.modalBio}>{user.bio}</Text>
                      </View>

                        { user.links?.map((link: linkType, index:number) => (
                          <TouchableOpacity onPress={() => handleOpenLink(link.url)} style={{ width: 365 }} key={index}>
                            <UrlPreview url={link.url}/>
                          </TouchableOpacity>
                        )) }

                    </ScrollView>
                  </BlurView>
                </Animated.View>
              </PanGestureHandler>
                  <ProfileHeader id={user.id} name={user.name}/>
                  <ProfileFeed links={user.links} convos={convos} username={user.username} bio={user.bio} id={user.id}/>
              </View> 
            </GestureHandlerRootView>
          }
          </>
      )
}

export default Profile
