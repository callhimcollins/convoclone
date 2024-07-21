import { Platform, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            position: 'absolute',
            backgroundColor: Platform.OS === 'ios'? appearanceMode.backgroundTransparent : appearanceMode.backgroundColor,
            width: '100%',
            paddingTop: 65,
            paddingBottom: 10,
            zIndex: 100,
        },
        tabContainer: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            marginTop: 15
        }
    })
}

export default getStyles