// api/services/apiClient.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';


let apiClient = null;
let initializationPromise = null;

export const initializeApiClient = async () => {
    if (initializationPromise) {
        return initializationPromise;
    }

    if (apiClient) {
        return apiClient;
    }

    initializationPromise = (async () => {
        try {
            console.log('✅ Initializing API client with base URL:', API_BASE_URL);

            apiClient = axios.create({
                baseURL: API_BASE_URL,
                timeout: 10000,
            });

            // Request interceptor
            apiClient.interceptors.request.use(
                async (config) => {
                    try {
                        const token = await AsyncStorage.getItem('token');
                        if (token) {
                            config.headers.Authorization = `Bearer ${token}`;
                        }
                    } catch (error) {
                        console.error('Error retrieving token:', error);
                    }
                    return config;
                },
                (error) => Promise.reject(error)
            );

            // Response interceptor
            apiClient.interceptors.response.use(
                (response) => response,
                async (error) => {
                    if (error.response?.status === 401) {
                        await AsyncStorage.removeItem('token');
                        await AsyncStorage.removeItem('user');
                    }
                    return Promise.reject(error.response?.data || error.message);
                }
            );

            initializationPromise = null;
            return apiClient;
        } catch (error) {
            console.error('❌ Error initializing API client:', error);
            initializationPromise = null;
            throw error;
        }
    })();

    return initializationPromise;
};

export const getApiClient = () => {
    if (!apiClient) {
        throw new Error('API Client not initialized. Call initializeApiClient first.');
    }
    return apiClient;
};

export default apiClient;