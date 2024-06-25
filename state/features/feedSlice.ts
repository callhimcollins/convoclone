import { createSlice } from "@reduxjs/toolkit";

const initialState:any = {
    feed: [],
    activeUsers: null
}

const feedSlice = createSlice({
    name: 'feed',
    initialState: initialState,
    reducers: {
        setActiveUsers: (state, action) => {
            state.activeUsers = action.payload
        },
        setFeed: (state, action) => {
            state.feed = action.payload
        },
        pushToList: (state, action) => {
            state.feed.push(action.payload)
        }
    }
})


export const { setActiveUsers, setFeed, pushToList } = feedSlice.actions;
export default feedSlice.reducer;