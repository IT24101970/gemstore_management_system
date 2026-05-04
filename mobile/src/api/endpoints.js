// api/endpoints.js
import { API_BASE_URL } from '@env';

console.log('🔗 Using API Base URL:', API_BASE_URL);

export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    WS_URL: API_BASE_URL.replace('http', 'ws').replace('/api', ''),
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
        CREATE: '/auctions',
        PLACE_BID: (id) => `/auctions/${id}/bid`,
        GET_BIDS: (id) => `/auctions/${id}/bids`,
        AVAILABLE_GEMS: '/auctions/available-gemstones',
        MY_PARTICIPATION: '/auctions/my-participation',
        SELLER_AUCTIONS: '/auctions/seller',
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
        CREATE: '/gemstones',
        MY_LISTINGS: '/gemstones/seller/my-listings',
        DELETE: (id) => `/gemstones/${id}`,
        UPDATE: (id) => `/gemstones/${id}`,
        PURCHASE: (id) => `/gemstones/${id}/purchase`,
    },
    WALLET: {
        BALANCE: '/wallet/balance',
        SUMMARY: '/wallet/summary',
        TRANSACTIONS: '/wallet/dashboard-transactions',
        REQUEST_TOPUP: '/wallet/request-topup',
    },
    EVENTS: {
        GET_ALL: '/events',
        GET_BY_ID: (id) => `/events/${id}`,
        CREATE: '/events',
    },
    USERS: {
        PROFILE: '/users/profile',
        UPDATE_PROFILE: '/users/profile',
    },
    ADMIN: {
        DASHBOARD_SUMMARY: '/admin/dashboard/summary',
        ANALYTICS: '/admin/analytics/dashboard',
        SELLERS: {
            PENDING: '/admin/sellers/pending',
            ALL: '/admin/sellers',
            APPROVE: (id) => `/admin/sellers/${id}/approve`,
            REJECT: (id) => `/admin/sellers/${id}/reject`,
        },
        GEMSTONES: {
            PENDING: '/admin/gemstones/pending',
            ALL: '/admin/gemstones',
            APPROVE: (id) => `/admin/gemstones/${id}/approve`,
            REJECT: (id) => `/admin/gemstones/${id}/reject`,
            STATS: '/admin/gemstones/stats/summary',
        },
        TOPUPS: {
            PENDING: '/admin/topups',
            ALL: '/admin/topups',
            APPROVE: (id) => `/admin/transactions/topups/${id}/approve`,
            REJECT: (id) => `/admin/transactions/topups/${id}/reject`,
            STATS: '/admin/topups/stats/summary',
        },
        TRANSACTIONS: {
            ALL: '/admin/transactions',
        },
        DISPUTES: {
            ALL: '/admin/disputes',
            UPDATE_STATUS: (id) => `/admin/disputes/${id}/status`,
            RESOLVE: (id) => `/admin/disputes/${id}/resolve`,
        },
        REPORTS: {
            TOP_SELLERS: '/admin/reports/top-sellers',
            TOP_GEMSTONES: '/admin/reports/top-gemstones',
            TOP_CUSTOMERS: '/admin/reports/top-customers',
            REVENUE_TIMELINE: '/admin/reports/revenue-timeline',
            GEM_TYPES: '/admin/reports/gem-types',
            APPROVAL_STATS: '/admin/reports/approval-stats',
        },
        SAVED_REPORTS: {
            CREATE: '/admin/saved-reports',
            GET_ALL: '/admin/saved-reports',
            GET_BY_ID: (id) => `/admin/saved-reports/${id}`,
            UPDATE: (id) => `/admin/saved-reports/${id}`,
            DELETE: (id) => `/admin/saved-reports/${id}`,
            REFRESH: (id) => `/admin/saved-reports/${id}/refresh`,
            EXPORT: (id) => `/admin/saved-reports/${id}/export`,
        },
    },
};