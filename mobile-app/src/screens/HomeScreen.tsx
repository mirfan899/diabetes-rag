import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RecommendationRequest } from '../types';
import { getRecommendations } from '../services/api';

const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<RecommendationRequest>({
        guidelines: 'ADA',
        diabetes_type: 'Type 2',
        hba1cPercent: 8.5,
        // Add other defaults or leave empty
    });

    const handleChange = (field: keyof RecommendationRequest, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Ensure numeric fields are numbers
            const requestData = {
                ...formData,
                hba1cPercent: Number(formData.hba1cPercent),
                // Add parsers for other numeric fields if needed
            };
            const result = await getRecommendations(requestData);
            navigation.navigate('Result', { result });
        } catch (error) {
            Alert.alert('Error', 'Failed to get recommendations. Please check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>Diabetes RAG Advisor</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Diabetes Type</Text>
                <TextInput
                    style={styles.input}
                    value={formData.diabetes_type}
                    onChangeText={(text) => handleChange('diabetes_type', text)}
                    placeholder="e.g., Type 2"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>HbA1c (%)</Text>
                <TextInput
                    style={styles.input}
                    value={formData.hba1cPercent?.toString()}
                    onChangeText={(text) => handleChange('hba1cPercent', text)}
                    keyboardType="numeric"
                    placeholder="e.g., 8.5"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Medications</Text>
                <TextInput
                    style={styles.input}
                    value={formData.currentMedications}
                    onChangeText={(text) => handleChange('currentMedications', text)}
                    placeholder="e.g., Metformin"
                    multiline
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Medical History / Comorbidities</Text>
                <TextInput
                    style={styles.input}
                    value={formData.currentSymptoms} // Using currentSymptoms as a catch-all for now
                    onChangeText={(text) => handleChange('currentSymptoms', text)}
                    placeholder="e.g., Heart Failure, CKD"
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
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
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
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
