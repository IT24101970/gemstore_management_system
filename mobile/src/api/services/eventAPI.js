// api/services/eventAPI.js
import { getApiClient, initializeApiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';

export const eventAPI = {
    getAll: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.EVENTS.GET_ALL);
            return response.data;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.EVENTS.GET_BY_ID(id));
            return response.data;
        } catch (error) {
            console.error('Error fetching event by id:', error);
            throw error;
        }
    },

    create: async (formData) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.post(ENDPOINTS.EVENTS.CREATE, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },


    update: async (id, formData) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.put(ENDPOINTS.EVENTS.GET_BY_ID(id), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    delete: async (id) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.delete(ENDPOINTS.EVENTS.GET_BY_ID(id));
        return response.data;
    },

    getPurchaseHistory: async () => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.get('/events/history');
        return response.data;
    },



};

export default eventAPI;
