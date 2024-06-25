import { Text, View, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import getStyles from './styles'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import { privateCircleType } from '@/types'
import { getUserData } from '@/state/features/userSlice'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'

const InYourCircle = ({receiver_id, sender_id, senderUserData, receiverUserData, type}: privateCircleType) => {
  const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
  const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
  const dispatch = useDispatch()
  const styles = getStyles(appearanceMode)

  const handleViewProfile = () => {
    if(type === 'invite') {
      dispatch(getUserData(receiverUserData))
      router.push({
        pathname: '(profile)/[profileID]',
        params: { profileID: receiver_id }
      })
    } else if(type === 'requesttojoin') {
      dispatch(getUserData(senderUserData))
      router.push({
        pathname: '(profile)/[profileID]',
        params: { profileID: sender_id }
      })
    }
  }


  const kickUserOutOfCircle = async () => {
    const { error } = await supabase
    .from('privateCircle')
    .delete()
    .eq('sender_id', String(sender_id))
    .eq('receiver_id', String(receiver_id))
    .single()
    if(!error) {
      if(type === 'invite') {
        console.log("User successfully kicked out")
        const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('sender_id', String(sender_id))
        .eq('receiver_id', String(receiver_id))
        .eq('type', 'invitetoprivatecircle')
        if(!error) {
          console.log("First level notification deleted")
          const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('sender_id', String(receiver_id))
          .eq('receiver_id', String(sender_id))
          .eq('type', 'invitetoprivatecircleacceptance')
          if(!error) {
            console.log("Private circle acceptance notification deleted")
          } else {
            console.log("Couldn't delete private circle acceptance notification", error.message)
          }
        } else {
          console.log("Couldn't delete private circle notification", error.message)
        }
      } else if(type === 'requesttojoin') {
        console.log("User successfully kicked out")
        const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('sender_id', String(sender_id))
        .eq('receiver_id', String(receiver_id))
        .eq('type', 'privatecircle')
        if(!error) {
          console.log("First level notification deleted")
          const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('sender_id', String(receiver_id))
          .eq('receiver_id', String(sender_id))
          .eq('type', 'privatecircleacceptance')
          if(!error) {
            console.log("Private circle acceptance notification deleted")
          } else {
            console.log("Couldn't delete private circle acceptance notification", error.message)
          }
        } else {
          console.log("Couldn't delete private circle notification", error.message)
        }
      }
    } else {
      console.log("Couldn't kick out user", error.message)
    }
  }



  return (
    <TouchableOpacity onPress={handleViewProfile} style={styles.container}>

      { type === 'requesttojoin' && <View style={styles.contentContainer}>
        <Image style={styles.profileImage} source={require('@/assets/images/blankprofile.png')}/>
        <Text style={styles.username}>{senderUserData.username}</Text>
      </View>}
      { type === 'invite' && <View style={styles.contentContainer}>
        <Image style={styles.profileImage} source={require('@/assets/images/blankprofile.png')}/>
        <Text style={styles.username}>{receiverUserData.username}</Text>
      </View>}
        <TouchableOpacity style={styles.kickOutOfCircleButton} onPress={kickUserOutOfCircle}>
          <Text style={styles.kickOutOfCircleText}>Kick Out Of Your Circle</Text>
        </TouchableOpacity>
    </TouchableOpacity>
  )
}

export default InYourCircle

