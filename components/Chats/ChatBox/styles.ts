import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            marginHorizontal: 10,
            borderWidth: 1,
            borderColor: appearanceMode.faint,
            padding: 10,
            borderRadius: 15,
            marginBottom: 7
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        headerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        profileImage: {
            width: 30,
            height: 30,
            borderRadius: 10
        },
        username: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            marginLeft: 7,
            fontSize: 15
        },
        headerRight: {
            flexDirection: 'row',
            alignItems: 'center',
            width: '20%',
            justifyContent: 'space-between'
        },
        replyChatContainer: {
            backgroundColor: appearanceMode.primary, 
            marginTop: 20, 
            padding: 5, 
            borderRadius: 10
        },
        replyChatTextContainer: {
            flexDirection: 'row', 
            padding: 7
        },
        replyChatSideBar: {
            width: 5, 
            paddingVertical: 5, 
            backgroundColor: 'white', 
            borderRadius: 30, 
            marginRight: 5
        },
        replyChatUsername: {
            color: 'white', 
            fontFamily: 'extrabold'
        },
        replyChatContent: {
            color: 'white', 
            fontFamily: 'bold', 
            fontSize: 13
        },
        contentContainer: {
            marginVertical: 10,
            width: '100%'
        },
        mediaContainerView: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        chat: {
            color: appearanceMode.textColor,
            width: '100%',
            fontFamily: 'semibold',
        },
        chatMedia: {
            width: 250,
            height: 350,
            marginRight: 10,
            borderRadius: 10
        },
        footer: {
            alignItems: 'flex-end',
            marginHorizontal: 10
        },
        footerText: {
            color: appearanceMode.faint,
            fontFamily: 'bold'
        },
        urlPreviewContainer: {
        }
    })
}

export default getStyles;