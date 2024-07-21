import { appearanceStateType } from "@/state/features/appearanceSlice";
import { Dimensions, StyleSheet } from "react-native"

const DEVICE_WIDTH = Dimensions.get('window').width
const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: appearanceMode.backgroundColor
        },
        text: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 15,
            marginVertical: 15,
            marginLeft: 10
        },
        usercardContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: 5,
            justifyContent: 'space-between',
            backgroundColor: appearanceMode.backgroundColor
        },
        inviteButton: {
            backgroundColor: appearanceMode.primary,
            padding: 30,
            marginHorizontal: 10,
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 3
        },
        inviteButtonText: {
            color: 'white',
            fontFamily: 'extrabold',
            fontSize: 15,
            textAlign: 'center'
        },
        inviteButtonSubtext: {
            color: 'white',
            fontFamily: 'extrabold',
        },
        discoverContainer: {
            marginTop: 5
        },
        discoverHeaderText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 16,
            marginLeft: 15
        },
        mediaContainer: {
            marginTop: 10,
            justifyContent: 'center',
            alignItems: 'center',
        },
        videoContainer: {
            width: '100%',
            height: 450,
            justifyContent: 'center',
            alignItems: 'center'
        },
        videoButtonOverlayContainer: {
            position: 'absolute',
            zIndex: 100,
            height: 450,
            width: '95%',
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 10,
        },
        mediaControlButton: {
            padding: 15,
            overflow: 'hidden',
            borderRadius: 15
        },
        mediaControlButtonImage: {
            width: 30,
            height: 30,
        },
        discoverImage: {
            width: DEVICE_WIDTH - 20,
            height: 450,
            borderRadius: 10
        },
        mediaTextContainer: {
            position: 'absolute',
            bottom: 2,
            width: '94%',
            overflow: 'hidden',
            borderRadius: 10,
        },
        mediaText: {
            color: 'white',
            fontFamily: 'extrabold',
            fontSize: 15,
            marginTop: 10,
            marginBottom: 25,
            marginLeft: 10
        },
        viewSourceText: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            color: appearanceMode.primary,
            position: 'absolute',
            bottom: 5,
            right: 10,
            fontFamily: 'extrabold',
            fontSize: 12,
        },
        createDiscoverPostContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            marginTop: 20
        },
        createDiscoverPostButton: {
            backgroundColor: appearanceMode.primary,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 10,
            borderRadius: 7,
            width: '90%',
        },
        createDiscoverPostButtonText: {
            color: 'white',
            fontFamily: 'extrabold',
            fontSize: 15
        },
        experienceContainer: {
            marginTop: 40,
            paddingHorizontal: 10,
            paddingVertical: 20,
            gap: 30,
            borderWidth: 1,
            borderColor: appearanceMode.faint,
            marginHorizontal: 5,
            borderRadius: 20
        },
        experienceHeaderTextContainer: {
            gap: 5
        },
        experienceHeaderText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 18
        },
        experienceHeaderSubtext: {
            color: appearanceMode.secondary,
            fontFamily: 'extrabold',
        },
        experienceInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            backgroundColor: appearanceMode.faint,
            borderRadius: 7
        },
        experienceInput: {
            fontFamily: 'bold',
            color: appearanceMode.textColor,
            flex: 1,
            paddingHorizontal: 10,
            paddingVertical: 10,
        },
        sendButton: {
            backgroundColor: appearanceMode.primary,
            padding: 10,
            borderRadius: 7,
        },
        sendButtonText: {
            color: 'white',
            fontFamily: 'extrabold',
        }
    })
}

export default getStyles