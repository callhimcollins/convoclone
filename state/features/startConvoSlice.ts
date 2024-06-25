import { fileType } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

interface StartConvoStateType {
    files: fileType[],
    fileUploading: boolean,
    private: boolean
}

const initialState: StartConvoStateType = {
    files: [],
    fileUploading: false,
    private: false
}

const startConvoSlice = createSlice({
    name: 'startConvo',
    initialState,
    reducers: {
        setFiles: (state, action) => {
            state.files = action.payload
        },
        emptyFiles: (state) => {
            state.files = []
        },
        setFileUploading: (state, action) => {
            state.fileUploading = action.payload
        },
        setPrivate: (state, action) => {
            state.private = action.payload
        }
    }
});


export const { setFiles, emptyFiles, setFileUploading, setPrivate } = startConvoSlice.actions;
export default startConvoSlice.reducer;

