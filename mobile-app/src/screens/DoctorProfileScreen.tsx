import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../services/auth';

const DoctorProfileScreen = () => {
    const navigation = useNavigation<any>();
    const [doctorName, setDoctorName] = useState<string | null>('');

    useEffect(() => {
        const loadDoctorName = async () => {
            const name = await AuthService.getDoctorName();
            setDoctorName(name);
        };
        loadDoctorName();
    }, []);

    const handleLogout = async () => {
        try {
            await AuthService.logout();
            navigation.replace('Login');
        } catch (error) {
            Alert.alert('Error', 'Failed to logout');
        }
    };

    const startConsultation = () => {
        navigation.navigate('Home');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {doctorName ? doctorName.charAt(0).toUpperCase() : 'D'}
                    </Text>
                </View>
                <Text style={styles.welcomeText}>Welcome,</Text>
                <Text style={styles.doctorName}>{doctorName || 'Doctor'}</Text>
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionCard} onPress={startConsultation}>
                    <Text style={styles.actionTitle}>New Consultation</Text>
                    <Text style={styles.actionDesc}>Start a new patient prescription form</Text>
                </TouchableOpacity>

                {/* Placeholder for future features */}
                <View style={[styles.actionCard, styles.disabledCard]}>
                    <Text style={styles.actionTitle}>Patient History</Text>
                    <Text style={styles.actionDesc}>View past records (Coming Soon)</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    welcomeText: {
        fontSize: 18,
        color: '#666',
    },
    doctorName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5,
    },
    actionsContainer: {
        flex: 1,
    },
    actionCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    disabledCard: {
        opacity: 0.6,
        backgroundColor: '#f0f0f0',
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    actionDesc: {
        fontSize: 14,
        color: '#666',
    },
    logoutButton: {
        backgroundColor: '#ff3b30',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default DoctorProfileScreen;
