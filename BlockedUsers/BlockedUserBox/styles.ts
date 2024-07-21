import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: appearanceMode.faint
        },
        left: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        username: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            marginLeft: 10
        },
        image: {
            width: 40,
            height: 40,
            borderRadius: 10,
        },
        right: {
            backgroundColor: appearanceMode.primary,
            padding: 5,
            borderRadius: 5
        },
        rightText: {
            color: 'white',
            fontFamily: 'bold',
            fontSize: 13
        }
    });
}

export default getStyles