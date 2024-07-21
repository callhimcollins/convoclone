import { appearanceStateType } from "@/state/features/appearanceSlice";
import { StyleSheet } from "react-native";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        noNotificationsContainer: {
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%'
        },
        noNotificationsText: {
            color: appearanceMode.textColor, 
            fontFamily: 'bold', 
            fontSize: 16
        }
    })
}

export default getStyles;