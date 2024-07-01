import { ActivityIndicator, Image, Platform, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { getLinkPreview } from 'link-preview-js'
import axios from 'axios'
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { Skeleton } from 'moti/skeleton';
interface Metadata {
    url: string;
    title: string;
    siteName?: string;
    description?: string;
    mediaType: string;
    contentType?: string;
    images: string[];
    videos: {
      url?: string;
      secureUrl?: string;
      type?: string;
      width?: string;
      height?: string;
    }[];
  }

  const formatUrl = (url: string): string => {
    return url.startsWith('https://') ? url : `https://${url}`;
  };
const UrlPreview = ({ url }: { url: string }) => {
    const [metadata, setMetadata] = useState<Metadata | null>(null)
    const [loading, setLoading] = useState(true)
    const appearanceMode = useSelector((state:RootState) => state.appearance.currentMode)
    
    useEffect(() => {
        const fetchMetadata = async () => {
          try {
            const formattedUrl = formatUrl(url);
            const data = await getLinkPreview(formattedUrl);
            setMetadata(data);
            setLoading(false);
          } catch (error) {
            setLoading(false);
          }
        };
    
        fetchMetadata();
      }, [url]);


    if(!metadata) {
        return <View/>
    }
    return (
      <Skeleton show={loading}>
          <View style={[styles.previewContainer]}>

          {metadata && metadata.images && metadata.images.length > 0 && (
            <Image source={{ uri: metadata.images[0] }} style={styles.image}/>
          )}
          <View style={styles.right}>
              { metadata && <Text style={[styles.title, { color: appearanceMode.textColor }]}>{metadata.title}</Text>}
              { metadata && <Text numberOfLines={3} ellipsizeMode='tail' style={[styles.description, { color: appearanceMode.secondary }]}>{metadata.description}</Text>}
          </View>
        </View>
        </Skeleton>
    )
}

export default UrlPreview

const styles = StyleSheet.create({
    previewContainer: {
        width: '100%',
        borderRadius: 8,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(57, 57, 57, 0.3)'
      },
      image: {
        width: 100,
        height: 100,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
      },
      right: {
        padding: 7,
        width: '70%',
        justifyContent: 'space-around'
      },
      title: {
        fontSize: 15,
        fontFamily: 'extrabold',
      },
      description: {
        fontSize: 14,
        fontFamily: 'bold',
      },
})