// api/endpoints.js
import { API_BASE_URL } from '@env';

console.log('🔗 Using API Base URL:', API_BASE_URL);

export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    TIMEOUT: 10000,
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