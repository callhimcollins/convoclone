import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flex: 1
        },
        header: {
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            position: 'absolute',
            zIndex: 100,
            width: '100%',
        },
        headerText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 16
        },
        button: {
            paddingVertical: 15,
            paddingHorizontal: 10,
            borderBottomWidth: 1,
            borderColor: appearanceMode.faint,
            flexDirection: 'row',
            alignItems: 'center',
        },
        buttonText: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 15
        },
        icon: {
            width: 50,
            height: 50,
            marginRight: 10
        },
    })
}
export default getStyles