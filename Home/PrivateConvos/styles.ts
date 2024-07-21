import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        noConvosContainer: {
            height: '100%', 
            justifyContent: 'center', 
            alignItems: 'center' 
        },
        noConvosText: {
            color: appearanceMode.textColor, 
            fontFamily: 'bold', 
            fontSize: 16
        }
    })
}

export default getStyles