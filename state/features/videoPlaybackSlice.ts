import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isVisible: false,
    postIndex: null
};

const videoPlaybackSlice = createSlice({
  name: 'videoPlayback',
  initialState,
  reducers: {
    setIsVisible: (state, action) => {
        state.isVisible = action.payload
    },
    setPostIndex: (state, action) => {
        state.postIndex = action.payload
    }
  },
});

export const { setIsVisible, setPostIndex } = videoPlaybackSlice.actions;
export default videoPlaybackSlice.reducer;