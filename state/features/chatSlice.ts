import { createSlice } from "@reduxjs/toolkit";
import { convoType } from "@/types";

const initialState:any = {
    convo: null,
    lastChat: null,
    replyChat: null,
    scrollToID: null,
    itemHeights: {},
    showModal: false,
    modalData: null,
    userCache: {}
}

const chatSlice = createSlice({
    name: 'chats',
    initialState,
    reducers: {
        getConvoForChat: (state, action) => {
            state.convo = action.payload;
        },
        updateLastChat: (state, action) => {
            state.lastChat = action.payload;
        },
        setReplyChat: (state, action) => {
            state.replyChat = action.payload;
        },
        setShowModal: (state, action) => {
            state.showModal = action.payload
        },
        setModalData: (state, action) => {
            state.modalData = action.payload
        },
        addToUserCache: (state, action) => {
            state.userCache =  {...state.userCache, ...action.payload}
        }
    }
})


export const { getConvoForChat, updateLastChat, setReplyChat, setModalData, setShowModal, addToUserCache } = chatSlice.actions;
export default chatSlice.reducer