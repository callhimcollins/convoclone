import { useEffect, useState, useRef } from 'react';
import { LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions, ScrollView, View, ViewProps } from 'react-native';

type ViewportHookReturn = {
  viewRef: React.RefObject<View>;
  isVisible: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export const useIsInViewport = (): ViewportHookReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const viewRef = useRef<View>(null);

  const windowHeight = useWindowDimensions().height;

  const onLayout = (event: LayoutChangeEvent) => {
    if (viewRef.current) {
      viewRef.current.measure((x, y, width, height, pageX, pageY) => {
        setIsVisible(pageY + height >= 0 && pageY <= windowHeight);
      });
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (viewRef.current) {
      viewRef.current.measure((x, y, width, height, pageX, pageY) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        setIsVisible(pageY + height - scrollY >= 0 && pageY - scrollY <= windowHeight);
      });
    }
  };

  return { viewRef, isVisible, onLayout, onScroll };
};