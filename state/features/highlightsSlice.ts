import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    indexState: 0,
    watched: false
}

const highlightsSlice = createSlice({
    name: 'highlights',
    initialState,
    reducers: {
        increaseIndexState: (state) => {
            state.indexState += 1;
        },
        decreaseIndexState: (state) => {
            state.indexState -= 1;
        },
        setIndexState: (state, action) => {
            state.indexState = action.payload;
        }
    }
})

export const { increaseIndexState, decreaseIndexState, setIndexState } = highlightsSlice.actions;

export default highlightsSlice.reducer;