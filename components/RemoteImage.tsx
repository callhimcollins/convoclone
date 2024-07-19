import React, { ComponentProps, useEffect, useState } from 'react'
import FastImage from 'react-native-fast-image'
import { Image, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { Skeleton } from 'moti/skeleton'
import { CacheVideo, CacheImage } from 'react-native-media-cache'

type RemoteImageProps = {
  path?: string | null
  fallback?: string
  skeletonHeight?: number
  skeletonWidth?: number
} & Omit<ComponentProps<typeof FastImage>, 'source'>

const RemoteImage = ({ path, fallback, skeletonHeight, skeletonWidth, ...imageProps }: RemoteImageProps) => {
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!path) {
      setImageUri(null)
      setIsLoading(false)
      return
    }
    
    let isMounted = true
    const getImageUrl = async () => {
      try {
        setIsLoading(true)
        const { data } = await supabase.storage
          .from('userfiles')
          .getPublicUrl(path)

        if (data && data.publicUrl && isMounted) {
          setImageUri(data.publicUrl)
        } else {
          // console.log('No public URL returned')
        }
      } catch (error) {
        console.error('Error getting image URL:', error)
        setImageUri(null)
      } finally {
        setIsLoading(false)
      }
    }
    getImageUrl()
    return () => {
      isMounted = false
    }
  }, [path])

  if (isLoading || imageUri === null) {
    return <Skeleton height={skeletonHeight} width={skeletonWidth} show={true}/>
  }

  if (!imageUri && !fallback) {
    return null // Or return a placeholder component
  }

  return (
    <FastImage
      source={{ 
        uri: (imageUri)|| fallback,
        cache: FastImage.cacheControl.web
      }}  // Add explicit dimensions
      resizeMode="cover"
      
      {...imageProps}
    />
  )
}

export default RemoteImage