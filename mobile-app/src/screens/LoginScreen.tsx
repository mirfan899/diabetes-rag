import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { AuthService } from '../services/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!identifier.trim()) {
            Alert.alert("Error", "Please enter your identifier (Email or Phone).");
            return;
        }

        setLoading(true);
        try {
            const success = await AuthService.login(identifier);
            if (success) {
                navigation.replace('DoctorProfile');
            } else {
                Alert.alert("Error", "Login failed.");
            }
        } catch (error) {

            Alert.alert("Error", "An unexpected error occurred.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Doctor Login</Text>
                <Text style={styles.subtitle}>Sign in to access the system</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Identifier (Email or Phone)</Text>
                    <TextInput
                        style={styles.input}
                        value={identifier}
                        onChangeText={setIdentifier}
                        placeholder="e.g. doctor@example.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>LOGIN</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
    },
    content: {
        padding: 30,
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        color: '#666',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#444',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#f9f9f9',
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
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
