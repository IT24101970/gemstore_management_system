import { getApiClient, initializeApiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authAPI = {
    login: async (credentials) => {
        try {
            // Ensure API client is initialized
            await initializeApiClient();
            const client = getApiClient();

            console.log('Attempting login with:', credentials.email);
            const response = await client.post(ENDPOINTS.AUTH.LOGIN, credentials);

            // Check the actual response structure
            if (response.data?.data?.token) {
                await AsyncStorage.setItem('token', response.data.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
            } else if (response.data?.token) {
                // Your backend might return token at top level
                await AsyncStorage.setItem('token', response.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
            } else {
                console.warn('⚠️ Token not found in response:', response.data);
            }

            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    register: async (userData) => {
        try {
            await initializeApiClient();
            const client = getApiClient();

            const response = await client.post(ENDPOINTS.AUTH.REGISTER, userData);

            if (response.data.data?.token) {
                await AsyncStorage.setItem('token', response.data.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
            }

            return response.data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            await initializeApiClient();
            const client = getApiClient();
            return await client.post(ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    getProfile: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.USERS.PROFILE);
            return response.data;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    },
};

export default authAPI;