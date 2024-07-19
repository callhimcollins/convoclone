import { Platform, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            position: 'absolute',
            zIndex: 200,
            width: '100%',
            paddingTop: 60,
            alignItems: 'center',
            paddingBottom: 5,
            backgroundColor: Platform.OS === 'ios'? appearanceMode.backgroundTransparent : appearanceMode.backgroundColor,
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
