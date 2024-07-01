import { Platform, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            position: 'absolute',
            backgroundColor: Platform.OS === 'ios'? appearanceMode.backgroundTransparent : appearanceMode.backgroundColor,
            width: '100%',
            paddingTop: 80,
            zIndex: 100,
            justifyContent: 'center',
            alignItems: 'center'
        },
        textInput: {
            borderWidth: .5,
            borderColor: '#4C4C4C',
            width: '95%',
            padding: 11,
            marginBottom: 10,
            borderRadius: 20,
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            textAlign: 'center'
        }
    })
}

export default getStyles;