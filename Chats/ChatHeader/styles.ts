import { Platform, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            alignItems: 'center',
            justifyContent:'space-between',
            paddingHorizontal: 10,
            backgroundColor: Platform.OS === 'ios'? appearanceMode.backgroundTransparent : appearanceMode.backgroundColor,
            width: '100%',
            position: 'absolute',
            zIndex: 100,
            paddingTop: 45,
            paddingBottom: 10
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        },
        usernameContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10
        },
        profileImage: {
            width: 40,
            height: 40,
            borderRadius: 10,
            marginRight: 10
        },
        username: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
        },
        convoStartContainer: {
            width: '80%',
            justifyContent: 'center',
            alignItems: 'center',
        },
        footerText: {
            justifyContent: 'center',
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 13,
            // backgroundColor: 'red'
        },
    })
}

export default getStyles;