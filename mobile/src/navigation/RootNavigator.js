import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Modal,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import walletAPI from '../api/services/walletAPI';
import { initializeApiClient } from '../api/services/apiClient';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import ReportProblemScreen from '../screens/profile/ReportProblemScreen';

import AuctionListScreen from '../screens/auctions/AuctionListScreen';
import AuctionDetailScreen from '../screens/auctions/AuctionDetailScreen';
import CreateAuctionScreen from '../screens/auctions/CreateAuctionScreen';

import EventListScreen from '../screens/event/EventListScreen';
import EventDetailScreen from '../screens/event/EventDetailScreen';
import ViewMyListing from '../screens/gems/ViewMyListing';
import CreateListingScreen from '../screens/gems/CreateListingScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import CreateEventScreen from '../screens/admin/CreateEventScreen';
import GemstoneApprovalsScreen from '../screens/admin/GemstoneApprovalsScreen';
import WalletTopupsScreen from '../screens/admin/WalletTopupsScreen';
import SellerApprovalsScreen from '../screens/admin/SellerApprovalsScreen';
import TransactionMonitorScreen from '../screens/admin/TransactionMonitorScreen';
import GemDetailScreen from '../screens/gems/GemDetailScreen';
import CheckoutScreen from '../screens/wallet/CheckoutScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ✅ TOP NAVBAR COMPONENT
const MobileNavBar = ({ navigation, balance = 0 }) => {
    const { user, signOut } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        await signOut();
    };

    return (
        <>
            {/* Top NavBar */}
            <SafeAreaView style={styles.navbar}>
                <View style={styles.navbarContainer}>
                    {/* Logo */}
                    <TouchableOpacity
                        style={styles.logo}
                        onPress={() => navigation.navigate('HomeTab')}
                    >
                        <Text style={styles.logoIcon}>💎</Text>
                        <Text style={styles.logoText}>Ceylon Gems</Text>
                    </TouchableOpacity>

                    {/* Right Actions */}
                    <View style={styles.navbarActions}>
                        {user ? (
                            <>
                                {/* Wallet - Display Only (Non-touchable) */}
                                <View style={styles.wallet}>
                                    <Text style={styles.walletText}>
                                        💰 ${balance.toFixed(2)}
                                    </Text>
                                </View>

                                {/* Logout */}
                                <TouchableOpacity
                                    style={styles.logoutBtnNav}
                                    onPress={() => setShowLogoutConfirm(true)}
                                >
                                    <Text style={styles.logoutBtnNavText}>Logout</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.loginBtn}
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    <Text style={styles.loginBtnText}>Login</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.registerBtn}
                                    onPress={() => navigation.navigate('Register')}
                                >
                                    <Text style={styles.registerBtnText}>Register</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </SafeAreaView>

            {/* Logout Confirmation Modal */}
            <Modal visible={showLogoutConfirm} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Confirm Logout</Text>
                        </View>

                        <View style={styles.modalContent}>
                            <Text style={styles.modalIcon}>🚪</Text>
                            <Text style={styles.modalMessage}>
                                Are you sure you want to logout?
                            </Text>
                            <Text style={styles.modalSubMessage}>
                                You'll need to login again to access your account.
                            </Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowLogoutConfirm(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmLogoutBtn}
                                onPress={handleLogout}
                            >
                                <Text style={styles.confirmLogoutBtnText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

// Auth Stack
const AuthStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
};

// Home Stack
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
            <Stack.Screen name="GemDetail" component={GemDetailScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
        </Stack.Navigator>
    );
};

const EventsStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animationEnabled: true,
            }}
        >
            <Stack.Screen name="EventsList" component={EventListScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
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
            <Stack.Screen name="CreateAuction" component={CreateAuctionScreen} />

        </Stack.Navigator>
    );
};

// Seller Stack
const SellerStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animationEnabled: true,
            }}
        >
            <Stack.Screen name="ViewMyListing" component={ViewMyListing} />
            <Stack.Screen name="CreateListing" component={CreateListingScreen} />
            <Stack.Screen name="CreateAuction" component={CreateAuctionScreen} />
            <Stack.Screen name="GemDetail" component={GemDetailScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
        </Stack.Navigator>
    );
};

// Admin Stack
const AdminStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animationEnabled: true,
            }}
        >
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
            <Stack.Screen name="GemstoneApprovals" component={GemstoneApprovalsScreen} />
            <Stack.Screen name="WalletTopups" component={WalletTopupsScreen} />
            <Stack.Screen name="SellerApprovals" component={SellerApprovalsScreen} />
            <Stack.Screen name="TransactionMonitor" component={TransactionMonitorScreen} />
            <Stack.Screen name="GemDetail" component={GemDetailScreen} />
        </Stack.Navigator>
    );
};

// Profile Stack
const ProfileStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animationEnabled: true,
            }}
        >
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Edit Profile' }} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: true, title: 'Change Password' }} />
            <Stack.Screen name="ReportProblem" component={ReportProblemScreen} options={{ headerShown: true, title: 'Report a Problem' }} />
        </Stack.Navigator>
    );
};

// Bottom Tab Navigator
const AppTabs = () => {
    const { user } = useAuth();
    const isSeller = user?.role === 'seller';
    const isAdmin = user?.role === 'admin';

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
                    height: 70,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginBottom: 4,
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
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏠</Text>,
                    tabBarTestID: 'homeTab',
                }}
            />

            <Tab.Screen
                name="AuctionsTab"
                component={AuctionsStack}
                options={{
                    tabBarLabel: 'Auctions',
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>🔴</Text>,
                    tabBarTestID: 'auctionsTab',
                }}
            />

            <Tab.Screen
                name="EventsTab"
                component={EventsStack}
                options={{
                    tabBarLabel: 'Events',
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>📅</Text>,
                }}
            />

            {isSeller && (
                <Tab.Screen
                    name="SellerDashboard"
                    component={SellerStack}
                    options={{
                        tabBarLabel: 'My Listings',
                        tabBarIcon: () => <Text style={{ fontSize: 24 }}>📊</Text>,
                        tabBarTestID: 'myListingsTab',
                    }}
                />
            )}

            {isAdmin && (
                <Tab.Screen
                    name="AdminDashboardTab"
                    component={AdminStack}
                    options={{
                        tabBarLabel: 'Admin Panel',
                        tabBarIcon: () => <Text style={{ fontSize: 24 }}>🛡️</Text>,
                    }}
                />
            )}

            <Tab.Screen
                name="WalletTab"
                component={WalletScreen}
                options={{
                    tabBarLabel: 'Wallet',
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>💰</Text>,
                }}
            />

            <Tab.Screen
                name="ProfileTab"
                component={ProfileStack}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text>,
                }}
            />
        </Tab.Navigator>
    );
};

// Main App Stack with NavBar
const AppStack = ({ balance }) => {
    return (
        <Stack.Navigator
            screenOptions={({ navigation }) => ({
                headerShown: true,
                header: () => <MobileNavBar navigation={navigation} balance={balance} />,
            })}
        >
            <Stack.Screen name="AppTabs" component={AppTabs} />
        </Stack.Navigator>
    );
};

// ... rest of the code ...

const RootNavigator = () => {
    const { isLoading, userToken, user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [balanceLoading, setBalanceLoading] = useState(false);

    // Fetch wallet balance when user is logged in
    useEffect(() => {
        if (userToken && user) {
            fetchWalletBalance();
        } else {
            // Not logged in — reset balance immediately
            setBalance(0);
            setBalanceLoading(false);
        }
    }, [userToken, user]);

    const fetchWalletBalance = async () => {
        try {
            setBalanceLoading(true);
            await initializeApiClient();
            const res = await walletAPI.getBalance();

            const balanceAmount =
                res.data?.balance ||
                res.balance ||
                res.data ||
                0;

            setBalance(typeof balanceAmount === 'number' ? balanceAmount : 0);
        } catch (error) {
            console.error('Failed to fetch wallet balance:', error);
            setBalance(0);
        } finally {
            setBalanceLoading(false);
        }
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
            {userToken == null ? (
                <Stack.Screen
                    name="Auth"
                    component={AuthStack}
                    options={{ animationEnabled: false }}
                />
            ) : (
                <Stack.Screen
                    name="App"
                    options={{ animationEnabled: false }}
                >
                    {(props) => <AppStack {...props} balance={balance} />}
                </Stack.Screen>
            )}
        </Stack.Navigator>
    );
};

// STYLES
const styles = StyleSheet.create({
    navbar: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    navbarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },

    logo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    logoIcon: {
        fontSize: 24,
    },
    logoText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a202c',
    },

    navbarActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    wallet: {
        backgroundColor: '#667eea',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    walletText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },

    logoutBtnNav: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    logoutBtnNavText: {
        color: '#dc2626',
        fontWeight: '600',
        fontSize: 12,
    },

    loginBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    loginBtnText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 12,
    },

    registerBtn: {
        backgroundColor: '#667eea',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    registerBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '80%',
        maxWidth: 400,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    modalHeader: {
        backgroundColor: '#fee2e2',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#fecaca',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#dc2626',
        textAlign: 'center',
    },
    modalContent: {
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        gap: 12,
    },
    modalIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a202c',
        textAlign: 'center',
    },
    modalSubMessage: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 18,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#374151',
        fontWeight: '700',
        fontSize: 14,
    },
    confirmLogoutBtn: {
        flex: 1,
        backgroundColor: '#dc2626',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmLogoutBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default RootNavigator;