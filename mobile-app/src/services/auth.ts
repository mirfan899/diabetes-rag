import AsyncStorage from '@react-native-async-storage/async-storage';

const EULA_ACCEPTED_KEY = 'EULA_ACCEPTED';
const AUTH_TOKEN_KEY = 'AUTH_TOKEN';
const DOCTOR_NAME_KEY = 'DOCTOR_NAME';

export const AuthService = {
    async isEulaAccepted(): Promise<boolean> {
        const value = await AsyncStorage.getItem(EULA_ACCEPTED_KEY);
        return value === 'true';
    },

    async setEulaAccepted(): Promise<void> {
        await AsyncStorage.setItem(EULA_ACCEPTED_KEY, 'true');
    },

    async login(identifier: string): Promise<boolean> {
        if (identifier) {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, 'dummy-token');
            await AsyncStorage.setItem(DOCTOR_NAME_KEY, identifier);
            return true;
        }
        return false;
    },

    async logout(): Promise<void> {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(DOCTOR_NAME_KEY);
    },

    async isAuthenticated(): Promise<boolean> {

        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

        return !!token;
    },

    async getDoctorName(): Promise<string | null> {
        return await AsyncStorage.getItem(DOCTOR_NAME_KEY);
    }
};
