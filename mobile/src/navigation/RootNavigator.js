import React, { useState } from 'react';
import { ActivityIndicator, View, text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator  } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ConfigScreen from '../screens/settings/ConfigScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// App Screens
import HomeScreen from '../screens/home/HomeScreen';
import AuctionListScreen from '../screens/auctions/AuctionListScreen';
import AuctionDetailScreen from '../screens/auctions/AuctionDetailScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createStackNavigator ();
const Tab = createBottomTabNavigator();

// Auth Stack - Login/Register
const AuthStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
};

// Home Stack - Home + nested screens
const HomeStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animationEnabled: true,
            }}
        >
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="AuctionDetail" component={AuctionDetailScreen} />
        </Stack.Navigator>
    );
};

// Auctions Stack
const AuctionsStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animationEnabled: true,
            }}
        >
            <Stack.Screen name="AuctionsList" component={AuctionListScreen} />
            <Stack.Screen name="AuctionDetail" component={AuctionDetailScreen} />
        </Stack.Navigator>
    );
};

// Bottom Tab Navigator - Main app navigation
const AppTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarActiveTintColor: '#667eea',
                tabBarInactiveTintColor: '#9ca3af',
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStack}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: 24 }}>🏠</Text>
                    ),
                }}
            />

            <Tab.Screen
                name="AuctionsTab"
                component={AuctionsStack}
                options={{
                    tabBarLabel: 'Auctions',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: 24 }}>🔨</Text>
                    ),
                }}
            />

            <Tab.Screen
                name="WalletTab"
                component={WalletScreen}
                options={{
                    tabBarLabel: 'Wallet',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: 24 }}>💰</Text>
                    ),
                }}
            />

            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: 24 }}>👤</Text>
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

// Root Navigator - Main navigation structure
const RootNavigator = () => {
    const { isLoading, userToken } = useAuth();
    const [serverConfigured, setServerConfigured] = useState(false);

    React.useEffect(() => {
        checkServerConfig();
    }, []);

    const checkServerConfig = async () => {
        const savedUrl = await AsyncStorage.getItem('SERVER_URL');
        setServerConfigured(!!savedUrl);
    };

    const handleConfigSaved = async (url) => {
        await AsyncStorage.setItem('SERVER_URL', url);
        setServerConfigured(true);
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Server Configuration (First Time) */}
            {!serverConfigured ? (
                <Stack.Screen
                    name="Config"
                    options={{ animationEnabled: false }}
                >
                    {(props) => (
                        <ConfigScreen {...props} onConfigSaved={handleConfigSaved} />
                    )}
                </Stack.Screen>
            ) : userToken == null ? (
                // Auth Stack - Not logged in
                <Stack.Screen
                    name="Auth"
                    component={AuthStack}
                    options={{ animationEnabled: false }}
                />
            ) : (
                // App Stack - Logged in (Bottom Tab Navigation)
                <Stack.Screen
                    name="App"
                    component={AppTabs}
                    options={{ animationEnabled: false }}
                />
            )}
        </Stack.Navigator>
    );
};

export default RootNavigator;