import { Dimensions, Platform, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";


const DEVICE_HEIGHT = Dimensions.get('window').height
const DEVICE_WIDTH = Dimensions.get('window').width
const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            backgroundColor: Platform.OS === 'android' ? appearanceMode.backgroundColor : appearanceMode.backgroundTransparent,
            width: '100%',
            height: DEVICE_HEIGHT + 50,
            alignItems: 'center',
            paddingTop: Platform.OS === 'ios' ? 120 : 80,
            paddingBottom: Platform.OS === 'ios' ? 100 : 0,
            marginBottom: Platform.OS === 'android' ? 90 : 0,
            borderRadius: 20,
            paddingHorizontal: 10,
            overflow: 'hidden'
        },
        convoStarter: {
            color: appearanceMode.textColor,
            fontSize: 18,
            fontFamily: 'extrabold',
            marginBottom: 20
        },
        media: {
            height: DEVICE_HEIGHT * 0.6,
            width: DEVICE_WIDTH * 0.9,
            borderRadius: 20,
            marginRight: 5
        },
        androidMediaContainer: {
            justifyContent: 'center',
            height: 400,
            marginHorizontal: 5,
            borderRadius: 10,
            flexDirection: 'row',
            gap: 10,
            flexWrap: 'wrap'
        },
        androidMediaButton: {
            width: '80%',
        },
        androidMedia: {
            width: 100,
            height: 100,
            borderRadius: 10
        },
        keepUpWithConversation: {
            backgroundColor: appearanceMode.primary,
            padding: 10,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
            marginBottom: 20,
            marginTop: Platform.OS === 'android' ? 20 : 0
        },
        dropConversation: {
            borderColor: appearanceMode.primary,
            borderWidth: 3,
            padding: 10,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
            marginBottom: 20
        },
        keepUpWithConversationText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold'
        }
    })
}

export default getStyles;