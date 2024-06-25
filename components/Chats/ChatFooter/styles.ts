import { Dimensions, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        keyboardContainer: {
            position: 'absolute',
            width: '100%',
            bottom: 0,
            zIndex: 100,
        },
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent:'center',
            paddingTop: 10,
            paddingBottom: 5,
            paddingHorizontal: 20,
        },
        middleContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
        },
        recordButton: {
            backgroundColor: appearanceMode.primary,
            paddingHorizontal: 20,
            paddingVertical: 7,
            borderRadius: 30
        },
        inputContainer: {
            borderWidth: 1,
            borderColor: appearanceMode.faint,
            paddingVertical: 1,
            paddingHorizontal: 10,
            width: Dimensions.get('window').width * .5,
            marginRight: 10,
            borderRadius: 20,
            fontFamily: 'semibold',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        textInput: {
            color: appearanceMode.textColor,
            width: '85%',
            padding: 10,
            maxHeight: 80
        },
        sendText: {
            color: appearanceMode.primary,
            fontFamily: 'bold',
            fontSize: 15
        },
        replyChatContainer: {
            backgroundColor: appearanceMode.faint, 
            padding: 15, 
            borderRadius: 15, 
            marginBottom: 5, 
            marginHorizontal: 5 
        },
        replyHeaderContainer: {
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 10, 
            justifyContent: 'space-between'
        },
        replyTextHeader: {
            fontFamily: 'semibold', 
            color: appearanceMode.textColor, 
            fontSize: 15
        },
        replyUsername: {
            fontFamily: 'bold', 
            color: appearanceMode.primary
        },
        replyChat: {
            fontFamily: 'semibold', 
            color: appearanceMode.textColor
        }
    })
}

export default getStyles;