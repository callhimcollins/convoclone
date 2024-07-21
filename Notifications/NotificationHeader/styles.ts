import { Platform, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            position: 'absolute',
            backgroundColor: Platform.OS === 'ios' ? appearanceMode.backgroundTransparent : appearanceMode.backgroundColor,
            width: '100%',
            paddingTop: 80,
            paddingBottom: 10,
            zIndex: 100,
            justifyContent: 'center',
            alignItems: 'center'
        },
        headerText: {
            color: appearanceMode.textColor,
            fontSize: 16,
            fontWeight: 'bold'
        }
    })
}

export default getStyles;