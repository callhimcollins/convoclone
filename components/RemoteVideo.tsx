import React, { ComponentProps, FC, memo, useEffect, useState } from 'react';
import { AVPlaybackStatus, Video } from 'expo-av';
import { supabase } from '@/lib/supabase';

type RemoteVideoProps = {
  path?: string | null;
  onEnd?: () => void;
} & Omit<ComponentProps<typeof Video>, 'source'>;

const RemoteVideo: FC<RemoteVideoProps> = ({ path, onEnd, ...videoProps }) => {
  const [videoSource, setVideoSource] = useState<null | { uri: string }>(null);

  const fetchVideo = async () => {
    try {
      if (path) {
        const { data } = await supabase.storage
          .from('userfiles')
          .getPublicUrl(String(path));
        if (data) {
          setVideoSource({ uri: data.publicUrl });
        } else {
          // console.log('No public URL returned');
        }
      }
    } catch (error) {
      console.log("Error fetching videos", error);
    }
  }

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      onEnd?.();
    }
  };


  useEffect(() => {
    if (!path) return;
    fetchVideo();
  }, [path]);

  return videoSource ? (
    <Video
      isLooping
      source={videoSource}
      {...videoProps}
      onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
    />
  ) : null;
}

export default memo(RemoteVideo);