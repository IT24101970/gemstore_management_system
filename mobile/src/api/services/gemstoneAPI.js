import { API_BASE_URL } from '../endpoints';

export const getGemstones = async (token) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/gemstones`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching gemstones:', error);
        throw error;
    }
};

export const getGemstoneById = async (id, token) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/gemstones/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching gemstone:', error);
        throw error;
    }
};