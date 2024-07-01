import { createSlice } from "@reduxjs/toolkit";

export type appearanceStateType = {
    name: string;
    primary: string;
    secondary: string;
    backgroundColor: string;
    textColor: string;
    backgroundTransparent: string;
    faint: string;
}
const lightMode = {
    name: 'light',
    primary: '#625FE0',
    secondary: '#656565',
    backgroundColor: 'white',
    textColor: '#393939',
    backgroundTransparent: 'rgba(255, 255, 255, 0.3)',
    faint: 'rgba(57, 57, 57, 0.3)'
}

const darkMode = {
    name: 'dark',
    primary: '#625FE0',
    secondary: '#393939',
    backgroundColor: '#0E0E13',
    textColor: 'white',
    backgroundTransparent: 'rgba(0, 0, 0, 0.3)',
    faint: '#292929',
}



const initialState = {
    currentMode: darkMode,
    defaultAppearance: true
}

const appearanceSlice = createSlice({
    name: 'appearance',
    initialState,
    reducers: {
        getDefaultAppearance: (state, action) => {
            if(action.payload === 'light') {
                state.currentMode = lightMode;
            } else state.currentMode = darkMode;
        },
        setDefaultAppearance: (state) => {
            state.defaultAppearance = !state.defaultAppearance
        },
        setDefaultAppearanceManually: (state, action) => {
            state.defaultAppearance = action.payload
        },
        setAppearance: (state) => {
            if(state.currentMode.name === 'light') {
                state.currentMode = darkMode;
            } else state.currentMode = lightMode;
        },
        setAppearanceManually: (state, action) => {
            if(action.payload === 'light') {
                state.currentMode = lightMode;
            } else state.currentMode = darkMode;
        }
    }
});


export const { setAppearance, getDefaultAppearance, setDefaultAppearance, setDefaultAppearanceManually, setAppearanceManually } = appearanceSlice.actions;
export default appearanceSlice.reducer;