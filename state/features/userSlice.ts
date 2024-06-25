import { userType } from "@/types";
import { createSlice } from "@reduxjs/toolkit";


interface userState {
    authenticatedUserData: userType | null;
    authenticatedUserID: number | null;
    userData: userType | null; // Assuming users[0] has a consistent type
    blockedUsersID: Array<string> | null,
    activeTab: string;
    tabs: string[],
    experienceCheckState: boolean,
    showProfileModal: boolean
}

const tabs = ['Convos', 'Private']
const initialState:userState = {
    authenticatedUserData: null,
    authenticatedUserID: null,
    userData: null,
    blockedUsersID: [],
    activeTab: tabs[0],
    tabs,
    experienceCheckState: false,
    showProfileModal: false
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        getUserData: (state, action) => {
            state.userData = action.payload;
        },
        setActiveProfileTab: (state, action) => {
            state.activeTab = tabs[action.payload]
        },
        setAuthenticatedUserID: (state, action) => {
            state.authenticatedUserID = action.payload
        },
        setAuthenticatedUserData: (state, action) => {
            state.authenticatedUserData = action.payload
        },
        setBlockedUsersID: (state, action) => {
            state.blockedUsersID = action.payload
        },
        setExperienceCheckState: (state, action) => {
            state.experienceCheckState = action.payload
        },
        setShowProfileModal: (state, action) => {
            state.showProfileModal = action.payload;
        }
    }
})

export const { getUserData, setActiveProfileTab, setAuthenticatedUserID, setAuthenticatedUserData, setBlockedUsersID, setExperienceCheckState, setShowProfileModal } = userSlice.actions;
export default userSlice.reducer;
