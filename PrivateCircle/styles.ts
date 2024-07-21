import { Platform, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: appearanceMode.backgroundColor
        },
        requestOthersButtonContainer: {
            position: 'absolute', 
            backgroundColor: Platform.OS === 'android' ? appearanceMode.primary : 'rgba(98, 95, 224, 0.3)',
            right: 20, 
            zIndex: 200, 
            bottom: 60, 
            overflow: 'hidden', 
            borderRadius: 10 
        },
        requestOthersButton: {
            backgroundColor: 'transparent', 
            padding: 12
        },
        requestOthersButtonText: {
            color: appearanceMode.primary,
            fontFamily: 'extrabold'
        }
    })
}

export default getStyles