import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            borderBottomWidth: .5,
            paddingHorizontal: 15,
            paddingVertical: 10,
            justifyContent: 'center',
            marginBottom: 10,
            borderBottomColor: appearanceMode.faint
        },
        friendContentContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        friendMessage: {
            color: appearanceMode.textColor,
            fontFamily: 'semibold',
            width: '80%'
        },
        profileImage: {
            width: 40,
            height: 40,
            borderRadius: 15,
            marginRight: 10
        },
        friendName: {
            fontFamily: 'extrabold'
        },
        actionButton: {

        },
        actionText: {
            color: appearanceMode.textColor,
            fontSize: 20,
            fontWeight: 'bold'
        },
        keepupContainer: {
            borderWidth: .5,
            borderColor: appearanceMode.primary,
            marginHorizontal: 10,
            borderRadius: 15,
            padding: 15,
            justifyContent: 'center',
        },
        keepupContentContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        keepupMessage: {
            color: appearanceMode.textColor,
            fontFamily: 'semibold',
            width: '80%'
        },
        keepupUserImage: {
            width: 40,
            height: 40,
            borderRadius: 15,
            marginRight: 10
        },
        keepupUsername: {
            fontFamily: 'extrabold'
        },
        keepupConvoText: {
            color: appearanceMode.primary,
            fontFamily: 'bold'
        },
        convoStartContentContainer: {
            flexDirection: 'row'
        },
        convoStartUserImage: {
            width: 40,
            height: 40,
            borderRadius: 15,
            marginRight: 10
        },
        right: {
            justifyContent: 'space-evenly',
            width: '80%'
        },
        convoInfoText: {
            color: appearanceMode.textColor,
            fontFamily: 'semibold',
        },
        convoStartUsername: {
            fontFamily: 'extrabold'
        },
        convoStarter: {
            color: appearanceMode.primary,
            fontFamily: 'bold'
        },
        highlightContentContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            width: '90%'
        },
        highlightMessage: {
            color: appearanceMode.textColor,
            fontFamily: 'semibold',
        },
        replyInfoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            width: '80%',
        },
        replyInfo: {
            color: appearanceMode.textColor,
            fontFamily: 'semibold',
        },
        replyUsername: {
            fontFamily: 'extrabold'
        },
        replyConvoStarter: {
            color: appearanceMode.primary,
            fontFamily: 'bold'
        },
        replyMessageContainer: {
            marginTop: 15,
            width: '80%'
        },
        replyMessage: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
        },
        specialContainer: {
            backgroundColor: appearanceMode.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 10,
            borderRadius: 15,
            padding: 15,
        },
        specialText: {
            color: 'white',
            fontFamily: 'extrabold',
            fontSize: 15
        },
        dateContainer: {
            alignItems: 'flex-end',
            marginTop: 10,
            paddingRight: 10
        },
        date: {
            color: appearanceMode.secondary,
            fontFamily: 'bold',
            fontSize: 12
        }
    })
}

export default getStyles