const API_BASE_URL = 'http://localhost:5000/api';

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
    console.log(`🌐 API Call: ${API_BASE_URL}${endpoint}`);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        console.log(`📥 Response status: ${response.status}`);

        const data = await response.json();
        console.log('📦 Response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('❌ API Error:', error);
        throw error;
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
    gemstoneAPI,
    auctionAPI,
};