import { appearanceStateType } from '@/state/features/appearanceSlice';
import { StyleSheet } from 'react-native';

const getStyles = (appearanceMode: appearanceStateType) => {
    return StyleSheet.create({
        container: {
            backgroundColor: appearanceMode.backgroundColor
            
        },
        text: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 16,
        },
        noKeepUpsContainer: {
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
        },
        noKeepUpsText: {
            color: appearanceMode.textColor,
            fontFamily: 'bold',
            fontSize: 16
        }
    })
}

export default getStyles