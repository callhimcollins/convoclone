import { createSlice } from "@reduxjs/toolkit";
import { notificationType, systemNotificationType } from "@/types";


interface InitialState {
    notificationType: string | null;
    numberOfNotifications: number;
    notificationData: notificationType | null;
    notificationTypes: string[];
    active: boolean;
    systemNotificationActive: boolean;
    systemNotificationData: systemNotificationType | null;
}

const initialState: InitialState = {
    notificationType: null,
    numberOfNotifications: 0,
    notificationData: null,
    notificationTypes: ['friend', 'convoStart', 'message', 'keepup', 'highlight', 'special', 'reply'],
    active: false,
    systemNotificationActive: false,
    systemNotificationData: null,
}

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        setNotificationState: (state, action) => {
            state.active = action.payload
        },
        setNotificationData: (state, action) => {
            state.notificationData = action.payload
            if(state.notificationData !== null) {
                state.active = true
            }
        },
        setNumberOfNotifications: (state, action) => {
            state.numberOfNotifications = Number(action.payload)
        },
        setSystemNotificationState: (state, action) => {
            state.systemNotificationActive = action.payload
        },
        setSystemNotificationData: (state, action) => {
            state.systemNotificationData = action.payload
        }
    }
});

export const { setNotificationState, setNotificationData, setNumberOfNotifications, setSystemNotificationData, setSystemNotificationState } = notificationSlice.actions;
export default notificationSlice.reducer
