import { getApiClient, initializeApiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';

const adminAPI = {
    // Seller Approvals
    getPendingSellers: async () => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.get(ENDPOINTS.ADMIN.SELLERS.PENDING);
        return response.data;
    },

    approveSeller: async (id) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.put(ENDPOINTS.ADMIN.SELLERS.APPROVE(id));
        return response.data;
    },

    rejectSeller: async (id, reason) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.put(ENDPOINTS.ADMIN.SELLERS.REJECT(id), { reason });
        return response.data;
    },

    // Gemstone Approvals
    getPendingGemstones: async () => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.get(ENDPOINTS.ADMIN.GEMSTONES.PENDING);
        return response.data;
    },

    approveGemstone: async (id) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.put(ENDPOINTS.ADMIN.GEMSTONES.APPROVE(id));
        return response.data;
    },

    rejectGemstone: async (id, reason) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.put(ENDPOINTS.ADMIN.GEMSTONES.REJECT(id), { reason });
        return response.data;
    },

    // Wallet Topups
    getPendingTopups: async () => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.get(ENDPOINTS.ADMIN.TOPUPS.PENDING, { params: { status: 'pending' } });
        return response.data;
    },

    approveTopup: async (id) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.put(ENDPOINTS.ADMIN.TOPUPS.APPROVE(id));
        return response.data;
    },

    rejectTopup: async (id, reason) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.put(ENDPOINTS.ADMIN.TOPUPS.REJECT(id), { reason });
        return response.data;
    },

    // Transactions
    getAllTransactions: async (params) => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.get(ENDPOINTS.ADMIN.TRANSACTIONS.ALL, { params });
        return response.data;
    },

    // Dashboard & Analytics
    getDashboardSummary: async () => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.get(ENDPOINTS.ADMIN.DASHBOARD_SUMMARY);
        return response.data;
    },

    getAnalytics: async (period = 'month') => {
        await initializeApiClient();
        const client = getApiClient();
        const response = await client.get(ENDPOINTS.ADMIN.ANALYTICS, { params: { period } });
        return response.data;
    }
};

export default adminAPI;
