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
    userCache: {},
    contextForBotState: {},
    inputState: {},
    convoExists: null,
    chatFiles: []
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
        },
        setBotContext: (state, action) => {
            state.contextForBotState = action.payload
        },
        addToBotContext: (state, action) => {
            if (!Array.isArray(state.contextForBotState)) {
                state.contextForBotState = [];
              }
            if(state.contextForBotState.length >= 50) {
                state.contextForBotState.shift();
            }
              state.contextForBotState.push(action.payload);
        },
        addToInputState: (state, action) => {
            state.inputState =  {...state.inputState, ...action.payload}
        },
        setConvoExists: (state, action) => {
            state.convoExists = action.payload
        },
        setChatFiles: (state, action) => {
            state.chatFiles = action.payload
        }
    }
})


export const { 
    getConvoForChat, 
    updateLastChat, 
    setReplyChat, 
    setModalData, 
    setShowModal, 
    addToUserCache, 
    setBotContext, 
    addToBotContext, 
    addToInputState, 
    setConvoExists,
    setChatFiles 
} = chatSlice.actions;
export default chatSlice.reducer