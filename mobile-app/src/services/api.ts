import axios from 'axios';
import { RecommendationRequest, RecommendationResponse } from '../types';

// Android Emulator uses 10.0.2.2 for localhost
// iOS Simulator uses localhost
// Physical device needs the machine's local IP
const API_URL = 'http://10.0.2.2:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getRecommendations = async (data: RecommendationRequest): Promise<RecommendationResponse> => {
    try {
        const response = await api.post<RecommendationResponse>('/patients/recommendations', data);
        return response.data;
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        throw error;
    }
};

export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await api.get('/health');
        return response.data.status === 'healthy';
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
};
