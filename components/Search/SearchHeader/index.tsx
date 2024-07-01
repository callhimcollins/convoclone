import { Platform, TextInput, View } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur'
import getStyles from './styles'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'


type SearchHeaderProps = {
    searchValue: string;
    searchFuntion: (value: string) => void;
}
const SearchHeader = (search: SearchHeaderProps) => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)

 
    const renderAppearanceModeView = () => {
        if(Platform.OS === 'android') {
            return (
                <View style={styles.container}>
                    <TextInput value={search.searchValue} onChangeText={search.searchFuntion} placeholderTextColor={appearanceMode.faint} placeholder='Search' style={styles.textInput}/>
                </View>
            )
        } else {
            return (
                <BlurView tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.container}>
                    <TextInput value={search.searchValue} onChangeText={search.searchFuntion} placeholderTextColor={appearanceMode.faint} placeholder='Search' style={styles.textInput}/>
                </BlurView>
            )
        }
    }

    return (
        <View style={styles.container}>
            {renderAppearanceModeView()}
        </View>
    )
}

export default SearchHeader
