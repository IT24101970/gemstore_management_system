import apiClient from './apiClient';
import { ENDPOINTS } from '../endpoints';

export const auctionAPI = {
    getAll: async (params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${ENDPOINTS.AUCTIONS.GET_ALL}${queryString ? '?' + queryString : ''}`;
            const response = await apiClient.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getLive: async () => {
        try {
            const response = await apiClient.get(ENDPOINTS.AUCTIONS.GET_LIVE);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await apiClient.get(ENDPOINTS.AUCTIONS.GET_BY_ID(id));
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getMyParticipation: async () => {
        try {
            const response = await apiClient.get(ENDPOINTS.BIDS.GET_MY_PARTICIPATION);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default auctionAPI;