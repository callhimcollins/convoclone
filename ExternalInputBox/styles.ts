import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

export const getStyles = (mode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            marginVertical: 10,
            borderWidth: 1,
            borderColor: mode.faint,
            borderRadius: 20,
            justifyContent: 'space-between'
        },
        textInput: {
            color: mode.textColor,
            fontFamily: 'bold',
            paddingLeft: 10,
            flex: 1,
            borderRadius: 15,
            paddingRight: 5
        },
        actionButton: {
            backgroundColor: mode.primary,
            paddingHorizontal:  25,
            paddingVertical: 10,
            borderRadius: 20
        }
    });
}