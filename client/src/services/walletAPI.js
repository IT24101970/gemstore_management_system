const API_BASE_URL = 'http://localhost:5000/api/wallet';

const getToken = () => localStorage.getItem('token');

export const walletAPI = {
    // Get wallet balance
    getBalance: async () => {
        const response = await fetch(`${API_BASE_URL}/balance`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    // Get wallet summary
    getSummary: async () => {
        const response = await fetch(`${API_BASE_URL}/summary`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    // Get wallet dashboard transactions
    getWalletDashboardTransactions: async () => {
        const response = await fetch(`${API_BASE_URL}/dashboard-transactions`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    // Get all transactions with filter
    getTransactions: async (filter = 'all', page = 1, limit = 10) => {
        const response = await fetch(`${API_BASE_URL}/transactions?filter=${filter}&page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Request top-up with receipt (FormData)
    requestTopupWithReceipt: async (formData) => {
        const response = await fetch(`${API_BASE_URL}/request-topup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    // Get user's top-up requests
    getTopupRequests: async () => {
        const response = await fetch(`${API_BASE_URL}/topup-requests`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    // Delete top-up request
    deleteTopupRequest: async (id) => {
        const response = await fetch(`${API_BASE_URL}/topup-requests/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    }
};