const API_BASE_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Generic API call function with JWT
const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    const isFormData = options.body instanceof FormData;

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                ...(!isFormData && { 'Content-Type': 'application/json' }),
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Auth API
export const authAPI = {
    register: (userData) => apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),
    login: (credentials) => apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),
    getMe: () => apiCall('/auth/me'),
    updateAddress: (shippingAddress) => apiCall('/auth/me/address', {
        method: 'PUT',
        body: JSON.stringify({ shippingAddress })
    }).then((response) => response.data),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return apiCall('/auth/logout', { method: 'POST' });
    }
};

// Gemstone API
export const gemstoneAPI = {
    getAll: () => apiCall('/gemstones'),
    search: (params) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/gemstones/search?${queryString}`);
    },
    getById: (id) => apiCall(`/gemstones/${id}`),
    purchase: (id, shippingAddress) => apiCall(`/gemstones/${id}/purchase`, {
        method: 'POST',
        body: JSON.stringify({ shippingAddress })
    }).then((response) => response.data),
};

// Auction API
export const auctionAPI = {
    getLive: () => apiCall('/auctions/live'),
    getById: (id) => apiCall(`/auctions/${id}`),
};

// Wallet API
export const walletAPI = {
    getBalance: () => apiCall('/wallet/balance').then((response) => response.data),
    getSummary: () => apiCall('/wallet/summary').then((response) => response.data),
    getTransactions: (params) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/wallet/transactions?${queryString}`).then((response) => response.data);
    },
    getWalletDashboardTransactions: async () => {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/wallet/dashboard-transactions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },
    requestTopupWithReceipt: async (formData) => {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/wallet/request-topup', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData  // FormData with receipt file
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    }
};

export default {
    authAPI,
    gemstoneAPI,
    auctionAPI,
    walletAPI,
};
