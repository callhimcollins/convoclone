import { appearanceStateType } from "@/state/features/appearanceSlice";
import { Dimensions, StyleSheet } from "react-native";

const DEVICE_WIDTH = Dimensions.get('window').width
const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            marginHorizontal: 10,
            padding: 15,
            borderWidth: .5,
            borderColor: appearanceMode.faint,
            borderRadius: 10,
            gap: 5
        },
        username: {
            color: appearanceMode.textColor,
            fontSize: 15,
            fontFamily: 'bold'
        },
        mediaContainer: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        media: {
            width: DEVICE_WIDTH - 20,
            height: 400,
            marginVertical: 10,
            borderRadius: 10
        },
        mediaInfoContainer: {
            position: 'absolute',
            zIndex: 100,
            height: 410,
            width: DEVICE_WIDTH - 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        mediaInfoText: {
            color: 'white',
            fontFamily: 'extrabold',
            fontSize: 26,
            borderWidth: 4,
            borderColor: appearanceMode.primary,
            padding: 7,
            borderRadius: 10
        },
        convoStarter: {
            color: appearanceMode.textColor,
            fontSize: 15,
            fontFamily: 'bold'
        },
        acceptButton: {
            backgroundColor: appearanceMode.primary,
            padding: 10,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 10
        },
        statusText: {
            color: 'white',
            fontFamily: 'bold',
            fontSize: 15
        }
    })
}

export default getStyles