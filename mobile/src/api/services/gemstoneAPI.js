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

    getById: async (id) => {
        return gemstoneAPI.getOne(id);
    },

    getMyListings: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.GEMS.MY_LISTINGS);
            return response.data;
        } catch (error) {
            console.error('Error fetching my listings:', error);
            throw error;
        }
    },

    create: async (formData) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.post(ENDPOINTS.GEMS.CREATE, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error creating listing:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.delete(ENDPOINTS.GEMS.DELETE(id));
            return response.data;
        } catch (error) {
            console.error('Error deleting gemstone:', error);
            throw error;
        }
    },

    update: async (id, formData) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.put(ENDPOINTS.GEMS.UPDATE(id), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating listing:', error);
            throw error;
        }
    },

    purchase: async (id, address) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.post(ENDPOINTS.GEMS.PURCHASE(id), { shippingAddress: address });
            return response.data;
        } catch (error) {
            console.error('Error purchasing gemstone:', error);
            throw error;
        }
    },
};

export default gemstoneAPI;