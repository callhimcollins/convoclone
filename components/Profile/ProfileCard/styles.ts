import { Dimensions, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            backgroundColor: appearanceMode.backgroundColor,
            borderWidth: 1,
            borderColor: appearanceMode.faint,
            borderRadius: 15,
            width: Dimensions.get('window').width / 3,
            marginRight: 10,
            marginBottom: 10,
            padding: 7
        },
        headerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginBottom: 5,
        },
        image: {
            width: 45,
            height: 45,
            borderRadius: 15
        },
        audioButton: {
            backgroundColor: appearanceMode.primary,
            padding: 7,
            marginLeft: 10,
            borderRadius: 10
        },
        middleContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 5
        },
        name: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 11
        },
        username: {
            marginVertical: 1,
            color: appearanceMode.faint,
            fontFamily: 'bold',
        },
        viewButton: {
            backgroundColor: appearanceMode.primary,
            marginHorizontal: 10,
            marginVertical: 5,
            padding: 5,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
        },
        viewText: {
            color: 'white',
            fontFamily: 'bold',
        }
    })
}

export default getStyles;