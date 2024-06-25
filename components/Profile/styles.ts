import { Dimensions, Platform, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const DEVICE_HEIGHT = Dimensions.get('window').height
const DEVICE_WIDTH = Dimensions.get('window').width
const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            backgroundColor: appearanceMode.backgroundColor,
            width: '100%'
        },
        profileDetailContainer: {
            marginHorizontal: 12,
            flexDirection: 'row'
        },
        profileImage: {
            width: 100,
            height: 100,
            borderRadius: 15
        },
        userDetailContainer: {
            justifyContent: 'space-evenly',
            marginLeft: 10,
            width: '70%'

        },
        usernameContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        usernameButtonContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        username: {
            fontFamily: 'bold',
            color: appearanceMode.textColor,
        },
        audioButton: {
            backgroundColor: appearanceMode.primary,
            padding: 7,
            marginLeft: 10,
            borderRadius: 10
        },
        keepupButton: {
            backgroundColor: appearanceMode.primary,
            paddingHorizontal: 7,
            paddingVertical: 7,
            borderRadius: 8
        },
        keepupText: {
            fontFamily: 'bold',
            color: 'white'
        },
        bioContainer: {
            width: '100%'
        },
        bio: {
            color: appearanceMode.faint,
            fontFamily: 'bold',
            fontSize: 12
        },
        tabsContainer: {
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 30,
            paddingHorizontal: 20,
        },
        activeTabButton: {
            alignItems: 'center',
        },
        activeTabText: {
            fontFamily: 'extrabold',
            color: appearanceMode.textColor,
            fontSize: 15
        },
        tabHighlighter: {
            borderBottomWidth: 3, 
            borderColor: appearanceMode.faint, 
            marginHorizontal: 20, 
            width: 50,
            marginTop: 5,
            borderRadius: 100
        },
        inactiveTabButton: {
            alignItems: 'center',
        },
        inactiveTabText: {
            fontFamily: 'bold',
            color: appearanceMode.faint,
            fontSize: 15
        },
        notificationContainer: {
            backgroundColor: 'transparent', 
              position: 'absolute', 
              width: '100%', 
              zIndex: 200, 
              borderRadius: 10
        },
        profileModalContainer: {
            zIndex: 300, 
            position: 'absolute', 
            height: DEVICE_HEIGHT, 
            width: DEVICE_WIDTH,
            backgroundColor: Platform.OS === 'android' ? appearanceMode.backgroundColor : appearanceMode.backgroundTransparent,
            borderRadius: 20
        },
        profileModal: {
            height: '100%', 
            width: '100%',
            paddingHorizontal: 5,
            alignItems: 'center',
            borderRadius: 20,
            overflow: 'hidden'
        },
        modalUsernameContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 30
        },
        modalUsername: {
            fontFamily: 'extrabold', 
            color: appearanceMode.textColor, 
            fontSize: 20
        },
        modalBio: {
            marginTop: 10, 
            fontFamily: 'extrabold', 
            color: appearanceMode.textColor,
            fontSize: 15
        },
        closeButton: {
            position: 'absolute',
            zIndex: 100,
            width: DEVICE_WIDTH,
            marginTop: 50,
            paddingVertical: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        closeBar: {
            backgroundColor: appearanceMode.textColor, 
            width: 100, 
            paddingVertical: 4, 
            borderRadius: 50
        }
    })
}

export default getStyles;