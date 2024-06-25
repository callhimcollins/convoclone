import React, { ComponentProps, forwardRef, useEffect, useState } from 'react';
import { Video } from 'expo-av';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';

type RemoteVideoProps = {
  path?: string | null;
} & Omit<ComponentProps<typeof Video>, 'source'>;

const RemoteVideo = forwardRef(({ path, ...videoProps }: RemoteVideoProps, ref:any) => {
  const [videoSource, setVideoSource] = useState<null | { uri: string }>(null);
  const videoIsVisible = useSelector((state:RootState) => state.videoPlayback.isVisible)

  const downloadFile = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from('files').download(filePath);

      if (error) {
        console.log('Error downloading video:', error);
      } else if (data) {
        // Generate a file path for the video
        const fileUri = `${FileSystem.cacheDirectory}/${filePath.split('/').pop()}`;

        // Convert Blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(data);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string)?.split(',')[1];

          // Write the base64 data to the file system
          await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });

          // Update state with the file URI
          setVideoSource({ uri: fileUri });
        };
      }
    } catch (error) {
      console.log('Error downloading video:', error);
    }
  };

  useEffect(() => {
    if (!path) return;
    downloadFile(path);
  }, [path]);

  return videoSource ? <Video shouldPlay={videoIsVisible} isLooping ref={ref} source={videoSource} {...videoProps} /> : null;
});

export default RemoteVideo;
