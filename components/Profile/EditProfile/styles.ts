import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: appearanceMode.backgroundColor,
        },
        title: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            marginLeft: 15,
            marginVertical: 15
        },
        profileBackgroundImageContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            padding: 10
        },
        contentContainer: {
            paddingTop: 100
        },
        profileBackgroundImageButton: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            position: 'absolute',
            zIndex: 100,
            width: '100%',
            height: 300,
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center'
        },
        profileBackgroundImageButtonText: {
            color: 'white',
            fontSize: 15,
            fontFamily: 'extrabold'
        },
        profileBackgroundImage: {
            width: '100%',
            height: 300,
            borderRadius: 15,
            resizeMode: 'cover'
        },
        profileImageContainer: {
            marginTop: 30,
            marginHorizontal: 15,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 10,
        },
        profileImage: {
            width: 100,
            height: 100,
            borderRadius: 10,
        },
        profileImageButton: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            position: 'absolute',
            zIndex: 100,
            width: 100,
            height: 100,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center'
        },
        profileImageButtonText: {
            color: 'white',
            fontFamily: 'extrabold',
            fontSize: 15
        },
        removeImageButton: {
            backgroundColor: 'rgba(227, 54, 41, 0.3)',
            padding: 7,
            borderRadius: 7
        },
        removeImageButtonText: {
            color: '#E33629',
            fontFamily: 'extrabold',
        },
        audioContainer: {
            flexDirection: 'row',
            marginTop: 20,
            paddingHorizontal: 25,
            justifyContent: 'space-between',
        },
        playButtonContainer: {
            flexDirection: 'row',
            backgroundColor: 'rgba(98, 95, 224, 0.3)',
            gap: 10,
            alignItems: 'center',
            borderRadius: 30,
            paddingRight: 10
        },
        playButton: {
            backgroundColor: appearanceMode.primary,
            padding: 10,
            borderRadius: 30
        },
        playButtonImage: {
            width: 25,
            height: 25,
        },
        playButtonText: {
            color: appearanceMode.primary,
            fontFamily: 'extrabold'
        },
        changeAudioProfileButton: {
            backgroundColor: 'rgba(98, 95, 224, 0.3)',
            justifyContent: 'center',
            paddingHorizontal: 20,
            borderRadius: 10
        },
        changeAudioProfileButtonText: {
            color: appearanceMode.primary,
            fontSize: 12,
            fontFamily: 'extrabold'
        },
        footer: {
            position: 'absolute',
            bottom: 40,
            width: '100%',
        },
        textInputContaniner: {
            gap: 20,
            marginHorizontal: 25,
            marginTop: 20,
            flexDirection: 'row',
            flexWrap: 'wrap'
        },
        inputButton: {
            backgroundColor: 'rgba(98, 95, 224, 0.3)',
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 10
        },
        inputButtonText: {
            color: appearanceMode.primary,
            fontFamily: 'extrabold'
        },
        inputMainContainer: {
            flexDirection: 'row',
            alignItems:'center',
            justifyContent: 'space-between',
            marginHorizontal: 20,
            gap: 10
        },
        textInput: {
            padding: 20,
            flex: 1,
            backgroundColor: appearanceMode.faint,
            borderRadius: 10,
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            marginVertical: 50,
        },
        usernameExistsText: {
            color: '#E33629',
            fontFamily: 'extrabold',
            marginHorizontal: 20
        },
        passwordsDontMatchText: {
            textAlign: 'center',
            color: '#E33629',
            fontFamily: 'extrabold',
            marginVertical: 10
        },
        doneButton: {
            backgroundColor: 'rgba(98, 95, 224, 0.3)',
            paddingVertical: 20,
            paddingHorizontal: 20,
            borderRadius: 10
        },
        doneButtonText: {
            color: appearanceMode.primary,
            fontFamily: 'extrabold'
        },
        saveButton: {
            backgroundColor: appearanceMode.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 10,
            paddingVertical: 10,
            borderRadius: 10
        },
        saveButtonText: {
            color: 'white',
            fontSize: 15,
            fontFamily: 'extrabold'
        },
        visualizer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 25,
            borderRadius: 10,
            backgroundColor: 'rgba(98, 95, 224, 0.3)',
            padding: 5,
            marginTop: 10,
            gap: 3
        },
        bar: {
            width: 8,
            borderRadius: 10,
            backgroundColor: appearanceMode.primary,
            marginHorizontal: 1,
            
        },
        notificationContainer: {
            backgroundColor: 'transparent', 
            position: 'absolute', 
            width: '100%', 
            zIndex: 200, 
            borderRadius: 10
        },
    })
}

export default getStyles