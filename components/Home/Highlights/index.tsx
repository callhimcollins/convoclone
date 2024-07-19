import {
  Image,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { highlightsType2, userType } from "@/types";
import { getStyles } from "./styles";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import ExternalInputBox from "@/components/ExternalInputBox";
import { FontAwesome6 } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  decreaseIndexState,
  increaseIndexState,
  setIndexState,
} from "@/state/features/highlightsSlice";
import { router } from "expo-router";
import RemoteImage from "@/components/RemoteImage";
import RemoteVideo from "@/components/RemoteVideo";
import { ResizeMode } from "expo-av";
import { VisibilityAwareView } from "react-native-visibility-aware-view";
import { randomUUID } from "expo-crypto";
import {
  pauseVideo,
  playVideo,
  setFullScreenSource,
  setShowFullScreen,
  togglePlayPause,
} from "@/state/features/mediaSlice";
import { getUserData } from "@/state/features/userSlice";
import { getConvoForChat } from "@/state/features/chatSlice";
import { supabase } from "@/lib/supabase";
import { setSystemNotificationData, setSystemNotificationState } from "@/state/features/notificationSlice";

type Timeout = ReturnType<typeof setTimeout>;
interface highlightProps {
  highLightUsers: Array<userType>;
  highlight: highlightsType2;
}

const Highlights = (highlightprops: highlightProps) => {
  const appearanceMode = useSelector(
    (state: RootState) => state.appearance.currentMode
  );
  const activeHighlight = useSelector(
    (state: RootState) => state.highlights.indexState
  );
  const experienceCheckState = useSelector(
    (state: RootState) => state.user.experienceCheckState
  );
  const indexState = useSelector(
    (state: RootState) => state.highlights.indexState
  );
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const timeoutRef = useRef<Timeout | null>(null);
  const timeOutRefHighlight = useRef<Timeout | null>(null);
  const styles = getStyles(appearanceMode);
  const visibleActiveValue = useSharedValue(1);
  const visibleInactiveValue = useSharedValue(1);
  const activeTab = useSharedValue<number>(0);
  const scrollViewRef = useAnimatedRef<ScrollView>();
  const itemWidth = 75; // Adjust this according to your item width, including padding/margin
  const screenWidth = Dimensions.get("window").width;
  const authenticatedUserData = useSelector(
    (state: RootState) => state.user.authenticatedUserData
  );
  const isPlaying = useSelector((state: RootState) => state.media.playState);
  const convoID = highlightprops?.highlight?.convo_id

  const chatData = useMemo(() => ({
	convo_id: convoID,
	user_id: authenticatedUserData?.user_id,
	content:input,
	files: null,
	audio: null,
	replyChat:null,
 }), [convoID, authenticatedUserData, input])

  const inActiveAnimatedStyles = useAnimatedStyle(() => {
    return {
      opacity: visibleInactiveValue.value,
      zIndex: 100,
    };
  });

  const activeAnimatedStyles = useAnimatedStyle(() => {
    return {
      opacity: visibleActiveValue.value,
      zIndex: 100,
    };
  });

  const startTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      visibleInactiveValue.value = withTiming(0, { duration: 500 });
      visibleActiveValue.value = withTiming(0.7, { duration: 500 });
    }, 2000);
  };

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
    if (highlightprops.highLightUsers) {
      if (Number(activeHighlight) >= highlightprops.highLightUsers.length - 1) {
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

  const handleSetHighlightIndex = (index: Number) => {
    if (activeHighlight === index) {
      handleActiveTab();
      return;
    }
    dispatch(setIndexState(index));
    scrollToCenter(Number(index));
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

  const handleProfileNavigation = () => {
    dispatch(getUserData(highlightprops.highLightUsers[indexState]));
    router.push({
      pathname: "/(profile)/[profileID]",
      params: {
        profileID: highlightprops.highLightUsers[indexState].user_id,
      },
    });
  };

  const handleChatNavigation = () => {
	if(!input) {
		dispatch(togglePlayPause({ index: '' }))
		dispatch(getConvoForChat(highlightprops.highlight.Convos))
		router.push({
			pathname: "/(chat)/[convoID]",
			params: {
				convoID: highlightprops.highlight.Convos.convo_id
			}
		})
	} else {
		handleSendChat()
	}
  }

  const handleSendChat = async () => {
	if(input !== "" || input !== String(" ")) {
		const { error } = await supabase
		.from('Chats')
		.insert([chatData])
		if(!error) {
			dispatch(togglePlayPause({ index: '' }))
			router.push({
				pathname: "/(chat)/[convoID]",
				params: {
					convoID: highlightprops.highlight.Convos.convo_id
				}
			})
		} else {
			dispatch(setSystemNotificationState(true))
			dispatch(setSystemNotificationData({ type: 'error', message: "Couldn't Send Chat" }))
		}
	}
  }

  const handleScroll = () => {
    visibleInactiveValue.value = withTiming(1);
    visibleActiveValue.value = withTiming(1);
    startTimeout();
  };

  const scrollToCenter = (index: number) => {
    if (highlightprops.highLightUsers && scrollViewRef.current) {
      const totalItems = highlightprops.highLightUsers.length;
      const centerPosition =
        index * itemWidth - screenWidth / 2 + itemWidth / 2;
      scrollViewRef.current.scrollTo({ x: centerPosition, animated: true });
    }
  };

  useEffect(() => {
    scrollToCenter(activeHighlight);
    return () => {
      if (timeOutRefHighlight.current) {
        clearTimeout(timeOutRefHighlight.current);
      }
    };
  }, [highlightprops.highLightUsers]);

  const startTimeoutForHighlight = () => {
    if (timeOutRefHighlight.current) {
      clearTimeout(timeOutRefHighlight.current);
    }
    timeOutRefHighlight.current = setTimeout(() => {
      handleNextHighlight();
    }, 5000);
  };

  const handleKeyPressAction = () => {
    if (timeOutRefHighlight.current) {
      clearTimeout(timeOutRefHighlight.current);
    }
    if (
      highlightprops?.highlight?.Convos?.files &&
      (String(highlightprops.highlight?.Convos?.files[0]).endsWith(".mp4") ||
        String(highlightprops.highlight?.Convos?.files[0]).endsWith(".mov") ||
        String(highlightprops.highlight?.Convos?.files[0]).endsWith(".avi"))
    ) {
      if (input !== "") {
        dispatch(
          pauseVideo({
            index: String(highlightprops?.highlight?.Convos?.files[0]),
          })
        );
      } else {
        dispatch(
          playVideo({
            index: String(highlightprops?.highlight?.Convos?.files[0]),
          })
        );
      }
    }
  };

  useEffect(() => {
    startTimeout();
    if (
      highlightprops?.highlight?.Convos?.files &&
      !(
        String(highlightprops.highlight.Convos.files[0]).endsWith(".mp4") ||
        String(highlightprops.highlight.Convos.files[0]).endsWith(".mov") ||
        String(highlightprops.highlight.Convos.files[0]).endsWith(".avi")
      )
    ) {
      startTimeoutForHighlight();
    }
  }, [activeHighlight, highlightprops?.highlight?.Convos?.files]);

  return (
    <View
      style={[styles.container, { marginTop: experienceCheckState ? 20 : 120 }]}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Highlights of the Week</Text>
      </View>
      <Text style={styles.username}>
        @{highlightprops?.highlight?.Convos?.Users?.username}:{" "}
        <Text style={styles.lastChat}>
          {highlightprops?.highlight?.Convos?.convoStarter}
        </Text>
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
          {highlightprops?.highLightUsers &&
            highlightprops.highLightUsers.map((user, index) => {
              if (activeHighlight === index) {
                return (
                  <Animated.View key={index} style={[activeAnimatedStyles]}>
                    <TouchableOpacity
                      onPress={() => {
                        handleSetHighlightIndex(index);
                      }}
                      style={styles.highlightProfileButtonActive}
                      key={index}
                    >
                      <RemoteImage
                        skeletonHeight={styles.highLightUserImage.height}
                        skeletonWidth={styles.highLightUserImage.width}
                        path={user.profileImage}
                        style={styles.highLightUserImage}
                      />
                      <Text style={styles.highLightUsername}>
                        {user?.username}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              } else
                return (
                  <Animated.View key={index} style={[inActiveAnimatedStyles]}>
                    <TouchableOpacity
                      onPress={() => handleSetHighlightIndex(index)}
                      style={styles.highlightProfileButtonInactive}
                      key={index}
                    >
                      <RemoteImage
                        skeletonHeight={styles.highLightUserImage.height}
                        skeletonWidth={styles.highLightUserImage.width}
                        path={user?.profileImage}
                        style={styles.highLightUserImage}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                );
            })}
        </ScrollView>
        <TouchableOpacity
          onPress={handlePrevHighlight}
          style={styles.prevHighlightButton}
        ></TouchableOpacity>
        <TouchableOpacity
          onPress={handleNextHighlight}
          style={styles.nextHighlightButton}
        />

        <TouchableOpacity style={styles.imageContainer} activeOpacity={0.5}>
          {highlightprops?.highlight?.Convos?.files &&
            (String(highlightprops?.highlight?.Convos?.files[0]).endsWith(
              "jpg"
            ) ||
              String(highlightprops?.highlight?.Convos?.files[0]).endsWith(
                "png"
              ) ||
              String(highlightprops?.highlight?.Convos?.files[0]).endsWith(
                "jpeg"
              )) && (
              <VisibilityAwareView
                onBecomeInvisible={() => {
                  if (timeOutRefHighlight.current) {
                    clearTimeout(timeOutRefHighlight.current);
                  }
                }}
                onBecomeVisible={() => {
                  startTimeoutForHighlight();
                }}
              >
                <RemoteImage
                  skeletonHeight={styles.highLightUserImage.height}
                  skeletonWidth={styles.highLightUserImage.width}
                  path={String(highlightprops?.highlight?.Convos?.files[0])}
                  style={styles.image}
                />
              </VisibilityAwareView>
            )}
          {highlightprops?.highlight?.Convos?.files &&
            (String(highlightprops?.highlight?.Convos?.files[0]).endsWith(
              "mp4"
            ) ||
              String(highlightprops?.highlight?.Convos?.files[0]).endsWith(
                "mov"
              ) ||
              String(highlightprops?.highlight?.Convos?.files[0]).endsWith(
                "avi"
              )) && (
              <VisibilityAwareView
                onBecomeInvisible={() => {
                  if (highlightprops?.highlight?.Convos?.files) {
                    dispatch(
                      pauseVideo({
                        index: String(
                          highlightprops?.highlight?.Convos?.files[0]
                        ),
                      })
                    );
                  }
                  if (timeOutRefHighlight.current) {
                    clearTimeout(timeOutRefHighlight.current);
                  }
                }}
                onBecomeVisible={() => {
                  if (highlightprops?.highlight?.Convos?.files) {
                    dispatch(
                      playVideo({
                        index: String(
                          highlightprops?.highlight?.Convos?.files[0]
                        ),
                      })
                    );
                  }
                }}
                minVisibleArea={0.95}
              >
                <TouchableOpacity>
                  <RemoteVideo
                    onEnd={handleNextHighlight}
                    isLooping={false}
                    shouldPlay={
                      isPlaying?.index ===
                        String(highlightprops?.highlight?.Convos?.files[0]) &&
                      isPlaying.playState
                        ? true
                        : false
                    }
                    resizeMode={ResizeMode.COVER}
                    path={String(highlightprops?.highlight?.Convos?.files[0])}
                    style={styles.image}
                  />
                </TouchableOpacity>
              </VisibilityAwareView>
            )}
        </TouchableOpacity>
      </View>

      <ExternalInputBox
        actionForKeyPress={handleKeyPressAction}
        inputValue={input}
        onChangeValue={(text) => setInput(text)}
        action={handleChatNavigation}
        icon={
          <FontAwesome6 name={"arrow-right-long"} color={"white"} size={14} />
        }
        placeholder={"Send a chat..."}
      />
      <TouchableOpacity
        onPress={() => router.push("main/requesttoaddtohighlightsscreen")}
        style={styles.requestButton}
      >
        <Text style={styles.requestButtonText}>
          Request To Add To Highlights
        </Text>
      </TouchableOpacity>
      {authenticatedUserData &&
        authenticatedUserData.username === "callhimcollins" && (
          <TouchableOpacity
            onPress={() => router.push("main/pendinghighlightrequestsscreen")}
            style={[styles.requestButton, { marginTop: 10 }]}
          >
            <Text style={styles.requestButtonText}>
              View Pending Highlights
            </Text>
          </TouchableOpacity>
        )}
    </View>
  );
};

export default Highlights;
