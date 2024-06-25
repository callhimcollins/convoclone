import { Platform, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            position: 'absolute',
            width: '100%',
            zIndex: 100,
            overflow: 'hidden',
            backgroundColor: Platform.OS === 'ios' ? appearanceMode.backgroundTransparent : appearanceMode.backgroundColor,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 70,
            paddingBottom: 10,
        },
        headerText: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 15
        }
    })
}

export default getStyles