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

    requestTopup: async (formData) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.post(ENDPOINTS.WALLET.REQUEST_TOPUP, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error requesting top-up:', error);
            throw error;
        }
    },

    updateTopupRequest: async (id, formData) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.put(ENDPOINTS.WALLET.UPDATE_TOPUP_REQUEST(id), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating top-up:', error);
            throw error;
        }
    },

    deleteTopupRequest: async (id) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.delete(ENDPOINTS.WALLET.DELETE_TOPUP_REQUEST(id));
            return response.data;
        } catch (error) {
            console.error('Error deleting top-up:', error);
            throw error;
        }
    },
};

export default walletAPI;
