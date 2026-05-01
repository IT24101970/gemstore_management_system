// api/services/walletAPI.js
import { getApiClient, initializeApiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';

export const walletAPI = {
    getBalance: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.WALLET.BALANCE);
            return response.data;
        } catch (error) {
            console.error('Error fetching balance:', error);
            throw error;
        }
    },

    getSummary: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.WALLET.SUMMARY);
            return response.data;
        } catch (error) {
            console.error('Error fetching wallet summary:', error);
            throw error;
        }
    },

    getTransactions: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.WALLET.TRANSACTIONS);
            return response.data;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    },
};

export default walletAPI;