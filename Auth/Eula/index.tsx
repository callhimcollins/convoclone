import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/state/store'
import getStyles from './styles'

const Eula = () => {
    const appearanceMode = useSelector((state: RootState) => state.appearance.currentMode)
    const styles = getStyles(appearanceMode)
    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 25 }} style={styles.container}>
            <Text style={styles.text}>
                1. ACCEPTANCE OF TERMS {'\n'}
                By downloading, installing, or using the Convo application ("App"), you agree to be bound by this End User License Agreement ("EULA"). If you do not agree to these terms, do not use the App.
            </Text>
            <Text style={styles.text}>
                2. LICENSE GRANT {'\n'}
                Subject to your compliance with this EULA, Convo grants you a limited, non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial purposes.
            </Text>
            <Text style={styles.text}>
                3. RESTRICTIONS 
                You may not: {'\n'}
                a) Modify, reverse engineer, decompile, or disassemble the App {'\n'}
                b) Rent, lease, lend, sell, or sublicense the App {'\n'}
                c) Use the App for any illegal or unauthorized purpose{'\n'}
                d) Interfere with or disrupt the integrity or performance of the App or any of its systems
            </Text>
            <Text style={styles.text}>
                4. USER CONTENT {'\n'}
                You retain ownership of any content you submit to the App. By submitting content, you grant Convo a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content.
            </Text>
            <Text style={styles.text}>
                5. PRIVACY {'\n'}
                Your use of the App is subject to Convo's Privacy Policy, which is incorporated into this EULA by reference.
            </Text>
            <Text style={styles.text}>
                6. TERMINATION {'\n'}
                Convo may terminate your access to the App at any time, with or without cause, without notice.
            </Text>
            <Text style={styles.text}>
                7. DISCLAIMER OF WARRANTIES {'\n'}
                The App is provided "as is" without warranty of any kind. Convo disclaims all warranties, express or implied.
            </Text>
            <Text style={styles.text}>
                8. LIMITATION OF LIABILITY {'\n'}
                Convo shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the App.
            </Text>
            <Text style={styles.text}>
                9. GOVERNING LAW {'\n'}
                This EULA shall be governed by the laws of Convo, without regard to its conflict of law provisions.
            </Text>
            <Text style={styles.text}>
                10. CHANGES TO THIS EULA {'\n'}
                Convo reserves the right to modify this EULA at any time. Your continued use of the App after any changes constitutes acceptance of those changes.
            </Text>

            <Text style={[styles.text, { fontFamily: 'extrabold' }]}>
                By using Convo, you acknowledge that you have read this EULA, understand it, and agree to be bound by its terms and conditions.
            </Text>
        </ScrollView>
    )
}

export default Eula

