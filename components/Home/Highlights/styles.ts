import { Dimensions, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

export const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            backgroundColor: appearanceMode.backgroundColor,
            marginHorizontal: 10
        },
        headerContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 5,
        },
        headerText: {
            color: appearanceMode.name === 'dark' ? appearanceMode.textColor : appearanceMode.secondary,
            fontFamily: 'extrabold',
            fontSize: 15,
        },
        activeInRoom: {
            color: appearanceMode.primary,
            fontFamily: 'extrabold',
        },
        username: {
            color: appearanceMode.primary,
            fontFamily: 'bold',
        },
        lastChat: {
            color: appearanceMode.textColor
        },
        mediaContainer: {
            marginTop: 10,
            borderRadius: 10,
        },
        image: {
            width: Dimensions.get('window').width - 20,
            height: Dimensions.get('window').height - 360,
            borderRadius: 10,
        },
        usersList: {
            flexDirection: 'row',
            position: 'absolute',
            zIndex: 100,
            marginTop: 10,
            width: '97%',
            marginLeft: 5,
        },
        highlightProfileButtonActive: {
            backgroundColor: appearanceMode.primary,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            paddingHorizontal: 15,
            paddingVertical: 5,
            borderRadius: 10,
            marginHorizontal: 5,
        },
        highlightProfileButtonInactive: {
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            paddingHorizontal: 15,
            paddingVertical: 5,
            borderRadius: 10,
            marginHorizontal: 5

        },
        highLightUserImage: {
            width: 25,
            height: 25,
            borderRadius: 10
        },
        highLightUsername: {
            color: 'white',
            fontFamily: 'bold',
            marginLeft: 10
        },
        nextHighlightButton: {
            position: 'absolute', 
            width: '45%', 
            height: 350,
            marginTop: 50,
            right: 0,
            zIndex: 100
        }, 
        prevHighlightButton: {
            position: 'absolute', 
            width: '45%', 
            height: 350,
            marginTop: 50,
            zIndex: 100
        }
    })
}