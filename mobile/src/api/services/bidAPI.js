import apiClient from './apiClient';
import { ENDPOINTS } from '../endpoints';

export const bidAPI = {
    placeBid: async (auctionId, bidAmount) => {
        try {
            const response = await apiClient.post(
                ENDPOINTS.BIDS.PLACE_BID(auctionId),
                { bidAmount: parseFloat(bidAmount) }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getBids: async (auctionId) => {
        try {
            const response = await apiClient.get(ENDPOINTS.BIDS.GET_BIDS(auctionId));
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default bidAPI;