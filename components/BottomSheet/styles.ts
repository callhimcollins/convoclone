import { appearanceStateType } from "@/state/features/appearanceSlice";
import { Dimensions, Platform, StyleSheet } from "react-native";
import BottomSheet from ".";

const DEVICE_HEIGHT = Dimensions.get('window').height
const DEVICE_WIDTH = Dimensions.get('window').width

const getStyles = (appearanceMode: appearanceStateType, height:Number) => {
    return StyleSheet.create({
        backgroundContainer: {
            backgroundColor: Platform.OS === 'ios' ? appearanceMode.backgroundTransparent : 'rgba(0, 0, 0, 0.9)',
            position: "absolute",
            width: '100%',
            height: '100%',
            alignItems: 'flex-end',
            flexDirection: 'row',
        },
        bottomSheetContainer: {
            backgroundColor: appearanceMode.backgroundColor,
            height: Number(height),
            width: '100%',
            padding: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20
        },
        progressBar: {
            height: 3, 
            backgroundColor: appearanceMode.primary, 
            borderRadius: 20, 
            marginBottom: 5
        },
        bottomSheetHeader: {
            width: 35,
            height: 6,
            backgroundColor: appearanceMode.primary,
            marginTop: 10,
            borderRadius: 20
        },
        close: {
            backgroundColor: 'transparent',
            width: '100%',
            position: 'absolute',
            top: 10,
            height: 0.4 * DEVICE_HEIGHT,
            
        },
        header: {

        },
        headerInfoContainer: {
            flexDirection: 'row',
            justifyContent:'space-between',
            alignItems: 'center',
            // width: '100%'
        },
        headerText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 16
        },
        locationInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 10,
        },
        locationInput: {
            marginLeft: 10,
            fontFamily: 'bold',
            color: appearanceMode.textColor,
            paddingVertical: 10,
            width: '100%',
            fontSize: 13
        },
        mainContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent:'space-around',
            width: '100%',
        },
        afterRecordContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            width: DEVICE_WIDTH-85,
            gap: 15
        },
        playRecord: {
            backgroundColor: 'rgba(98, 95, 224, 0.3)',
            width: '80%',
            paddingVertical: 10,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
        },
        playText: {
            color: appearanceMode.primary,
            fontFamily: 'extrabold',
        },
        delete: {
            width: 30,
            height: 30
        },
        recordButton: {
            borderRadius: 10, 
            flexDirection: 'row', 
            justifyContent: 'center', 
            alignItems: 'center', 
            paddingVertical: 5, 
            backgroundColor: appearanceMode.primary
        },
        iconImage: {
            width: 30,
            height: 30,
            marginRight: 15
        },
        recordText: {
            color: 'white',
            fontFamily: 'bold',
            fontSize: 15,
        },
        mainInput: {
            fontFamily: 'bold', 
            color: appearanceMode.textColor, 
            borderWidth: 1, 
            borderColor: appearanceMode.faint, 
            paddingVertical: 11, 
            paddingHorizontal: 10, 
            borderRadius: 10
        },
        linkContainer: {
            marginTop: 25,
            justifyContent: 'center',
            alignItems: 'center',
        },
        addLinkButton: {
            flexDirection: 'row', 
            justifyContent: 'center', 
            alignItems: 'center', 
            paddingVertical: 5, 
            backgroundColor: "rgba(57, 57, 57, 0.3)", 
            width: '100%',
            gap: 10,
            borderRadius: 10
        },
        linkInput: {
            backgroundColor: "rgba(57, 57, 57, 0.3)",
            width: '90%',
            padding: 10,
            borderRadius: 10,
            color: appearanceMode.textColor,
            fontFamily: 'extrabold'
        },
        addLinkText: {
            color: appearanceMode.secondary,
            fontFamily: 'extrabold',
            fontSize: 15
        },
        urlInfo: {
            textAlign: 'center',
            color: '#E33629',
            fontFamily: 'extrabold',
            marginBottom: 25,
            marginTop: 10
        },
        pickRoleText: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 13
        },
        actionButton: {
            backgroundColor: "rgba(57, 57, 57, 0.3)", 
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 7
        },
        actionButtonSelected: {
            backgroundColor: appearanceMode.primary,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 7
        },
        actionButtonText: {
            color: appearanceMode.secondary,
            fontFamily: 'bold'
        },
        actionButtonTextSelected: {
            color: 'white',
            fontFamily: 'extrabold'
        },
        dialogueCompletionText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            textAlign: 'center',
            marginBottom: 10,
        },
        mediaContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent:'space-between',
            width: '100%'
        },
        mediaLeft: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        specialContainer: {
            flexDirection: 'row',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'center'
        },
        privateButton: {
            borderWidth: 1,
            borderColor: appearanceMode.primary,
            paddingHorizontal: 20,
            paddingVertical: 7,
            borderRadius: 10
        },
        privateButtonSelected: {
            backgroundColor: appearanceMode.primary,
            paddingHorizontal: 20,
            paddingVertical: 7,
            borderRadius: 10
        },
        privateText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 13
        },
        dialogueRobot: {
            width: 30,
            height: 30
        },
        startConvoText: {
            color: appearanceMode.primary,
            fontFamily: 'extrabold',
            fontSize: 15,
            marginLeft: 10
        },
        privateInfoText: {
            textAlign: 'center',
            color: appearanceMode.secondary,
            marginVertical: 15,
            fontFamily: 'extrabold',
        },
        image: {
            width: Platform.OS === 'ios' ? 350 : 280,
            height: 300,
            resizeMode: 'cover',
            marginRight: 10,
            borderRadius: 10
        },
        videoContainer: {
            position: 'absolute',
            zIndex: 100,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            width: Platform.OS === 'ios' ? 350 : 280,
            height: 300,
        },
        playButton: {
            padding: 20,
            borderRadius: 50,
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
        },
        playButtonIcon: {
            padding: 13,
            overflow: 'hidden',
            borderRadius: 10
        },
        playButtonImage: {
            width: 25,
            height: 25
        },
        video: {
            width: Platform.OS === 'ios' ? 350 : 280,
            height: 300,
            marginRight: 10,
            borderRadius: 10,
        },
        removeMediaText: {
            textAlign: 'center',
            marginTop: 20,
            color: appearanceMode.secondary,
            fontFamily: 'extrabold',
            
        },
        visualizer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            backgroundColor: 'rgba(98, 95, 224, 0.3)',
            padding: 5,
            marginVertical: 23,
            gap: 3,
            width: '100%'
        },
        bar: {
            width: 5,
            borderRadius: 10,
            backgroundColor: appearanceMode.primary,
            marginHorizontal: 1,
            maxHeight: 8
        },
    })
}

export default getStyles