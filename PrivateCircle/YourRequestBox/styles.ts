import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            padding: 15, 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            borderBottomWidth: .5, 
            borderBottomColor: appearanceMode.faint
        },
        left: {
            flexDirection: 'row', 
            alignItems: 'center'
        },
        profileImage: {
            width: 50, 
            height: 50, 
            borderRadius: 10
        },
        username: {
            fontFamily: 'bold', 
            color: appearanceMode.textColor, 
            marginLeft: 10,
            width: '55%',
            flexWrap: 'wrap'
        },
        cancelButton: {
            backgroundColor: 'rgba(227, 54, 41, 0.3)',
            padding: 5,
            borderRadius: 7
        },
        cancelButtonText: {
            fontFamily: 'extrabold', 
            color: '#E33629'
        }
    })
}

export default getStyles