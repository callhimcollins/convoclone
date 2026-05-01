import { Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { highlightsType2 } from '@/types'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import RemoteVideo from '@/components/RemoteVideo'
import RemoteImage from '@/components/RemoteImage'
import { supabase } from '@/lib/supabase'
import { randomUUID } from 'expo-crypto'
import {
  setFullScreenSource,
  setShowFullScreen,
  togglePlayPause,
} from '@/state/features/mediaSlice'

const PendingConvoBox = (highlight: highlightsType2) => {
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
  const dispatch = useDispatch()
  const styles = getStyles(appearanceMode)

  const file = highlight.Convos?.files?.[0]

  const isVideoFile = (file?: string | null) => {
    if (!file) return false

    const lowerFile = String(file).toLowerCase()

    return (
      lowerFile.endsWith('.mp4') ||
      lowerFile.endsWith('.mov') ||
      lowerFile.endsWith('.avi')
    )
  }

  const updateStatus = async () => {
    const { error } = await supabase
      .from('highlights')
      .update({ status: 'accepted' })
      .eq('convo_id', highlight.Convos.convo_id)

    if (!error) {
      console.log('Highlight accepted successfully')
    } else {
      console.log('Error accepting highlight: ', error.message)
    }
  }

  const handleShowFullScreen = (file: string) => {
    dispatch(setShowFullScreen(true))
    dispatch(
      setFullScreenSource({
        file,
        convoStarter: String(highlight.Convos.convoStarter),
      })
    )
    dispatch(togglePlayPause({ index: file + String(randomUUID()) }))
  }

  return (
    <View style={styles.container}>
      <Text style={styles.username}>{highlight.Convos.Users?.username}</Text>

      <View style={styles.mediaContainer}>
        {file && isVideoFile(String(file)) ? (
          <TouchableOpacity onPress={() => handleShowFullScreen(String(file))}>
            <View style={styles.mediaInfoContainer}>
              <Text style={styles.mediaInfoText}>Video</Text>
            </View>

            <RemoteVideo resizeMode="cover" style={styles.media} path={String(file)} />
          </TouchableOpacity>
        ) : (
          <View>
            {file && <RemoteImage style={styles.media} path={String(file)} />}
          </View>
        )}
      </View>

      <Text style={styles.convoStarter}>{highlight.Convos.convoStarter}</Text>

      <TouchableOpacity onPress={updateStatus} style={styles.acceptButton}>
        <Text style={styles.statusText}>Accept</Text>
      </TouchableOpacity>
    </View>
  )
}

export default PendingConvoBox