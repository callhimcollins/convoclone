import React, { ComponentProps, useEffect, useState } from 'react'
import { Image } from 'expo-image'
import { supabase } from '@/lib/supabase'
import { Skeleton } from 'moti/skeleton'

type RemoteImageProps = {
  path?: string | null
  fallback?: string
  skeletonHeight?: number
  skeletonWidth?: number
} & Omit<ComponentProps<typeof Image>, 'source'>

const RemoteImage = ({
  path,
  fallback,
  skeletonHeight,
  skeletonWidth,
  ...imageProps
}: RemoteImageProps) => {
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

        const { data } = supabase.storage
          .from('userfiles')
          .getPublicUrl(path)

        if (data?.publicUrl && isMounted) {
          setImageUri(data.publicUrl)
        }
      } catch (error) {
        console.error('Error getting image URL:', error)
        setImageUri(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    getImageUrl()

    return () => {
      isMounted = false
    }
  }, [path])

  const source = imageUri || fallback

  if (isLoading) {
    return <Skeleton height={skeletonHeight} width={skeletonWidth} show />
  }

  if (!source) {
    return null
  }

  return (
    <Image
      source={{ uri: source }}
      contentFit="cover"
      cachePolicy="disk"
      {...imageProps}
    />
  )
}

export default RemoteImage