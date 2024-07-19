import { appearanceStateType } from "@/state/features/appearanceSlice";
import { Dimensions, StyleSheet } from "react-native";

const DEVICE_WIDTH = Dimensions.get('window').width
const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            backgroundColor: appearanceMode.backgroundColor,
            flex: 1
        },
        header: {
            flexDirection: 'row',
            paddingTop: 80,
            width: '95%',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginHorizontal: 10,
        },
        headerText: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 20
        },
        contentContainer: {
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: 15
        },
        infoContainer: {
            borderRadius: 10,
            borderWidth: 2,
            borderColor: appearanceMode.primary,
            marginVertical: 10,
            padding: 10,
            width: '90%',
        },
        infoText: {
            color: appearanceMode.secondary,
            textAlign: 'center',
            fontFamily: 'bold',
            fontSize: 15
        },
        mediaContainer: {
            borderStyle: 'dashed',
            borderWidth: 5,
            borderColor: appearanceMode.faint,
            borderRadius: 10,
            width: '90%',
            height: 400,
            marginTop: 20,
            justifyContent: 'center',
            alignItems: 'center'
        },
        media: {
            width: DEVICE_WIDTH - 30,
            height: 400,
            borderRadius: 10
        },
        buttonContainerLayout: {
            height: 400,
            width: DEVICE_WIDTH - 30,
            position: 'absolute',
            zIndex: 100,
            justifyContent: 'center',
            alignItems: 'center'
        },
        buttonBackDrop: {
            padding: 15,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
            overflow: 'hidden'
        },
        mediaControlImage: {
            width: 25,
            height: 25
        },
        textInput: {
            width: '90%',
            borderWidth: 1,
            borderColor: appearanceMode.faint,
            borderRadius: 10,
            marginTop: 20,
            padding: 10,
            fontFamily: 'bold',
            color: appearanceMode.textColor
        },
        footer: {
            position: 'absolute',
            bottom: 30,
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
        },
        requestButton: {
            backgroundColor: 'rgba(98, 95, 224, 0.3)',
            width: '90%',
            padding: 10,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center'
        },
        requestButtonText: {
            color: appearanceMode.primary,
            fontFamily: 'extrabold',
            fontSize: 16
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