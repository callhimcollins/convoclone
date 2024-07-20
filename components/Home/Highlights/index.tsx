import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View, ScrollView, Dimensions } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { router } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ResizeMode } from "expo-av";
import { VisibilityAwareView } from "react-native-visibility-aware-view";

import { RootState } from "@/state/store";
import { getStyles } from "./styles";
import { highlightsType2, userType } from "@/types";
import ExternalInputBox from "@/components/ExternalInputBox";
import RemoteImage from "@/components/RemoteImage";
import RemoteVideo from "@/components/RemoteVideo";
import { supabase } from "@/lib/supabase";

import {
  decreaseIndexState,
  increaseIndexState,
  setIndexState,
} from "@/state/features/highlightsSlice";
import {
  pauseVideo,
  playVideo,
  togglePlayPause,
} from "@/state/features/mediaSlice";
import { getUserData } from "@/state/features/userSlice";
import { getConvoForChat } from "@/state/features/chatSlice";
import { setSystemNotificationData, setSystemNotificationState } from "@/state/features/notificationSlice";

type Timeout = ReturnType<typeof setTimeout>;
interface HighlightProps {
  highLightUsers: Array<userType>;
  highlight: highlightsType2;
}

const Highlights = ({ highLightUsers, highlight }: HighlightProps) => {
  const dispatch = useDispatch();
  const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode);
  const activeHighlight = useSelector((state: RootState) => state.highlights.indexState);
  const experienceCheckState = useSelector((state: RootState) => state.user.experienceCheckState);
  const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData);
  const isPlaying = useSelector((state: RootState) => state.media.playState);

  const [input, setInput] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  const timeoutRef = useRef<Timeout | null>(null);
  const timeOutRefHighlight = useRef<Timeout | null>(null);
  const scrollViewRef = useAnimatedRef<ScrollView>();

  const styles = getStyles(appearanceMode);
  const visibleActiveValue = useSharedValue(1);
  const visibleInactiveValue = useSharedValue(1);
  const activeTab = useSharedValue<number>(0);

  const itemWidth = 75;
  const screenWidth = Dimensions.get("window").width;

  const convoID = highlight?.convo_id;

  const chatData = useMemo(() => ({
    convo_id: convoID,
    user_id: authenticatedUserData?.user_id,
    content: input,
    files: null,
    audio: null,
    replyChat: null,
  }), [convoID, authenticatedUserData, input]);

  // Animated styles
  const inActiveAnimatedStyles = useAnimatedStyle(() => ({
    opacity: visibleInactiveValue.value,
    zIndex: 100,
  }));

  const activeAnimatedStyles = useAnimatedStyle(() => ({
    opacity: visibleActiveValue.value,
    zIndex: 100,
  }));

  // Timeout functions
  const startTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      visibleInactiveValue.value = withTiming(0, { duration: 500 });
      visibleActiveValue.value = withTiming(0.7, { duration: 500 });
    }, 2000);
  };

  const startTimeoutForHighlight = () => {
    if (timeOutRefHighlight.current) clearTimeout(timeOutRefHighlight.current);
    timeOutRefHighlight.current = setTimeout(handleNextHighlight, 5000);
  };

  // Navigation handlers
  const handleProfileNavigation = () => {
    dispatch(getUserData(highLightUsers[activeHighlight]));
    router.push({
      pathname: "/(profile)/[profileID]",
      params: { profileID: highLightUsers[activeHighlight].user_id },
    });
  };

  const handleChatNavigation = () => {
    if (!input) {
      dispatch(togglePlayPause({ index: '' }));
      dispatch(getConvoForChat(highlight.Convos));
      router.push({
        pathname: "/(chat)/[convoID]",
        params: { convoID: highlight.Convos.convo_id },
      });
    } else {
      handleSendChat();
    }
  };

  // Action handlers
  const handlePrevHighlight = () => {
    if (Number(activeHighlight) <= 0) {
      visibleInactiveValue.value = withTiming(1);
      visibleActiveValue.value = withTiming(1);
      return;
    }
    dispatch(decreaseIndexState());
    visibleInactiveValue.value = withTiming(1);
    visibleActiveValue.value = withTiming(1);
    startTimeout();
  };

  const handleNextHighlight = () => {
    if (highLightUsers) {
      if (Number(activeHighlight) >= highLightUsers.length - 1) {
        visibleInactiveValue.value = withTiming(1);
        visibleActiveValue.value = withTiming(1);
        dispatch(setIndexState(0));
        return;
      }
    }
    dispatch(increaseIndexState());
    visibleInactiveValue.value = withTiming(1);
    visibleActiveValue.value = withTiming(1);
    startTimeout();
  };

  const handleSetHighlightIndex = (index: number) => {
    if (activeHighlight === index) {
      handleActiveTab();
      return;
    }
    dispatch(setIndexState(index));
    scrollToCenter(index);
    startTimeout();
  };

  const handleActiveTab = () => {
    if (activeTab.value < 1) {
      visibleActiveValue.value = withTiming(1);
    }
    if (visibleActiveValue.value > 0.7 && activeTab.value <= 1) {
      handleProfileNavigation();
    }
    startTimeout();
  };

  const handleSendChat = async () => {
    if (input !== "" && input !== " ") {
      const { error } = await supabase.from('Chats').insert([chatData]);
      if (!error) {
        dispatch(togglePlayPause({ index: '' }));
        router.push({
          pathname: "/(chat)/[convoID]",
          params: { convoID: highlight.Convos.convo_id },
        });
      } else {
        dispatch(setSystemNotificationState(true));
        dispatch(setSystemNotificationData({ type: 'error', message: "Couldn't Send Chat" }));
      }
    }
  };

  const handleScroll = () => {
    visibleInactiveValue.value = withTiming(1);
    visibleActiveValue.value = withTiming(1);
    startTimeout();
  };

  const handleKeyPressAction = () => {
    if (timeOutRefHighlight.current) clearTimeout(timeOutRefHighlight.current);
    if (
      highlight?.Convos?.files &&
      ["mp4", "mov", "avi"].some(ext => highlight.Convos.files && String(highlight.Convos.files[0]).endsWith(ext))
    ) {
      if (input !== "") {
        dispatch(pauseVideo({ index: String(highlight.Convos.files[0]) }));
      } else {
        dispatch(playVideo({ index: String(highlight.Convos.files[0]) }));
      }
    }
  };

  // Utility functions
  const scrollToCenter = (index: number) => {
    if (highLightUsers && scrollViewRef.current) {
      const centerPosition = index * itemWidth - screenWidth / 2 + itemWidth / 2;
      scrollViewRef.current.scrollTo({ x: centerPosition, animated: true });
    }
  };

  // Effects
  useEffect(() => {
    scrollToCenter(activeHighlight);
    return () => {
      if (timeOutRefHighlight.current) clearTimeout(timeOutRefHighlight.current);
    };
  }, [highLightUsers]);

  useEffect(() => {
    startTimeout();
  }, [activeHighlight, highlight?.Convos?.files]);

  // Render functions
  const renderUserItem = (user: userType, index: number) => {
    const isActive = activeHighlight === index;
    return (
      <Animated.View key={index} style={[isActive ? activeAnimatedStyles : inActiveAnimatedStyles]}>
        <TouchableOpacity
          onPress={() => handleSetHighlightIndex(index)}
          style={isActive ? styles.highlightProfileButtonActive : styles.highlightProfileButtonInactive}
        >
          <RemoteImage
            skeletonHeight={styles.highLightUserImage.height}
            skeletonWidth={styles.highLightUserImage.width}
            path={user.profileImage}
            style={styles.highLightUserImage}
          />
          {isActive && <Text style={styles.highLightUsername}>{user?.username}</Text>}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderMedia = () => {
    const file = highlight?.Convos?.files?.[0];
    if (!file) return null;

    const isImage = ["jpg", "png", "jpeg"].some(ext => String(file).endsWith(ext));
    const isVideo = ["mp4", "mov", "avi"].some(ext => String(file).endsWith(ext));

    if (isImage) {
      return (
        <VisibilityAwareView>
          <RemoteImage
            skeletonHeight={styles.highLightUserImage.height}
            skeletonWidth={styles.highLightUserImage.width}
            path={String(file)}
            style={styles.image}
          />
        </VisibilityAwareView>
      );
    }

    if (isVideo) {
      return (
        <VisibilityAwareView
          onBecomeInvisible={() => {
            dispatch(pauseVideo({ index: String(file) }));
            if (timeOutRefHighlight.current) clearTimeout(timeOutRefHighlight.current);
          }}
          onBecomeVisible={() => {
            dispatch(playVideo({ index: String(file) }));
          }}
          minVisibleArea={0.95}
        >
          <TouchableOpacity>
            <RemoteVideo
              onEnd={handleNextHighlight}
              isLooping={false}
              shouldPlay={isPlaying?.index === String(file) && isPlaying.playState}
              resizeMode={ResizeMode.COVER}
              path={String(file)}
              style={styles.image}
            />
          </TouchableOpacity>
        </VisibilityAwareView>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { marginTop: experienceCheckState ? 20 : 120 }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Highlights of the Week</Text>
      </View>
      <Text style={styles.username}>
        @{highlight?.Convos?.Users?.username}:{" "}
        <Text style={styles.lastChat}>{highlight?.Convos?.convoStarter}</Text>
      </Text>

      <View style={styles.mediaContainer}>
        <ScrollView
          scrollEventThrottle={16}
          ref={scrollViewRef}
          onScroll={handleScroll}
          showsHorizontalScrollIndicator={false}
          horizontal
          style={styles.usersList}
        >
          {highLightUsers?.map(renderUserItem)}
        </ScrollView>
        <TouchableOpacity onPress={handlePrevHighlight} style={styles.prevHighlightButton} />
        <TouchableOpacity onPress={handleNextHighlight} style={styles.nextHighlightButton} />

        <TouchableOpacity style={styles.imageContainer} activeOpacity={0.5}>
          {renderMedia()}
        </TouchableOpacity>
      </View>

      <ExternalInputBox
        actionForKeyPress={handleKeyPressAction}
        inputValue={input}
        onChangeValue={setInput}
        action={handleChatNavigation}
        icon={<FontAwesome6 name="arrow-right-long" color="white" size={14} />}
        placeholder="Send a chat..."
      />
      <TouchableOpacity
        onPress={() => router.push("main/requesttoaddtohighlightsscreen")}
        style={styles.requestButton}
      >
        <Text style={styles.requestButtonText}>Request To Add To Highlights</Text>
      </TouchableOpacity>
      {authenticatedUserData?.username === "callhimcollins" && (
        <TouchableOpacity
          onPress={() => router.push("main/pendinghighlightrequestsscreen")}
          style={[styles.requestButton, { marginTop: 10 }]}
        >
          <Text style={styles.requestButtonText}>View Pending Highlights</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Highlights;