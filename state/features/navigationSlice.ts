import { createSlice } from "@reduxjs/toolkit";


const tabs = [{id: 1, name: "Home", darkModeIcon: require('../../assets/images/BottomNavigationAssets/homedarkmode.png'), lightModeIcon: require('../../assets/images/BottomNavigationAssets/homelightmode.png')}, 
{id: 2, name: "Search", darkModeIcon: require('../../assets/images/BottomNavigationAssets/searchdarkmode.png'), lightModeIcon: require('../../assets/images/BottomNavigationAssets/searchlightmode.png')}, 
{id: 3, name: "Keep Up", darkModeIcon: require('../../assets/images/BottomNavigationAssets/keepupdarkmode.png'), lightModeIcon: require('../../assets/images/BottomNavigationAssets/keepuplightmode.png')},
{id: 4, name: "Notifications", notificationPresentDarkModeIcon: require('../../assets/images/BottomNavigationAssets/notificationpresentdarkmode.png'), notificationAbsentDarkModeIcon: require('../../assets/images/BottomNavigationAssets/notificationabsentdarkmode.png'), 
    notificationPresentLightModeIcon: require('../../assets/images/BottomNavigationAssets/notificationpresentlightmode.png'), notificationAbsentLightModeIcon: require('../../assets/images/BottomNavigationAssets/notificationabsentlightmode.png')
},
]

const homeTabs = ["From Earth 🌍", "From Private", "Keep Up", "Notifications"]

const privateCircleTabs = ["In Your Circle", "Incoming Requests", "Your Requests",]
const initialState = {
    numberOfNotifications: 0,
    tabs,
    privateCircleTabs,
    activeTab: tabs[0],
    activePrivateCircleTab: privateCircleTabs[0],
    convoStarter: false,
    homeTabs,
    activeHomeTab: homeTabs[0]
}

const navigationSlice = createSlice({
    name: 'navigation',
    initialState,
    reducers: {
        setActiveTab: (state, action) => {
            state.activeTab = tabs[action.payload]
        },
        toggleConvoStarterButton: (state) => {
            state.convoStarter = !state.convoStarter
        },
        setActivePrivateCircleTab: (state, action) => {
            state.activePrivateCircleTab = privateCircleTabs[action.payload]
        }
    }
})


export const { setActiveTab, toggleConvoStarterButton, setActivePrivateCircleTab } = navigationSlice.actions;
export default navigationSlice.reducer;
