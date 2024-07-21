import { appearanceStateType } from "@/state/features/appearanceSlice";
import { StyleSheet } from "react-native";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            backgroundColor: appearanceMode.backgroundColor,
            padding: 10,
            flex: 1
        },
        text: {
            color: appearanceMode.textColor,
            fontFamily: 'semibold',
            marginBottom: 15,
        }
    })
}

export default getStyles