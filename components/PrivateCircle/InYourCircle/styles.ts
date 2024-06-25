import { StyleSheet } from "react-native";
import { appearanceStateType } from "@/state/features/appearanceSlice";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            padding: 15, 
            borderBottomWidth: .5, 
            borderBottomColor: appearanceMode.faint,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        contentContainer: {
            flexDirection: 'row', 
            alignItems: 'center'
        },
        profileImage: {
            width: 50, 
            height: 50, 
            borderRadius: 10
        },
        username: {
            color: appearanceMode.textColor, 
            fontFamily: 'bold',
            marginLeft: 10
        },
        bio: {
            color: appearanceMode.textColor, 
            fontFamily: 'bold',
            fontSize: 12
        },
        viewProfileText: {
            color: 'white', 
            marginTop: 10, 
            fontFamily: 'bold'
        },
        kickOutOfCircleButton: {
            backgroundColor: '#rgba(227, 54, 41, 0.3)',
            padding: 5,
            borderRadius: 7
        },
        kickOutOfCircleText: {
            color: '#E33629',
            fontFamily: 'extrabold'
        }
    })
}

export default getStyles