import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearance: appearanceStateType) => {
    return StyleSheet.create({
        noblockedUsersContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
        },
        noblockedUsersText: {
            fontFamily: 'bold',
            color: appearance.textColor,
            fontSize: 16
        }
    })
}

export default getStyles