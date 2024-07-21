import { Dimensions, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

export const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            marginTop: 10,
            marginRight: 5,
            padding: 10,
            borderRadius: 15,
            borderWidth: 1,
            borderColor: appearanceMode.faint,
            width: Dimensions.get('window').width - 40,
            // height: 130
        },
        headerContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between'
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        profileImage: {
            width: 45,
            height: 45,
            borderRadius: 10,
            marginRight: 7
        },
        name: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 15
        },
        convoImageContainer: {
            width: 100,
            height: 100,
            borderRadius: 10
        },
        convoImage: {
            width: 100,
            height: 100,
            borderRadius: 10
        },
        footer: {
            marginVertical: 7,
        },
        convoStarter: {
            color: appearanceMode.textColor,
            fontFamily: 'bold'
        },
        viewRoomButton: {
            backgroundColor: appearanceMode.primary,
            marginTop: 10,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 7,
            borderRadius: 15,
        },
        viewRoomText: {
            color: 'white',
            fontFamily: 'bold',
        }
    })
}
