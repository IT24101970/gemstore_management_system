import { getApiClient, initializeApiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';

const savedReportAPI = {
    create: async (data) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.post(ENDPOINTS.ADMIN.SAVED_REPORTS.CREATE, data);
        return response.data;
    },

    getAll: async (params = {}) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.get(ENDPOINTS.ADMIN.SAVED_REPORTS.GET_ALL, { params });
        return response.data;
    },

    getById: async (id) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.get(ENDPOINTS.ADMIN.SAVED_REPORTS.GET_BY_ID(id));
        return response.data;
    },

    update: async (id, data) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.put(ENDPOINTS.ADMIN.SAVED_REPORTS.UPDATE(id), data);
        return response.data;
    },

    delete: async (id) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.delete(ENDPOINTS.ADMIN.SAVED_REPORTS.DELETE(id));
        return response.data;
    },

    refresh: async (id) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.post(ENDPOINTS.ADMIN.SAVED_REPORTS.REFRESH(id));
        return response.data;
    },

    export: async (id) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.get(ENDPOINTS.ADMIN.SAVED_REPORTS.EXPORT(id));
        return response.data;
    },
};

export default savedReportAPI;