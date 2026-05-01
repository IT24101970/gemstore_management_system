// api/services/gemstoneAPI.js
import { getApiClient, initializeApiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';

export const gemstoneAPI = {
    getAll: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.GEMS.GET_ALL);
            return response.data;
        } catch (error) {
            console.error('Error fetching gemstones:', error);
            throw error;
        }
    },

    search: async (params) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.GEMS.SEARCH, { params });
            return response.data;
        } catch (error) {
            console.error('Error searching gemstones:', error);
            throw error;
        }
    },

    getOne: async (id) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.GEMS.GET_BY_ID(id));
            return response.data;
        } catch (error) {
            console.error('Error fetching gemstone:', error);
            throw error;
        }
    },
};

export default gemstoneAPI;