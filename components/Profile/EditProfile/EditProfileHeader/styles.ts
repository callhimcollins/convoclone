import { Platform, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            
            position: 'absolute',
            backgroundColor: appearanceMode.backgroundTransparent,
            width: '100%',
            paddingTop: 60,
            paddingBottom: 10,
            paddingHorizontal: 17,
            overflow: 'hidden',
            zIndex: 100,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        text: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 16
        }
    })
}

export default getStyles;