import React, {
  ComponentProps,
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { VideoView, useVideoPlayer } from 'expo-video'
import { supabase } from '@/lib/supabase'

type LegacyResizeMode = 'contain' | 'cover' | 'stretch' | 'none'

type RemoteVideoProps = {
  path?: string | null
  onEnd?: () => void
  shouldPlay?: boolean
  isLooping?: boolean
  resizeMode?: LegacyResizeMode
  style?: ComponentProps<typeof VideoView>['style']
  nativeControls?: boolean
  allowsPictureInPicture?: boolean
} & Omit<
  ComponentProps<typeof VideoView>,
  | 'player'
  | 'contentFit'
  | 'style'
  | 'nativeControls'
  | 'allowsPictureInPicture'
>

const mapResizeModeToContentFit = (
  resizeMode: LegacyResizeMode
): ComponentProps<typeof VideoView>['contentFit'] => {
  if (resizeMode === 'stretch') return 'fill'
  if (resizeMode === 'none') return 'contain'

  return resizeMode
}

const RemoteVideo: FC<RemoteVideoProps> = ({
  path,
  onEnd,
  shouldPlay = false,
  isLooping = false,
  resizeMode = 'contain',
  style,
  nativeControls = false,
  allowsPictureInPicture = false,
  ...videoProps
}) => {
  const videoSource = useMemo(() => {
    if (!path) return null

    const { data } = supabase.storage.from('userfiles').getPublicUrl(String(path))

    return data?.publicUrl ?? null
  }, [path])

  const player = useVideoPlayer(videoSource ? { uri: videoSource } : null, (p) => {
    p.loop = isLooping
  })

  const safePausePlayer = useCallback(() => {
    try {
      player?.pause()
      return true
    } catch (error) {
      console.log('RemoteVideo safePausePlayer failed:', error)
      return false
    }
  }, [player])

  const safePlayPlayer = useCallback(() => {
    try {
      player?.play()
      return true
    } catch (error) {
      console.log('RemoteVideo safePlayPlayer failed:', error)
      return false
    }
  }, [player])

  const safeReplacePlayer = useCallback(
    (source: string) => {
      try {
        player?.replace({ uri: source })
        return true
      } catch (error) {
        console.log('RemoteVideo safeReplacePlayer failed:', error)
        return false
      }
    },
    [player]
  )

  useEffect(() => {
    try {
      player.loop = isLooping
    } catch (error) {
      console.log('RemoteVideo loop update failed:', error)
    }
  }, [player, isLooping])

  useEffect(() => {
    if (!videoSource) {
      safePausePlayer()
      return
    }

    safeReplacePlayer(videoSource)
  }, [videoSource, safeReplacePlayer, safePausePlayer])

  useEffect(() => {
    if (!videoSource) return

    if (shouldPlay) {
      safePlayPlayer()
    } else {
      safePausePlayer()
    }
  }, [videoSource, shouldPlay, safePlayPlayer, safePausePlayer])

  useEffect(() => {
    let subscription: { remove: () => void } | null = null

    try {
      subscription = player.addListener('playToEnd', () => {
        onEnd?.()
      })
    } catch (error) {
      console.log('RemoteVideo addListener failed:', error)
    }

    return () => {
      try {
        subscription?.remove()
      } catch (error) {
        console.log('RemoteVideo remove listener failed:', error)
      }
    }
  }, [player, onEnd])

  useEffect(() => {
    return () => {
      safePausePlayer()
    }
  }, [safePausePlayer])

  if (!videoSource) return null

  return (
    <VideoView
      player={player}
      style={style}
      contentFit={mapResizeModeToContentFit(resizeMode)}
      nativeControls={nativeControls}
      allowsPictureInPicture={allowsPictureInPicture}
      {...videoProps}
    />
  )
}

export default memo(RemoteVideo)