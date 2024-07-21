import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode:appearanceStateType) => {
    return StyleSheet.create({
        container: {
            marginTop: 120,
            padding: 10,
            borderWidth: 1,
            borderColor: appearanceMode.faint,
            marginHorizontal: 5,
            borderRadius: 15
        },
        header: {
            gap: 5
        },
        mainHeaderText: {
            fontFamily: 'extrabold',
            fontSize: 20,
            color: appearanceMode.textColor
        },
        subHeaderText: {
            fontFamily: 'bold',
            color: appearanceMode.secondary,
            fontSize: 15
        },
        experienceContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: 10
        },
        experienceButton: {
            backgroundColor: appearanceMode.faint,
            marginRight: 10,
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 30,
            marginBottom: 10
        },
        experienceText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold'
        },
        optionSend: {
            marginRight: 10,
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 30,
            marginBottom: 10,
            backgroundColor: appearanceMode.primary
        },
        footer: {
            // paddingHorizontal: 3
        },
        footerText: {
            color: appearanceMode.secondary,
            fontFamily: 'bold',
            fontSize: 15,
            marginTop: 20,
            marginLeft: 5
        },
        sendText: {
            color: 'white',
            fontFamily: 'extrabold'
        }
    })
}

export default getStyles;