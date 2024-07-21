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
            fontSize: 20,
            marginBottom: 5
        },
        textInputContainer: {
            marginTop: 10,
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 5
        },
        textInput: {
            borderWidth: 1,
            backgroundColor: appearanceMode.faint,
            width: '80%',
            padding: 15,
            borderRadius: 10,
            fontFamily: 'bold',
            color: appearanceMode.textColor
        },
        passwordsDontMatch: {
            color: '#E33629',
            fontFamily: 'bold',
            fontSize: 12
        },
        resetPasswordButton: {
            backgroundColor: 'rgba(98, 95, 224, 0.3)',
            width: '80%',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 7,
            marginTop: 15,
            borderRadius: 10
        },
        resetPasswordButtonText: {
            color: appearanceMode.primary,
            fontFamily: 'extrabold',
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

export default getStyles