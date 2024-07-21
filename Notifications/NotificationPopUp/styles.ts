import { appearanceStateType } from "@/state/features/appearanceSlice";
import { StyleSheet } from "react-native";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            marginHorizontal: 15, 
            borderRadius: 20, 
            borderWidth: 3, 
            padding: 10,
            borderColor: appearanceMode.primary, 
            overflow: 'hidden'
        },
        body: {
        },
        header: {
            flexDirection: 'row'
        },
        userImage: {
            width: 40,
            height: 40,
            borderRadius: 10,
            marginRight: 10
        },
        headerText: {
            width: '85%',
            color: appearanceMode.textColor,
            fontFamily: 'semibold',
        },
        username: {
            fontFamily: 'extrabold',
            color: appearanceMode.textColor
        },
        convoRoom: {
            color: appearanceMode.primary,
            fontFamily: 'bold'
        },
        contentContainer: {
            marginTop: 10
        },
        content: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 13
        }
    })
}

export default getStyles