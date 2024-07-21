import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            // paddingTop: 150,
            // paddingBottom: 30
        },
        noChatsContainer: {
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center'
        },
        noChatsText: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 15
        }
    })
}

export default getStyles;