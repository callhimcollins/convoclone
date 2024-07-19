import { appearanceStateType } from "@/state/features/appearanceSlice";
import { StyleSheet } from "react-native";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            backgroundColor: appearanceMode.backgroundColor,
            flex: 1
        },
        header: {
            paddingTop: 60,
            marginLeft: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 5
        },
        headerText: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 18
        },
        sendNotificationToAllButton: {
            borderColor: appearanceMode.primary,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            padding: 10,
            borderRadius: 10,
            marginHorizontal: 20,
            marginVertical: 10
        },
        sendNotificationToAllButtonText: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 15
        },
        noPendingRequestsContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 20
        },
        noPendingRequestsText: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 16
        },
        mediaContainer: {
            width: '100%', 
            height: '100%', 
            zIndex: 500, 
            position: 'absolute' 
        }
    })
}

export default getStyles