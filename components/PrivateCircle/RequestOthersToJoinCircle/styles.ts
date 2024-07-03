import { Platform, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: appearanceMode.backgroundColor,
            width: '100%',
            
        },
        header: {
            backgroundColor: Platform.OS === 'android' ? appearanceMode.backgroundColor : appearanceMode.backgroundTransparent,
            position: 'absolute',
            width: '100%',
            paddingVertical: 10,
            zIndex: 100,
            justifyContent: 'center',
            alignItems: 'center',
        },
        input: {
            width: '90%',
            paddingHorizontal: 10,
            paddingVertical: 10,
            borderRadius: 20,
            borderWidth: 1,
            textAlign: 'center',
            borderColor: appearanceMode.faint,
            color: appearanceMode.textColor,
            fontFamily: 'bold'
        }
    })
}

export default getStyles