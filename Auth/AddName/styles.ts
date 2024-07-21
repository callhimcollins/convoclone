import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            paddingTop: 60,
            backgroundColor: appearanceMode.backgroundColor
        },
        headerText: {
            color: appearanceMode.primary,
            fontSize: 22,
            marginLeft: 15,
            fontFamily: 'bold'
        },
        footer: {
            width: '100%',
            position: 'absolute',
            bottom: 50,
            gap: 10,
        },
        input: {
            borderWidth: 1,
            borderColor: appearanceMode.faint,
            marginHorizontal: 20,
            padding: 10,
            borderRadius: 10,
            fontFamily: 'bold',
            color: appearanceMode.primary
        },
        continueButton: {
            backgroundColor: appearanceMode.primary,
            padding: 15,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
            marginHorizontal: 20
        },
        continueText: {
            color: 'white',
            fontFamily: 'bold',
            fontSize: 17
        }
    })
}

export default getStyles;