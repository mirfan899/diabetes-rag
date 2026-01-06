console.error('[HomeScreen] EVALUATING');
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RecommendationRequest } from '../types';
import { getRecommendations } from '../services/api';

const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(false);

    // Separate state for individual BP fields to combine later
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');

    const [formData, setFormData] = useState<RecommendationRequest>({
        guidelines: 'ADA',
        diabetes_type: 'Type 2',
        hba1cPercent: 8.5,
        age: 55,
        gender: 'male',
        weightKg: 85,
        heightCm: 175,
        bmi: 27.8,
        // Initialize other fields as empty/undefined handled by types
    });

    const handleChange = (field: keyof RecommendationRequest, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNumberChange = (field: keyof RecommendationRequest, value: string) => {
        // Allow empty string to clear input, otherwise parse
        if (value === '') {
            setFormData(prev => ({ ...prev, [field]: undefined }));
            return;
        }
        const num = parseFloat(value);
        if (!isNaN(num)) {
            setFormData(prev => ({ ...prev, [field]: num }));
        }
    };

    const calculateBMI = () => {
        const { weightKg, heightCm } = formData;
        if (weightKg && heightCm && heightCm > 0) {
            const heightM = heightCm / 100;
            const bmi = weightKg / (heightM * heightM);
            setFormData(prev => ({ ...prev, bmi: parseFloat(bmi.toFixed(1)) }));
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Combine BP
            let bp = undefined;
            if (systolic && diastolic) {
                bp = `${systolic}/${diastolic}`;
            }

            const requestData: RecommendationRequest = {
                ...formData,
                bloodPressure: bp,
            };

            const result = await getRecommendations(requestData);
            navigation.navigate('Result', { result });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to get recommendations. Please check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Explicit Back Button for better UX */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('DoctorProfile')}>
                <Text style={styles.backButtonText}>← Back to Dashboard</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Diabetes RAG Advisor</Text>

            <Text style={styles.sectionHeader}>Patient Demographics</Text>
            <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.age?.toString()}
                        onChangeText={(text) => handleNumberChange('age', text)}
                        keyboardType="numeric"
                        placeholder="Age"
                    />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                    <Text style={styles.label}>Gender</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.gender}
                        onChangeText={(text) => handleChange('gender', text)}
                        placeholder="Gender"
                    />
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                    <Text style={styles.label}>Height (cm)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.heightCm?.toString()}
                        onChangeText={(text) => handleNumberChange('heightCm', text)}
                        onEndEditing={calculateBMI}
                        keyboardType="numeric"
                        placeholder="cm"
                    />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.weightKg?.toString()}
                        onChangeText={(text) => handleNumberChange('weightKg', text)}
                        onEndEditing={calculateBMI}
                        keyboardType="numeric"
                        placeholder="kg"
                    />
                </View>
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>BMI (Auto-calculated)</Text>
                <TextInput
                    style={[styles.input, styles.readOnly]}
                    value={formData.bmi?.toString()}
                    editable={false}
                    placeholder="BMI"
                />
            </View>

            <Text style={styles.sectionHeader}>Clinical Vitals</Text>
            <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                    <Text style={styles.label}>HbA1c (%)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.hba1cPercent?.toString()}
                        onChangeText={(text) => handleNumberChange('hba1cPercent', text)}
                        keyboardType="numeric"
                        placeholder="e.g. 8.5"
                    />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                    <Text style={styles.label}>Fasting Glucose</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.bloodGlucoseFastingMgDl?.toString()}
                        onChangeText={(text) => handleNumberChange('bloodGlucoseFastingMgDl', text)}
                        keyboardType="numeric"
                        placeholder="mg/dL"
                    />
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                    <Text style={styles.label}>Systolic BP</Text>
                    <TextInput
                        style={styles.input}
                        value={systolic}
                        onChangeText={setSystolic}
                        keyboardType="numeric"
                        placeholder="mmHg"
                    />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                    <Text style={styles.label}>Diastolic BP</Text>
                    <TextInput
                        style={styles.input}
                        value={diastolic}
                        onChangeText={setDiastolic}
                        keyboardType="numeric"
                        placeholder="mmHg"
                    />
                </View>
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Pulse (bpm)</Text>
                <TextInput
                    style={styles.input}
                    value={formData.pulse?.toString()}
                    onChangeText={(text) => handleNumberChange('pulse', text)}
                    keyboardType="numeric"
                    placeholder="e.g. 72"
                />
            </View>


            <Text style={styles.sectionHeader}>Conditions & History</Text>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Diabetes Type</Text>
                <TextInput
                    style={styles.input}
                    value={formData.diabetes_type}
                    onChangeText={(text) => handleChange('diabetes_type', text)}
                    placeholder="Type 2"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Diabetes Duration</Text>
                <TextInput
                    style={styles.input}
                    value={formData.duration}
                    onChangeText={(text) => handleChange('duration', text)}
                    placeholder="e.g. 5 years"
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                    <Text style={styles.label}>Heart Failure?</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.heartFailure}
                        onChangeText={(text) => handleChange('heartFailure', text)}
                        placeholder="yes/no"
                    />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                    <Text style={styles.label}>Kidney Func.</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.kidneyFunction}
                        onChangeText={(text) => handleChange('kidneyFunction', text)}
                        placeholder="normal/abnormal"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Medications</Text>
                <TextInput
                    style={styles.input}
                    value={formData.currentMedications}
                    onChangeText={(text) => handleChange('currentMedications', text)}
                    placeholder="e.g. Metformin, Insulin"
                    multiline
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Other Conditions (Symptom/Comorbidities)</Text>
                <TextInput
                    style={styles.input}
                    value={formData.currentSymptoms}
                    onChangeText={(text) => handleChange('currentSymptoms', text)}
                    placeholder="e.g. Neuropathy, Vision loss"
                    multiline
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Get Recommendations</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
        color: '#007AFF',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        marginBottom: 5,
        color: '#555',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    readOnly: {
        backgroundColor: '#e0e0e0',
        color: '#666',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        marginBottom: 10,
        padding: 10,
    },
    backButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
});

export default HomeScreen;
