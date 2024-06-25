import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            width: '100%',
            marginBottom: 40,
            height: 450
        },
        profileBackgroundImageContainer: {
            paddingBottom: 50,
            position: 'relative',
            height: 360,
        },
        profileBackgroundImage: {
            width: '100%', 
            height: '100%', 
            position: 'absolute', 
            borderTopLeftRadius: 15, 
            borderTopRightRadius: 15
        },
        gradient: {
            position: 'absolute',
            width: '100%',
            height: '100%',
        },
        userDetailContainer: {
            position: 'absolute', 
            bottom: 70, 
            left: 12, 
            width: '100%', 
            flexDirection: 'row', 
            alignItems: 'flex-end',
        },
        profileImage: {
            width: 100, 
            height: 100, 
            borderRadius: 15, 
            marginRight: 10
        },
        usernameContainer: {
            paddingBottom: 5, 
            width: '65%', 
            gap: 5
        },
        username: {
            color: appearanceMode.textColor, 
            fontFamily: 'extrabold', 
            fontSize: 20
        },
        bio: {
            color: appearanceMode.textColor, 
            fontFamily: 'bold', 
            fontSize: 12
        },
        linkContainer: {
            backgroundColor: "rgba(57, 57, 57, 0.3)", 
            justifyContent: 'center', 
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 7,
            flexDirection: 'row',
            gap: 10
        },
        linkText: {
            color: appearanceMode.secondary, 
            fontFamily: 'extrabold'
        },
        actionContainer: {
            alignItems: 'center', 
            position: 'absolute', 
            bottom: 0, 
            width: '100%', 
            flexDirection: 'row',
            paddingHorizontal: 30,
        },
        tabContainer: {
            backgroundColor: "rgba(57, 57, 57, 0.3)", 
            paddingHorizontal: 20, 
            paddingVertical: 12, 
            width: '50%', 
            borderRadius: 10 , 
            flexDirection: 'row', 
            justifyContent: 'space-between'
        },
        keepUpButton: {
            backgroundColor: 'rgba(98, 95, 224, 0.4)', 
            padding: 12, 
            borderRadius: 10
        },
        keepUpText: {
            color: '#625FE0', 
            fontFamily: 'extrabold',
        },
        dropButton: {
            borderWidth: 2,
            borderColor: 'rgba(98, 95, 224, 0.4)', 
            paddingHorizontal: 20, 
            paddingVertical: 12,
            borderRadius: 10
        },
        dropText: {
            color: appearanceMode.primary, 
            fontFamily: 'extrabold'
        },
        activeTabText: {
            fontFamily: 'extrabold',
            color: appearanceMode.textColor,
            fontSize: 15
        },
        inactiveTabText: {
            fontFamily: 'bold',
            color: '#7A7A7A',
            fontSize: 15
        },
    })
}

export default getStyles;