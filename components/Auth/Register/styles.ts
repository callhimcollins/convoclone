import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            backgroundColor: appearanceMode.backgroundColor,
            alignItems: 'center',
            paddingTop: 150,
            width: '100%',
            flex: 1
        },
        header: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        mainText: {
            color: appearanceMode.primary,
            fontFamily: 'extrabold',
            fontSize: 25,
            marginBottom: 5
        },
        subText: {
            color: appearanceMode.secondary,
            fontFamily: 'bold',
            fontSize: 15
        },
        formContainer: {
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 15,
            gap: 10,
        },
        input: {
            backgroundColor: appearanceMode.name === 'dark' ? appearanceMode.faint : '#eeeeee',
            width: '80%',
            paddingVertical: 20,
            paddingHorizontal: 15,
            borderRadius: 10,
            color: appearanceMode.textColor,
            fontFamily: 'bold'
        },
        continueContainer: {
            width: '90%',
            alignItems: 'flex-end',
            marginTop: 30
        },
        continueButton: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        continueText: {
            color: appearanceMode.primary,
            fontFamily: 'bold',
            fontSize: 15,
        },
        navigateContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        navigateText: {
            color: appearanceMode.secondary,
            fontFamily: 'bold',
            fontSize: 15,
            marginRight: 5
        },
        navigateButtonText: {
            color: appearanceMode.primary,
            fontFamily: 'bold',
            fontSize: 15,
        },
        eulaContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            marginTop: 30,
            marginBottom: 15
        },
        eulaText: {
            color: appearanceMode.secondary,
            fontFamily: 'bold',
            fontSize: 13,
        },
        eulaButtonText: {
            color: appearanceMode.primary,
            fontFamily: 'bold',
            fontSize: 13,
        },
        footerImage: {
            width: 30,
            height: 30,
        },
        footer: {
            width: '90%',
            position: 'absolute',
            bottom: 50,
            gap: 20
        },
        appleContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: appearanceMode.name === 'dark' ? 'white' : 'black',
            padding: 8,
            borderRadius: 10
        },
        appleText: {
            color: appearanceMode.name === 'dark' ? 'black' : 'white',
            fontFamily: 'bold',
            fontSize: 15,
            marginLeft: 10
        },
        googleContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8,
            backgroundColor: appearanceMode.backgroundColor
        },
        googleText: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 15,
            marginLeft: 10
        },
        notificationContainer: {
            backgroundColor: 'transparent', 
            position: 'absolute', 
            width: '100%', 
            zIndex: 200, 
            borderRadius: 10
        }
    })
}

export default getStyles;