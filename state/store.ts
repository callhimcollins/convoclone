import { configureStore } from "@reduxjs/toolkit";
import navigationReducer from "./features/navigationSlice";
import appearanceReducer from "./features/appearanceSlice";
import highlightsReducer from "./features/highlightsSlice";
import notificationReducer from "./features/notificationSlice";
import startConvoReducer from "./features/startConvoSlice";
import chatReducer from "./features/chatSlice";
import userReducer from "./features/userSlice";
import videoPlaybackReducer from './features/videoPlaybackSlice';
import feedReducer from "./features/feedSlice";
export const store = configureStore({
    reducer: {
       navigation: navigationReducer, 
       appearance: appearanceReducer,
       highlights: highlightsReducer,
       notifications: notificationReducer,
       startConvo: startConvoReducer,
       chat: chatReducer,
       user: userReducer,
       videoPlayback: videoPlaybackReducer,
       feed: feedReducer
    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;