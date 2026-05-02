// api/services/auctionAPI.js
import { getApiClient, initializeApiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';

export const auctionAPI = {
    getAll: async (params) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.GET_ALL, { params });
            console.log('✅ Auctions fetched:', response);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all auctions:', error);
            throw error;
        }
    },

    getLive: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.GET_LIVE);
            console.log('✅ Live auctions fetched:', response);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching live auctions:', error);
            throw error;
        }
    },

    getOne: async (id) => {
        try {
            console.log('📥 Fetching auction:', id);
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.GET_BY_ID(id));
            console.log('📊 Full response from getOne:', response);

            // Return the full response (axios wraps it in .data)
            return response;
        } catch (error) {
            console.error('❌ Error fetching auction:', error);
            throw error;
        }
    },

    getBids: async (id) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.GET_BIDS(id));
            console.log('✅ Bids fetched:', response);
            return response;
        } catch (error) {
            console.error('❌ Error fetching bids:', error);
            throw error;
        }
    },

    getAvailableGemstones: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.AVAILABLE_GEMS);
            console.log('✅ Available gemstones fetched:', response);
            return response;
        } catch (error) {
            console.error('❌ Error fetching available gemstones:', error);
            throw error;
        }
    },

    create: async (data) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.post(ENDPOINTS.AUCTIONS.CREATE, data);
            console.log('✅ Auction created:', response);
            return response;
        } catch (error) {
            console.error('❌ Error creating auction:', error);
            throw error;
        }
    },

    placeBid: async (id, bidAmount) => {
        try {
            console.log('🎯 Placing bid:', { auctionId: id, bidAmount });
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.post(ENDPOINTS.AUCTIONS.PLACE_BID(id), { bidAmount });
            console.log('✅ Bid placed:', response);
            return response;
        } catch (error) {
            console.error('❌ Error placing bid:', error);
            throw error;
        }
    },

    getMyParticipation: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.MY_PARTICIPATION);
            console.log('✅ My participation fetched:', response);
            return response;
        } catch (error) {
            console.error('❌ Error fetching auction participation:', error);
            throw error;
        }
    },

    getSellerAuctions: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.AUCTIONS.SELLER_AUCTIONS);
            console.log('✅ Seller auctions fetched:', response);
            return response;
        } catch (error) {
            console.error('❌ Error fetching seller auctions:', error);
            throw error;
        }
    },
};

export default auctionAPI;