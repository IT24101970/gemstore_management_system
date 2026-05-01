import apiClient from './apiClient';
import { ENDPOINTS } from '../endpoints';

export const walletAPI = {
    getSummary: async () => {
        try {
            const response = await apiClient.get(ENDPOINTS.WALLET.SUMMARY);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getBalance: async () => {
        try {
            const response = await apiClient.get(ENDPOINTS.WALLET.BALANCE);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getTransactions: async (params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${ENDPOINTS.WALLET.TRANSACTIONS}${queryString ? '?' + queryString : ''}`;
            const response = await apiClient.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default walletAPI;