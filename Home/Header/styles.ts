import { appearanceStateType } from "@/state/features/appearanceSlice";
import { Platform, StyleSheet } from "react-native";

export const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        headerContainer: {
            position: 'absolute',
            backgroundColor: Platform.OS === 'ios' ? appearanceMode.backgroundTransparent : appearanceMode.backgroundColor,
            width: '100%',
            paddingTop: 45,
            paddingBottom: 10,
            paddingHorizontal: 20,
            overflow: 'hidden',
            zIndex: 600,
            flexDirection: 'row'
        },
        contentContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%'
        },
        logo: {
            width: 45,
            height: 45,
        },
        icon: {
            fontSize: 40
        },
        profileButton: {
            width: 45,
            height: 45,
        },
        profileImage: {
            width: 45,
            height: 45,
            borderRadius: 10
        }
    })
}