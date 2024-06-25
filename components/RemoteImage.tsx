import { Image } from 'react-native'
import React, { ComponentProps, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase';


type RemoteImageProps = {
    path?: string | null;
    fallback?: string;
} & Omit<ComponentProps<typeof Image>, 'source'>;


const RemoteImage = ({ path, fallback, ...imageProps }: RemoteImageProps) => {
    const [image, setImage] = useState('');
    const [fallbackImage, setFallbackImage] = useState('');

    (async () => {
        const { data, error } = await supabase.storage
        .from('files/Users/')
        .download('blankprofile.png')
        if(!error) {
            const fr = new FileReader();
            fr.readAsDataURL(data);
            fr.onload = () => {
                setFallbackImage(fr.result as string);
            }
        }
    })()

    useEffect(() => {
        if(!path) return;
        (async () => {
            setImage('');
            const { data, error } = await supabase.storage
            .from('files')
            .download(path);

            if(error) {
                console.log(error)
            }

            if(data) {
                const fr = new FileReader();
                fr.readAsDataURL(data);
                fr.onload = () => {
                    setImage(fr.result as string);
                }
            }
        })();
    }, [path])


    if(!image) {

    }


    return <Image source={{ uri: image || fallback }} {...imageProps} />
}

export default RemoteImage

