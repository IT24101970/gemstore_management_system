import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    SafeAreaView,
    ScrollView,
    RefreshControl,
} from 'react-native';
import adminAPI from '../../api/services/adminAPI';

const SellerApprovalsScreen = ({ navigation }) => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
    const [selectedSellerId, setSelectedSellerId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchSellers = async () => {
        try {
            setLoading(true);
            // Fetch all sellers from API
            const response = await adminAPI.getAllSellers();
            let allSellers = response.data || [];

            // Calculate stats
            const pending = allSellers.filter(s => s.verificationStatus === 'pending').length;
            const approved = allSellers.filter(s => s.verificationStatus === 'approved').length;
            const rejected = allSellers.filter(s => s.verificationStatus === 'rejected').length;
            setStats({ pending, approved, rejected, total: allSellers.length });

            // Filter by active tab
            let filtered = allSellers;
            if (activeTab !== 'all') {
                filtered = allSellers.filter(s => s.verificationStatus === activeTab);
            }

            // Apply search filter
            if (searchQuery) {
                filtered = filtered.filter(s =>
                    s.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            setSellers(filtered);
        } catch (error) {
            console.error('Fetch sellers error:', error);
            Alert.alert('Error', 'Failed to load seller registrations.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getAllSellers();
            const allSellers = response.data || [];
            const pending = allSellers.filter(s => s.verificationStatus === 'pending').length;
            const approved = allSellers.filter(s => s.verificationStatus === 'approved').length;
            const rejected = allSellers.filter(s => s.verificationStatus === 'rejected').length;
            setStats({ pending, approved, rejected, total: allSellers.length });
        } catch (error) {
            console.error('Fetch stats error:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchSellers();
        await fetchStats();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchSellers();
        fetchStats();
    }, [activeTab, searchQuery]);

    const handleApprove = (id) => {
        Alert.alert(
            'Confirm Approval',
            'Are you sure you want to approve this seller registration?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await adminAPI.approveSeller(id);
                            Alert.alert('Success', 'Seller approved successfully.');
                            fetchSellers();
                            fetchStats();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to approve seller.');
                        }
                    }
                }
            ]
        );
    };

    const openRejectionModal = (id) => {
        setSelectedSellerId(id);
        setRejectionModalVisible(true);
    };

    const handleReject = async () => {
        if (!rejectionReason) {
            Alert.alert('Error', 'Please provide a reason for rejection.');
            return;
        }

        try {
            await adminAPI.rejectSeller(selectedSellerId, rejectionReason);
            Alert.alert('Success', 'Registration rejected.');
            fetchSellers();
            fetchStats();
            setRejectionModalVisible(false);
            setRejectionReason('');
        } catch (error) {
            Alert.alert('Error', 'Failed to reject seller.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'approved': return '#10b981';
            case 'rejected': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            default: return status;
        }
    };

    const tabs = [
        { id: 'pending', label: 'Pending', count: stats.pending },
        { id: 'approved', label: 'Approved', count: stats.approved },
        { id: 'rejected', label: 'Rejected', count: stats.rejected },
        { id: 'all', label: 'All', count: stats.total },
    ];

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.businessName}>{item.businessName || 'Business Name Not Provided'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.verificationStatus) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.verificationStatus) }]}>
                        {getStatusText(item.verificationStatus)}
                    </Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.infoText}>Owner: {item.userId?.name || 'Unknown'}</Text>
                <Text style={styles.infoText}>Email: {item.userId?.email || 'Not provided'}</Text>
                <Text style={styles.infoText}>BR No: {item.businessRegistration || 'Not provided'}</Text>
                <Text style={styles.dateText}>Registered: {new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            {item.verificationStatus === 'rejected' && item.rejectionReason && (
                <View style={styles.rejectionReason}>
                    <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                    <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
                </View>
            )}

            {item.verificationStatus === 'pending' && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.btn, styles.approveBtn]}
                        onPress={() => handleApprove(item._id)}
                    >
                        <Text style={styles.btnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, styles.rejectBtn]}
                        onPress={() => openRejectionModal(item._id)}
                    >
                        <Text style={styles.btnText}>Reject</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seller Approvals</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Stats Cards */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
                    <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#10b98120' }]}>
                    <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.approved}</Text>
                    <Text style={styles.statLabel}>Approved</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#ef444420' }]}>
                    <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.rejected}</Text>
                    <Text style={styles.statLabel}>Rejected</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#667eea20' }]}>
                    <Text style={[styles.statValue, { color: '#667eea' }]}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
            </ScrollView>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                        onPress={() => setActiveTab(tab.id)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                            {tab.label} ({tab.count})
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by business name, owner, or email..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            ) : (
                <FlatList
                    data={sellers}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No {activeTab} registrations.</Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={rejectionModalVisible}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reject Registration</Text>
                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Reason for rejection..."
                            multiline
                            numberOfLines={4}
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalCancelBtn]}
                                onPress={() => setRejectionModalVisible(false)}
                            >
                                <Text style={styles.modalBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalRejectBtn]}
                                onPress={handleReject}
                            >
                                <Text style={styles.modalBtnText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backBtn: {
        color: '#667eea',
        fontWeight: 'bold',
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 15,
        paddingBottom: 5,
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginRight: 12,
        minWidth: 100,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginVertical: 10,
        borderRadius: 10,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#667eea',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    activeTabText: {
        color: '#fff',
    },
    searchContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 10,
        padding: 10,
        borderRadius: 10,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
    },
    list: {
        padding: 15,
        paddingTop: 5,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    businessName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardBody: {
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 2,
    },
    dateText: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 5,
    },
    rejectionReason: {
        marginTop: 10,
        padding: 8,
        backgroundColor: '#fef2f2',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fee2e2',
        marginBottom: 10,
    },
    rejectionLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    rejectionText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    btn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    approveBtn: {
        backgroundColor: '#10b981',
    },
    rejectBtn: {
        backgroundColor: '#ef4444',
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        width: '85%',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#1f2937',
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 10,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalCancelBtn: {
        backgroundColor: '#e5e7eb',
    },
    modalRejectBtn: {
        backgroundColor: '#ef4444',
    },
    modalBtnText: {
        fontWeight: 'bold',
        color: '#1f2937',
    },
});

export default SellerApprovalsScreen;