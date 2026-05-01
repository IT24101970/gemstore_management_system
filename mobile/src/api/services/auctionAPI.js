// api/services/auctionAPI.js
import { getApiClient, initializeApiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';

export const auctionAPI = {
    getAll: async (params) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.GET_ALL, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching all auctions:', error);
            throw error;
        }
    },

    getLive: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.GET_LIVE);
            return response.data;
        } catch (error) {
            console.error('Error fetching live auctions:', error);
            throw error;
        }
    },

    getOne: async (id) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.GET_BY_ID(id));
            return response.data;
        } catch (error) {
            console.error('Error fetching auction:', error);
            throw error;
        }
    },

    getAvailableGemstones: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.AVAILABLE_GEMS);
            return response.data;
        } catch (error) {
            console.error('Error fetching available gemstones:', error);
            throw error;
        }
    },

    create: async (data) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.post(ENDPOINTS.AUCTIONS.CREATE, data);
            return response.data;
        } catch (error) {
            console.error('Error creating auction:', error);
            throw error;
        }
    },

    placeBid: async (id, bidAmount) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.post(ENDPOINTS.AUCTIONS.PLACE_BID(id), { bidAmount });
            return response.data;
        } catch (error) {
            console.error('Error placing bid:', error);
            throw error;
        }
    },

    getMyParticipation: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.MY_PARTICIPATION);
            return response.data;
        } catch (error) {
            console.error('Error fetching auction participation:', error);
            throw error;
        }
    },

    getSellerAuctions: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.SELLER_AUCTIONS);
            return response.data;
        } catch (error) {
            console.error('Error fetching seller auctions:', error);
            throw error;
        }
    },
};

export default auctionAPI;