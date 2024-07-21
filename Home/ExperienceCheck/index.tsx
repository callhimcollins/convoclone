import { Text, View, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'
import ExternalInputBox from '@/components/ExternalInputBox'
import { supabase } from '@/lib/supabase'

const experienceList = [{ point: 5, feedback: "It's Different"}, { point: 4, feedback: "I Love It"}, { point: 3, feedback: "It's All The Same"}, { point: 2, feedback: "I Think It's Ok"}, { point: 1, feedback: "It Could Be Better"}]
const ExperienceCheck = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const authenticatedUserData = useSelector((state: RootState) => state.user.authenticatedUserData)
    const styles = getStyles(appearanceMode)
    const [experienceFeedback, setExperienceFeedback] = useState<string>('')

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.mainHeaderText}>Experience Check</Text>
                <Text style={styles.subHeaderText}>How Do You Feel Using Convo?</Text>
                <View style={styles.experienceContainer}>
                    {experienceList.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.experienceButton}>
                            <Text style={styles.experienceText}>{item.feedback}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.optionSend}>
                        <Text style={styles.sendText}>Send</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>What Would You Like Convo To Add?</Text>
                    <ExternalInputBox placeholder='Type Something' icon={<Text style={styles.sendText}>Send</Text>} inputValue={experienceFeedback} onChangeValue={(text) => {setExperienceFeedback(text)}} action={() => {}}/>
                </View>
            </View>
        </View>
    )
}

export default ExperienceCheck