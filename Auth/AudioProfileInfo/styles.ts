import { appearanceStateType } from "@/state/features/appearanceSlice";
import { StyleSheet } from "react-native";

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            backgroundColor: appearanceMode.backgroundColor,
            flex: 1,
            paddingHorizontal: 10
        },
        headerText: {
            fontFamily: 'extrabold',
            color: appearanceMode.textColor,
            textAlign: 'center',
            marginTop: 20,
            fontSize: 16,
        },
        headerSubText: {
            textAlign: 'center',
            color: appearanceMode.secondary,
            fontFamily: 'extrabold',
            marginTop: 7,
            marginBottom: 15
        },
        boxContainer: {
            borderWidth: 3,
            borderColor: appearanceMode.primary,
            padding: 10,
            borderRadius: 15,
            justifyContent: 'space-around',
            alignItems: 'center',
            flexDirection: 'row'
        },
        boxImage: {
          width: 70,
          height: 70,
          borderRadius: 20  
        },
        boxText: {
            color: appearanceMode.textColor,
            fontFamily: 'extrabold',
            fontSize: 12,
            width: '70%',
            flexWrap: 'wrap',
        }
    })
}

export default getStyles