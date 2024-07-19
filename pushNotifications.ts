import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './lib/supabase';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: true,
    })
})


async function sendPushNotification(expoPushToken:string, title:string, body:string, type: string, navigationData: any, extraData?: any, user_id?: string) {
    // console.log(`Sending to ${expoPushToken}...`)
    let badgeCount;
    if(user_id) {
    const { data, error } = await supabase
    .from('Users')
    .select('badge_count')
    .eq('user_id', user_id)
    .single()
    if(error) {
      console.log(error.message)
    } else {
      const currentBadgeCount = data.badge_count || 0;
      const { data:updateData, error:updateError } = await supabase
      .from('Users')
      .update({ badge_count: currentBadgeCount + 1 })
      .eq('user_id', user_id)
      .select('badge_count')
      .single()
      if(error) {
        console.log(updateError?.message)
      }
      badgeCount = updateData?.badge_count;
    }
  }

    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        badge: badgeCount,
        data: {
          type,
          navigationData,
          extraData
        },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
  }

function handleRegistrationError(errorMessage: string) {
  console.log(errorMessage)
  }

  async function registerForPushNotificationsAsync(user_id:string) {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        handleRegistrationError('Permission not granted to get push token for push notification!');
        return;
      }
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        handleRegistrationError('Project ID not found');
      }
      try {
        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        if(pushTokenString) {
          const { error } = await supabase
          .from('Users')
          .update({ pushToken: pushTokenString })
          .eq('user_id', user_id)
          .single()
          if(error) {
            console.log(error.message)
          } else {
            console.log("Successfully added")
          }
        }
        return pushTokenString;
      } catch (e: unknown) {
        handleRegistrationError(`${e}`);
      }
    } else {
      handleRegistrationError('Must use physical device for push notifications');
    }
  }
  

export { registerForPushNotificationsAsync, sendPushNotification }