import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, SafeAreaView } from 'react-native';
import { AuthService } from '../services/auth';

interface EulaModalProps {
    visible: boolean;
    onAccept: () => void;
}

const EulaModal: React.FC<EulaModalProps> = ({ visible, onAccept }) => {
    const handleAgree = async () => {
        await AuthService.setEulaAccepted();
        onAccept();
    };

    const handleCancel = () => {
        Alert.alert(
            "EULA Declined",
            "You must accept the EULA to use this application.",
            [{ text: "OK" }]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
        >
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Clinical Decision Support Software</Text>
                        <Text style={styles.subtitle}>End User License Agreement (EULA) and Disclaimer</Text>
                        <Text style={styles.important}>IMPORTANT: PLEASE READ BEFORE PROCEEDING</Text>
                    </View>

                    <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                        <Text style={styles.intro}>
                            This Clinical Decision Support Software ("Software") is intended for use by licensed healthcare
                            professionals only. By continuing, you acknowledge and agree to the following:
                        </Text>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>1. Medical Disclaimer</Text>
                            <Text style={styles.text}>
                                This Software is not a replacement for the clinical judgment of the treating physician. It is designed to
                                guide physicians by presenting available treatment modalities based on the latest international clinical
                                guidelines.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>2. No Replacement for Clinical Judgment</Text>
                            <Text style={styles.text}>
                                The Software is intended solely as a supportive tool. The final decisions regarding patient care must be
                                made by the treating physician after evaluating all individual clinical circumstances.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>3. No Warranties</Text>
                            <Text style={styles.text}>
                                The Software is provided "as is" without warranties of any kind, express or implied. No guarantee is
                                made regarding the accuracy, completeness, or fitness of the recommendations provided.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>4. Limitation of Liability</Text>
                            <Text style={styles.text}>
                                The developer shall bear no liability for any outcomes, damages, or losses resulting from the use—or
                                misuse—of this Software. This includes, but is not limited to, adverse medical decisions or system
                                failures.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>5. User Responsibility</Text>
                            <Text style={styles.text}>
                                Use of this Software confirms that you are a qualified medical professional. You accept full
                                responsibility for all decisions informed by this Software.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>6. Indemnification</Text>
                            <Text style={styles.text}>
                                You agree to indemnify and hold harmless the developer against any claims or liabilities arising from
                                your use of the Software.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>7. Governing Law</Text>
                            <Text style={styles.text}>
                                This Agreement is governed by the laws of the jurisdiction in which the Software is used.
                            </Text>
                        </View>

                        <Text style={styles.agreementNotice}>
                            ✅ By clicking "I Agree", you confirm that you understand and accept the terms above.
                        </Text>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.buttonCancel} onPress={handleCancel}>
                            <Text style={styles.buttonTextCancel}>CANCEL</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.buttonAgree} onPress={handleAgree}>
                            <Text style={styles.buttonTextAgree}>I AGREE</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 20,
        overflow: 'hidden',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
        color: '#555',
    },
    important: {
        fontSize: 14,
        color: '#d32f2f',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    intro: {
        fontSize: 14,
        color: '#333',
        marginBottom: 15,
        lineHeight: 20,
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 5,
        color: '#222',
    },
    text: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
    agreementNotice: {
        fontSize: 14,
        color: '#2e7d32',
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 20,
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
    },
    buttonCancel: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    buttonAgree: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    buttonTextCancel: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 14,
    },
    buttonTextAgree: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default EulaModal;
