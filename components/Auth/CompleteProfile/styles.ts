import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            paddingTop: 60,
            backgroundColor: appearanceMode.backgroundColor
        },
        headerContainer: {
            marginLeft: 15,
            gap: 5
        },
        headerText: {
            color: appearanceMode.primary,
            fontSize: 22,
            fontFamily: 'bold'
        },
        link: {
            color: appearanceMode.primary,
        },
        subHeaderText: {
            color: appearanceMode.secondary,
            fontFamily: 'extrabold',
            fontSize: 15
        },
        contentContainer: {
            paddingHorizontal: 20,
            marginTop: 40,
            gap: 40
        },
        contentTop: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around'
        },
        image: {
            width: 150,
            height: 150,
            borderRadius: 15
        },
        imageOverlayContainer: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            position: 'absolute',
            width: 150,
            height: 150,
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center'
        },
        imageOverlayText: {
            color: 'white',
            fontFamily: 'bold'
        },
        recordButton: {
            backgroundColor: appearanceMode.primary,
            paddingHorizontal: 40,
            paddingVertical: 10,
            borderRadius: 10
        },
        buttonText: {
            color: 'white',
            fontFamily: 'bold',
            fontSize: 15
        },
        bioContainer: {
            borderWidth: 1,
            borderColor: appearanceMode.faint,
            padding: 12,
            borderRadius: 15,
        },
        bioInput: {
            fontFamily: 'bold',
            color: appearanceMode.textColor
        },
        footer: {
            position: 'absolute',
            width: '100%',
            bottom: 50,
            gap: 10,
        },
        createProfileButton: {
            backgroundColor: appearanceMode.primary,
            padding: 15,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
            marginHorizontal: 20
        },
        createProfileText: {
            color: 'white',
            fontFamily: 'bold',
            fontSize: 17
        }
    })
}

export default getStyles;