import { appearanceStateType } from "@/state/features/appearanceSlice";
import { Platform, StyleSheet } from "react-native";

export const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        headerContainer: {
            position: 'absolute',
            backgroundColor: Platform.OS === 'ios' ? ( appearanceMode.name === 'dark' ? appearanceMode.backgroundTransparent : appearanceMode.backgroundColor) : appearanceMode.backgroundColor,
            width: '100%',
            paddingTop: 80,
            paddingBottom: 10,
            paddingHorizontal: 10,
            overflow: 'hidden',
            zIndex: 100,
            flexDirection: 'row'
        },
        contentContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
        },
        headerText: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 15
        }
    })
}