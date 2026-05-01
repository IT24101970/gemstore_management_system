import React, { useEffect } from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import RootNavigator from '../src/navigation/RootNavigator';
import { initializeApiClient } from '../src/api/services/apiClient';

export default function App() {
    useEffect(() => {
        // Initialize API client when app starts
        initializeApiClient().catch(error => {
            console.error('Failed to initialize API client:', error);
        });
    }, []);

    return (
        <AuthProvider>
            <RootNavigator />
        </AuthProvider>
    );
}