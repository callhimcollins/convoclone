import { appearanceStateType } from "@/state/features/appearanceSlice";
import { StyleSheet } from "react-native";


const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: appearanceMode.backgroundColor
        },
        header: {
            marginTop: 80,
            marginLeft: 20,
        },
        headerText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 16
        },
        mediaContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 20,
            marginTop: 20,
            height: 400,
            borderStyle: 'dotted',
            borderColor: appearanceMode.faint,
            borderWidth: 5,
            borderRadius: 30,
        },
        mediaButton: {
            width: '100%',
            height: 400,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 30,
        },
        inputContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 20,
            marginTop: 20,
            gap: 15
        },
        textInput: {
            backgroundColor: appearanceMode.faint,
            width: '100%',
            height: 50,
            borderRadius: 10,
            padding: 10,
            color: appearanceMode.textColor,
        },
        footer: {
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20
        },
        createButton: {
            backgroundColor: appearanceMode.primary,
            padding: 15,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
        },
        createButtonText: {
            color: 'white',
            fontFamily: 'extrabold',
            fontSize: 15
        },
        mediaImage: {
            width: '100%',
            height: 400,
            borderRadius: 30
        }
    })
}

export default getStyles