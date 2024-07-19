import { fileType } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

interface StartConvoStateType {
    files: fileType[],
    fileUploading: boolean,
    private: boolean,
    dialogue: boolean,
}

const initialState: StartConvoStateType = {
    files: [],
    fileUploading: false,
    private: false,
    dialogue: false,
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
        removeFile: (state, action) => {
            state.files = state.files.filter(file => file.assetId !== action.payload)
        },
        setPrivate: (state, action) => {
            state.private = action.payload
        },
        setDialogue: (state, action) => {
            state.dialogue = action.payload
        }
    }
});


export const { setFiles, emptyFiles, setFileUploading, setPrivate, setDialogue, removeFile } = startConvoSlice.actions;
export default startConvoSlice.reducer;
