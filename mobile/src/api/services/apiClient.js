// api/services/apiClient.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import { API_BASE_URL } from '@env';

let apiClient = null;
let initializationPromise = null;

const getLocalApiBaseUrl = () => {
    try {
        const scriptURL = NativeModules?.SourceCode?.scriptURL;
        if (!scriptURL) {
            return null;
        }

        const parsedUrl = new URL(scriptURL);
        if (!parsedUrl.hostname) {
            return null;
        }

        return `http://${parsedUrl.hostname}:5000/api`;
    } catch (error) {
        console.warn('Unable to derive local API URL from Expo bundle host:', error);
        return null;
    }
};

export const initializeApiClient = async () => {
    if (initializationPromise) {
        return initializationPromise;
    }

    if (apiClient) {
        return apiClient;
    }

    initializationPromise = (async () => {
        try {
            const fallbackBaseURL = getLocalApiBaseUrl();

            console.log('Initializing API client with base URL:', API_BASE_URL);
            if (fallbackBaseURL && fallbackBaseURL !== API_BASE_URL) {
                console.log('Local fallback API URL detected:', fallbackBaseURL);
            }

            apiClient = axios.create({
                baseURL: API_BASE_URL,
                timeout: 30000,
            });

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

            apiClient.interceptors.response.use(
                (response) => response,
                async (error) => {
                    const requestConfig = error.config || {};

                    if (
                        error.message === 'Network Error' &&
                        fallbackBaseURL &&
                        requestConfig.baseURL !== fallbackBaseURL &&
                        !requestConfig.__retriedWithFallback
                    ) {
                        console.warn(`Primary API unreachable. Retrying with local fallback: ${fallbackBaseURL}`);
                        return apiClient.request({
                            ...requestConfig,
                            baseURL: fallbackBaseURL,
                            __retriedWithFallback: true,
                        });
                    }

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
            console.error('Error initializing API client:', error);
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
