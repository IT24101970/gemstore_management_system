const API_BASE_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Generic API call function with JWT
const apiCall = async (endpoint, options = {}) => {
    const token = getToken();

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            // If unauthorized, clear token and redirect to login
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
    // Register
    register: (userData) => apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),

    // Login
    login: (credentials) => apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),

    // Get current user
    getMe: () => apiCall('/auth/me'),

    // Logout
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
};

// Auction API
export const auctionAPI = {
    getLive: () => apiCall('/auctions/live'),
    getById: (id) => apiCall(`/auctions/${id}`),
};

export default {
    authAPI,
    gemstoneAPI,
    auctionAPI,
};