import { Dimensions, Linking, StyleSheet, View } from 'react-native'
import BottomNavigationBar from '@/components/BottomNavigationBar'
import React, { useEffect, useRef } from 'react'
import Home from '@/components/Home'
import Search from '@/components/Search'
import KeepUp from '@/components/KeepUp'
import Notifications from '@/components/Notifications'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import BottomSheet from '@/components/BottomSheet'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import { router, useRootNavigationState } from 'expo-router'
import { getUserData, setAuthenticatedUserData, setAuthenticatedUserID } from '@/state/features/userSlice'
import NotificationPopUp from '@/components/Notifications/NotificationPopUp'
import { setNotificationData, setNumberOfNotifications } from '@/state/features/notificationSlice'
import SystemNotification from '@/components/Notifications/SystemNotifications'
import * as ExternalNotifications from 'expo-notifications';
import { getConvoForChat, setReplyChat } from '@/state/features/chatSlice'
import * as ExpoNotifications from 'expo-notifications';
import MediaFullScreen from '@/components/MediaFullScreen'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'



const DEVICE_HEIGHT = Dimensions.get('window').height
const TabLayoutScreen = (session: Session) => {
  const activeTab = useSelector((state:RootState) => state.navigation.activeTab)
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const convoStarterStater = useSelector((state:RootState) => state.navigation.convoStarter)
  const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
  const authenticatedUserID = useSelector((state:RootState) => state.user.authenticatedUserID)
  const showFullScreenMedia = useSelector((state: RootState) => state.media.showFullScreen)
  const navigationState = useRootNavigationState() as any
  const currentRoute = navigationState?.routes[navigationState.index]?.name ?? undefined;
  const sessionChecked = useRef(false)
  const dispatch = useDispatch()
  const mediaPosition = useSharedValue(DEVICE_HEIGHT)
  const mediaOpacity = useSharedValue(2)
  let timeoutID: Number | undefined;

  const animatedMediaStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: mediaPosition.value
        }
      ],
      opacity: mediaOpacity.value
    }
  })

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if(session) {
      const { data, error } = await supabase
      .from('Users')
      .select('*')
      .eq('user_id', String(session.user?.id))
      .single()
      if (error) {
        console.error('Error fetching user:', error);
      } else {
        dispatch(setAuthenticatedUserID(session.user?.id));
        dispatch(setAuthenticatedUserData(data));
      }
    } else {
      router.replace('/(auth)/LoginScreen')
    }
  }

  const authChanged = async () => {
    supabase.auth.onAuthStateChange( async (_event, session) => {
    })
  }


  const checkForNotifications = async () => {
    const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('receiver_id', String(authenticatedUserData?.user_id))
    .eq('deviceSeen', false)
    .order('dateCreated', { ascending: false })
    .limit(1)
    .single()
    if(data) {
      dispatch(setNotificationData(data))
      const { error: updateError } = await supabase
      .from('notifications')
      .update({ deviceSeen: true })
      .eq('receiver_id', String(authenticatedUserData?.user_id))
      .neq('id', data.id)
      if(!updateError) {
        console.log("Notification updated successfully")
      }
    }
  }

  const getNumberOfNotifications = async () => {
    const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('receiver_id', String(authenticatedUserData?.user_id))
    .eq('seen', false)
    if(data) {
      dispatch(setNumberOfNotifications(data.length))
    }
  }

  const setNotificationsForDeviceSeen = async () => {
    const { error: deviceSeenError } = await supabase
    .from('notifications')
    .update({ deviceSeen: true })
    .eq('receiver_id', String(authenticatedUserData?.user_id))
    if(deviceSeenError) {
    } else {
      console.log('Successfully updated notifications for device seen')
    }
  }

  const setNotificationsToSeen = async () => {
    const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('receiver_id', String(authenticatedUserData?.user_id))
    .eq('seen', false)
    
    if(data && data.length > 0) {
       const data_ids = data.map((obj) => obj.id)
       const { error: updateError } = await supabase
       .from('notifications')
       .update({ seen: true })
       .in('id', data_ids)

       if(updateError) {
        console.error('Error updating notifications:', updateError)
       } else {
        console.log('Successfully updated notifications')
       }
    } else {
      console.log("No notifications")
    }
  }

  useEffect(() => {
    getNumberOfNotifications()

    if(activeTab.name === 'Notifications') {
      timeoutID = window.setTimeout(() => {
        setNotificationsToSeen()
      }, 5000)
    }

    return () => {
      if(timeoutID) {
        clearTimeout(Number(timeoutID))
      }
    }
  }, [activeTab, dispatch])

  useEffect(() => {
    checkForNotifications()
  }, [])

  useEffect(() => {
    if(activeTab.name === 'Notifications'){
      setNotificationsForDeviceSeen()
    }
  }, [activeTab, dispatch])


  useEffect(() => {
    let timeoutId: number | null = null; // Ensure timeoutId is properly managed
    
    const channel = supabase.channel(`check-for-notifications-${authenticatedUserData?.user_id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          // Clear any existing timeout to avoid multiple pending timeouts
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          timeoutId = window.setTimeout(() => {
            checkForNotifications();
            timeoutId = null; // Reset timeoutId after execution
          }, 10);
        }
      ).subscribe();
      
      return () => {
        // Cleanup on component unmount
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      channel.unsubscribe();
    };
  }, [authenticatedUserData?.user_id]);
  
  
  useEffect(() => {
    if(!sessionChecked.current && authenticatedUserData === null) {
      checkSession()
      sessionChecked.current = true
    }
  }, [authenticatedUserData])
  
  useEffect(() => {
    authChanged()
  }, [])
  
    
    useEffect(() => {
      checkForNotifications()
    }, [authenticatedUserData?.user_id])

    useEffect(() => {
      const subscription = ExternalNotifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if(data && data.type === 'convoStart') {
          console.log("Started")
          dispatch(getConvoForChat(data.navigationData))
          router.push({
            pathname: '(chat)/[convoID]',
            params: {
              convoID: data.navigationData.convo_id
            }
          })
        } else if(data && data.type ==='reply') {
          dispatch(getConvoForChat(data.navigationData))
          dispatch(setReplyChat({
            content: data.extraData.content, 
            convo_id: data.extraData.convo_id, 
            username: data.extraData.username, 
            user_id: data.extraData.user_id
          }))
          router.push({
            pathname: '(chat)/[convoID]',
            params: {
                convoID: String(data.extraData.convo_id)
            }
          })
        } else if(data && data.type === 'profile') {
          dispatch(getUserData(data.navigationData))
          router.push({
            pathname: '(profile)/[profileID]',
            params: {
                profileID: String(data.navigationData.user_id)
            }
          })
        }
      })
    
      // Proper cleanup function
      return () => {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        }
      };
    }, [router, dispatch])

    useEffect(() => {

      const handleUrl = async (url:string) => {
        const withoutScheme = url.split('://')[1] || url
        const withoutPath = withoutScheme.split('/').pop()
        const uuid = withoutPath
  
        if (uuid && uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          const { data } = await supabase
          .from('Convos')
          .select('*')
          .eq('convo_id', uuid)
          .single()
          if(data) {
            dispatch(getConvoForChat(data))
          }
          // Navigate to the chat screen with the UUID
        } else {
          console.log('No valid UUID found in the URL')
        }
      }
  
      // Set up listener for incoming links while the app is running
      const subscription = Linking.addEventListener('url', ({ url }) => {
        handleUrl(url)
      })
  
      // Cleanup function to remove the event listener
      return () => {
        subscription.remove()
      }
    }, [router, authenticatedUserData])

    const updateBadgeCount = async () => {
      const { error } = await supabase
      .from('Users')
      .update({ badge_count: 0 })
      .eq('user_id', String(authenticatedUserData?.user_id))
      if(error) {
        console.log(error.message)
      } else {
        console.log('badge count successfully updated')
      }
    }

    useEffect(() => {
      // Reset badge count when the app is opened
      ExpoNotifications.setBadgeCountAsync(0).catch(error => {
          console.log('Failed to reset badge count:', error);
      });

      // Request permissions for notifications
      (async () => {
          const { status } = await ExpoNotifications.getPermissionsAsync();
          if (status !== 'granted') {
              console.log('Failed to get push token for push notification!');
              return;
          }
      })();

      const subscription = ExpoNotifications.addNotificationReceivedListener(notification => {
          const badge = notification.request.content.badge;
          if (badge) {
              ExpoNotifications.setBadgeCountAsync(badge).catch(error => {
                  console.log('Failed to set badge count:', error);
              });
          }
      });

      return () => subscription.remove();
  }, [authenticatedUserID]);

  useEffect(() => {
    updateBadgeCount()
  }, [authenticatedUserID])

  // Reset badge count when a notification response is received
  useEffect(() => {
      const subscription = ExpoNotifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification clicked', response);

          ExpoNotifications.setBadgeCountAsync(0).catch(error => {
              console.log('Failed to reset badge count:', error);
          });
      });

      return () => subscription.remove();
  }, []);
    
  useEffect(() => {
    if(showFullScreenMedia) {
      mediaPosition.value = withTiming(0)
    } else {
      mediaPosition.value = withTiming(DEVICE_HEIGHT)
      
    }
  }, [showFullScreenMedia])

    return (
      <View style={[styles.container, { backgroundColor: appearanceMode.backgroundColor }]}>
          { showFullScreenMedia && currentRoute !== '(profile)' && currentRoute !== '(chat)' && <Animated.View style={[styles.mediaContainer, animatedMediaStyles, { display: showFullScreenMedia ? 'flex' : 'none' }]}>
            <MediaFullScreen />
          </Animated.View>}
          <View style={styles.notificationContainer}>
            <NotificationPopUp/>
          </View>
          <View style={styles.notificationContainer}>
            <SystemNotification/>
          </View>
        <View style={{ display: activeTab.name === 'Home' ? 'flex' : 'none', flex: 1 }}>
          <Home/>
        </View>
        <View style={{ display: activeTab.name === 'Search' ? 'flex' : 'none', flex: 1 }}>
          <Search/>
        </View>
        <View style={{ display: activeTab.name === 'Keep Up' ? 'flex' : 'none', flex: 1 }}>
          <KeepUp/>
        </View>
          { activeTab.name === 'Notifications' && <Notifications/>}
        { convoStarterStater && <BottomSheet/>}
        { !convoStarterStater && <BottomNavigationBar/>}
    </View>
  )
}

export default TabLayoutScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    notificationContainer: {
      backgroundColor: 'transparent', 
      position: 'absolute', 
      width: '100%', 
      zIndex: 200, 
      borderRadius: 10
    },
    mediaContainer: {
      position: 'absolute', 
      zIndex: 500
    }
  })

