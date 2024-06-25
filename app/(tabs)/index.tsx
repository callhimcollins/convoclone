import { StyleSheet, View } from 'react-native'
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
import { router } from 'expo-router'
import { setAuthenticatedUserData, setAuthenticatedUserID, setExperienceCheckState } from '@/state/features/userSlice'
import NotificationPopUp from '@/components/Notifications/NotificationPopUp'
import { setNotificationData, setNumberOfNotifications } from '@/state/features/notificationSlice'
import SystemNotification from '@/components/Notifications/SystemNotifications'
const TabLayoutScreen = (session: Session) => {
  const activeTab = useSelector((state:RootState) => state.navigation.activeTab)
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const convoStarterStater = useSelector((state:RootState) => state.navigation.convoStarter)
  const authenticatedUserData = useSelector((state:RootState) => state.user.authenticatedUserData)
  const sessionChecked = useRef(false)
  const dispatch = useDispatch()
  let timeoutID: Number | undefined;



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
      .eq('id', String(data.id))
      .single()
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

  return (
    <View style={[styles.container, { backgroundColor: appearanceMode.backgroundColor }]}>
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
  }
})