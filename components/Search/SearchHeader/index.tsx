import { Platform, TextInput, View } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur'
import getStyles from './styles'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'


type SearchHeaderProps = {
    searchValue: string;
    searchFuntion: (value: string) => void;
    performSearch: () => void;
}
const SearchHeader = (search: SearchHeaderProps) => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const activeTab = useSelector((state: RootState) => state.navigation.activeTab)
    const styles = getStyles(appearanceMode)

 
    const renderAppearanceModeView = () => {
        if(Platform.OS === 'android') {
            return (
                <View key={activeTab.name} style={styles.container}>
                    <TextInput value={search.searchValue} onChangeText={search.searchFuntion} placeholderTextColor={appearanceMode.faint} placeholder='Search' style={styles.textInput}/>
                </View>
            )
        } else {
            return (
                <BlurView key={activeTab.name} tint={appearanceMode.name === 'light' ? 'light' : 'dark'} intensity={80} style={styles.container}>
                    <TextInput onSubmitEditing={search.performSearch} value={search.searchValue} onChangeText={search.searchFuntion} placeholderTextColor={appearanceMode.faint} placeholder='Search' style={styles.textInput}/>
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
