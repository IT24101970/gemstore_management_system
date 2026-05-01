// src/api/endpoints.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default fallback URL
const DEFAULT_BASE_URL = 'http://192.168.1.100:5000/api';

export const API_CONFIG = {
    BASE_URL: DEFAULT_BASE_URL,
    TIMEOUT: 10000,
};

export const setApiBaseUrl = (url) => {
    API_CONFIG.BASE_URL = url;
};

export const getApiBaseUrl = async () => {
    try {
        const saved = await AsyncStorage.getItem('SERVER_URL');
        return saved || DEFAULT_BASE_URL;
    } catch (error) {
        return DEFAULT_BASE_URL;
    }
};

export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
    },
    AUCTIONS: {
        GET_ALL: '/auctions',
        GET_LIVE: '/auctions/live',
        GET_BY_ID: (id) => `/auctions/${id}`,
    },
    BIDS: {
        PLACE_BID: (auctionId) => `/auctions/${auctionId}/bid`,
        GET_BIDS: (auctionId) => `/auctions/${auctionId}/bids`,
        GET_MY_PARTICIPATION: '/auctions/my-participation',
    },
    GEMS: {
        GET_ALL: '/gemstones',
        GET_BY_ID: (id) => `/gemstones/${id}`,
        SEARCH: '/gemstones/search',
    },
    WALLET: {
        BALANCE: '/wallet/balance',
        SUMMARY: '/wallet/summary',
        TRANSACTIONS: '/wallet/transactions',
    },
    EVENTS: {
        GET_ALL: '/events',
        GET_BY_ID: (id) => `/events/${id}`,
    },
    USERS: {
        PROFILE: '/users/profile',
        UPDATE_PROFILE: '/users/profile',
    },
};