import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FullScreenSourceType {
  file: string;
  convoStarter: string;
}

interface PlayStateType {
  index: string;
  playState: boolean;
}

interface AudioPlaybackState {
  currentlyPlayingAudioID: string | null;
  isPaused: boolean;
}

interface MediaType {
  postIndex: number | null;
  showFullScreen: boolean;
  fullScreenSource: FullScreenSourceType | null;
  playState: PlayStateType | null;
  audioState: AudioPlaybackState;
}

const initialState: MediaType = {
  postIndex: null,
  showFullScreen: false,
  fullScreenSource: null,
  playState: null,
  audioState: { currentlyPlayingAudioID: null, isPaused: false },
};

const videoPlaybackSlice = createSlice({
  name: 'videoPlayback',
  initialState,
  reducers: {
    setPostIndex: (state, action: PayloadAction<number | null>) => {
      state.postIndex = action.payload;
    },
    setShowFullScreen: (state, action: PayloadAction<boolean>) => {
      state.showFullScreen = action.payload;
    },
    setFullScreenSource: (state, action: PayloadAction<FullScreenSourceType | null>) => {
      state.fullScreenSource = action.payload;
    },
    playVideo: (state, action: PayloadAction<{ index: string }>) => {
      if (state.playState) {
        if (state.playState.index !== action.payload.index) {
          // Pause the currently playing video
          state.playState.playState = false;
        }
      }
      // Play the new video
      state.playState = {
        index: action.payload.index,
        playState: true
      };
    },
    pauseVideo: (state, action: PayloadAction<{ index: string }>) => {
      if (state.playState && state.playState.index === action.payload.index) {
        state.playState.playState = false;
      }
    },
    togglePlayPause: (state, action: PayloadAction<{ index: string }>) => {
      if (state.playState) {
        if (state.playState.index === action.payload.index) {
          // Toggle play/pause for the current video
          state.playState.playState = !state.playState.playState;
        } else {
          // Pause the currently playing video and play the new one
          state.playState = {
            index: action.payload.index,
            playState: true
          };
        }
      } else {
        // No video is currently playing, so play the new one
        state.playState = {
          index: action.payload.index,
          playState: true
        };
      }
    },
    setAudioState: (state, action) => {
      state.audioState.currentlyPlayingAudioID = action.payload.currentlyPlayingAudioID;
      state.audioState.isPaused = action.payload.isPaused;
    }
  },
});

export const {
  setPostIndex,
  setShowFullScreen,
  setFullScreenSource,
  playVideo,
  pauseVideo,
  togglePlayPause,
  setAudioState
} = videoPlaybackSlice.actions;

export default videoPlaybackSlice.reducer;