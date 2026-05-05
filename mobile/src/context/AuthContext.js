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
        case 'UPDATE_USER':
            return {
                ...prevState,
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
                    console.log('Sign in attempt with:', credentials.email);

                    // ✅ authAPI.login already saves to AsyncStorage
                    const response = await authAPI.login(credentials);
                    console.log('Sign in response:', response);

                    // ✅ FIX: Extract token and user - response is already the data object
                    const token = response.token;
                    const user = response.user;

                    if (!token) {
                        console.error('No token in response:', response);
                        throw new Error('No token received from server');
                    }

                    console.log('Extracted token:', token);
                    console.log('Extracted user:', user);

                    // ✅ Update context state with the token and user
                    dispatch({
                        type: 'SIGN_IN',
                        payload: {
                            token: token,
                            user: user,
                        },
                    });

                    console.log('Sign in successful');
                    return response;
                } catch (error) {
                    console.error('Sign in error:', error);
                    throw error;
                }
            },

            signUp: async (userData) => {
                try {
                    console.log('Sign up attempt...');

                    // ✅ authAPI.register already saves to AsyncStorage
                    const response = await authAPI.register(userData);
                    console.log('Sign up response:', response);

                    // ✅ FIX: Extract token and user - response is already the data object
                    const token = response.token;
                    const user = response.user;

                    if (!token) {
                        console.error('No token in response:', response);
                        throw new Error('No token received from server');
                    }

                    // ✅ Update context state with the token and user
                    dispatch({
                        type: 'SIGN_UP',
                        payload: {
                            token: token,
                            user: user,
                        },
                    });

                    console.log('Sign up successful');
                    return response;
                } catch (error) {
                    console.error('Sign up error:', error);
                    throw error;
                }
            },

            signOut: async () => {
                try {
                    console.log('Sign out...');

                    // ✅ authAPI.logout already clears AsyncStorage
                    await authAPI.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    // ✅ Always dispatch SIGN_OUT to clear context state
                    dispatch({ type: 'SIGN_OUT' });
                }
            },
            
            updateUser: (newUser) => {
                dispatch({
                    type: 'UPDATE_USER',
                    payload: { user: newUser },
                });
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