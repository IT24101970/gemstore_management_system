// src/context/AuthContext.js
import React, { createContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApiClient } from '../api/services/apiClient';
import authAPI from '../api/services/authAPI';

export const AuthContext = createContext();

const initialState = {
    isLoading: true,
    isSignout: false,
    userToken: null,
    user: null,
    serverConfigured: false,
};

const reducer = (prevState, action) => {
    switch (action.type) {
        case 'RESTORE_TOKEN':
            return {
                ...prevState,
                userToken: action.payload.token,
                user: action.payload.user,
                isLoading: false,
                serverConfigured: true,
            };
        case 'SIGN_IN':
            return {
                ...prevState,
                isSignout: false,
                userToken: action.payload.token,
                user: action.payload.user,
            };
        case 'SIGN_OUT':
            return {
                ...prevState,
                isSignout: true,
                userToken: null,
                user: null,
            };
        case 'SIGN_UP':
            return {
                ...prevState,
                isSignout: false,
                userToken: action.payload.token,
                user: action.payload.user,
            };
        default:
            return prevState;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        const bootstrapAsync = async () => {
            try {
                console.log('Bootstrapping auth...');
                // Initialize API client
                await initializeApiClient();
                console.log('API client initialized');

                // Check for existing token
                const token = await AsyncStorage.getItem('token');
                const user = await AsyncStorage.getItem('user');

                console.log('Restored token:', token ? 'exists' : 'not found');

                dispatch({
                    type: 'RESTORE_TOKEN',
                    payload: {
                        token: token,
                        user: user ? JSON.parse(user) : null,
                    },
                });
            } catch (e) {
                console.error('Error bootstrapping app:', e);
                dispatch({
                    type: 'RESTORE_TOKEN',
                    payload: { token: null, user: null },
                });
            }
        };

        bootstrapAsync();
    }, []);

    const authContext = React.useMemo(
        () => ({
            signIn: async (credentials) => {
                try {
                    console.log('Sign in attempt...');
                    const response = await authAPI.login(credentials);
                    console.log('Sign in successful');

                    dispatch({
                        type: 'SIGN_IN',
                        payload: {
                            token: response.data.token,
                            user: response.data.user,
                        },
                    });
                    return response;
                } catch (error) {
                    console.error('Sign in error:', error);
                    throw error;
                }
            },

            signUp: async (userData) => {
                try {
                    const response = await authAPI.register(userData);
                    dispatch({
                        type: 'SIGN_UP',
                        payload: {
                            token: response.data.token,
                            user: response.data.user,
                        },
                    });
                    return response;
                } catch (error) {
                    console.error('Sign up error:', error);
                    throw error;
                }
            },

            signOut: async () => {
                try {
                    await authAPI.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    dispatch({ type: 'SIGN_OUT' });
                }
            },
        }),
        []
    );

    return (
        <AuthContext.Provider value={{ ...state, ...authContext }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};