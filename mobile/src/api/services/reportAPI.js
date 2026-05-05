import { getApiClient, initializeApiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';

export const reportAPI = {
    submitReport: async (reportData) => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.post(ENDPOINTS.REPORTS.SUBMIT, reportData);
            return response.data;
        } catch (error) {
            console.error('Submit report error:', error);
            throw error;
        }
    },
    
    getMyReports: async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.REPORTS.MY_REPORTS);
            return response.data;
        } catch (error) {
            console.error('Get my reports error:', error);
            throw error;
        }
    }
};

export default reportAPI;
