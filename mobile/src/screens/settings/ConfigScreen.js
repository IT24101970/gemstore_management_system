import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/services/apiClient';

const ConfigScreen = ({ navigation, onConfigSaved }) => {
    const [serverUrl, setServerUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        loadSavedUrl();
    }, []);

    const loadSavedUrl = async () => {
        try {
            const saved = await AsyncStorage.getItem('SERVER_URL');
            if (saved) {
                setServerUrl(saved);
            } else {
                // Default URL (will be overridden)
                setServerUrl('http://192.168.1.100:5000/api');
            }
        } catch (error) {
            console.error('Error loading URL:', error);
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        if (!serverUrl.trim()) {
            Alert.alert('Error', 'Please enter a server URL');
            return;
        }

        setTesting(true);
        try {
            // Test the connection
            const response = await apiClient.get(`${serverUrl}/auth/me`);

            // If we get here, connection works (even if 401)
            Alert.alert('Success', 'Server connection is working!');
        } catch (error) {
            Alert.alert('Connection Failed', error?.message || 'Cannot reach the server');
            console.error('Connection error:', error);
        } finally {
            setTesting(false);
        }
    };

    const saveUrl = async () => {
        if (!serverUrl.trim()) {
            Alert.alert('Error', 'Please enter a server URL');
            return;
        }

        try {
            await AsyncStorage.setItem('SERVER_URL', serverUrl);
            Alert.alert('Success', 'Server URL saved!');

            // Update the API client
            if (onConfigSaved) {
                onConfigSaved(serverUrl);
            }

            // Go back or navigate
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to save URL');
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Server Configuration</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Server URL</Text>
                <Text style={styles.hint}>
                    Example: http://192.168.1.100:5000/api
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter server URL"
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    editable={!testing}
                    placeholderTextColor="#999"
                />

                <TouchableOpacity
                    style={[styles.button, styles.testButton, testing && styles.disabled]}
                    onPress={testConnection}
                    disabled={testing}
                >
                    {testing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Test Connection</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={saveUrl}
                >
                    <Text style={styles.buttonText}>Save & Continue</Text>
                </TouchableOpacity>

                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>How to find your IP:</Text>
                    <Text style={styles.infoText}>
                        • Windows: Open CMD, type "ipconfig"
                    </Text>
                    <Text style={styles.infoText}>
                        • Mac/Linux: Open Terminal, type "ifconfig"
                    </Text>
                    <Text style={styles.infoText}>
                        • Look for IPv4 address (e.g., 192.168.x.x)
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#667eea',
        padding: 20,
        paddingTop: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#1a202c',
    },
    hint: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 14,
        color: '#1a202c',
    },
    button: {
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    testButton: {
        backgroundColor: '#10b981',
    },
    saveButton: {
        backgroundColor: '#667eea',
    },
    disabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: '#eff6ff',
        borderLeftWidth: 4,
        borderLeftColor: '#667eea',
        padding: 16,
        borderRadius: 8,
        marginTop: 20,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a202c',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 12,
        color: '#4b5563',
        marginBottom: 4,
    },
});

export default ConfigScreen;