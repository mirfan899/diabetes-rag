console.error('[ResultScreen] EVALUATING');
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RecommendationResponse } from '../types';

const ResultScreen = () => {
    const route = useRoute<any>();
    const { result } = route.params as { result: RecommendationResponse };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>Recommendations</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medicines</Text>
                {result.medicines.length > 0 ? (
                    result.medicines.map((med, index) => (
                        <View key={index} style={styles.card}>
                            <Text style={styles.medName}>{med.medicine_name}</Text>
                            <Text style={styles.medDose}>{med.quantity_dose_strength}</Text>
                            <Text style={styles.medReason}>Reason: {med.reason.join(', ')}</Text>
                            {/* <Text style={styles.medRef}>Ref: {med.reference}</Text> */}
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No specific medicine recommendations.</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lifestyle Advice</Text>
                {result.lifestyle.map((item, index) => (
                    <Text key={index} style={styles.listItem}>• {item}</Text>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                {result.notes.map((item, index) => (
                    <Text key={index} style={styles.listItem}>• {item}</Text>
                ))}
            </View>
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
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#007AFF',
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    medName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    medDose: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    medReason: {
        fontSize: 14,
        color: '#555',
        marginTop: 5,
        fontStyle: 'italic',
    },
    emptyText: {
        fontStyle: 'italic',
        color: '#777',
    },
    listItem: {
        fontSize: 15,
        color: '#444',
        marginBottom: 6,
        lineHeight: 22,
    },
});

export default ResultScreen;
