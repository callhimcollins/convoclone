import Colors from "@/constants/Colors";
import { RootState } from "@/state/store";
import { Platform, StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode:appearanceStateType) => {
    return StyleSheet.create({
        container: {
            position: 'absolute',
            backgroundColor: appearanceMode.backgroundTransparent,
            bottom: 0,
            width: '100%',
            paddingVertical: 12,
            justifyContent: 'space-around',
            overflow: 'hidden',
            zIndex: 100,
            flexDirection: 'row',
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5
        },
        tabContainer: {
            backgroundColor: 'transparent',
            width: '100%',
            marginBottom: Platform.OS === 'ios' ? 10 : 0,
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center'
        },
        tabs: {
            backgroundColor: appearanceMode.backgroundColor,
            flexDirection: 'row',
            width: '80%',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 12,
            borderRadius: 14,
            elevation: 2
        },
        icon: {
            height: 24,
            width: 24
        },
        activeTab: {
            backgroundColor: appearanceMode.primary,
            flexDirection: 'row',
            paddingHorizontal: 12,
            paddingVertical: 5,
            alignItems: 'center',
            borderRadius: 10
    
        },
        tabActiveName: {
            color: 'white',
            fontFamily: 'extrabold',
            marginLeft: 10,
            fontSize: 13
        },
        startConvoButton: {
            backgroundColor: appearanceMode.primary,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            borderRadius: 20
        }
    });
    
}

export default getStyles;