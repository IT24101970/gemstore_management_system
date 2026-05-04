import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    TextInput,
    SafeAreaView,
    ScrollView,
    RefreshControl,
} from 'react-native';
import adminAPI from '../../api/services/adminAPI';

const GemstoneApprovalsScreen = ({ navigation }) => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
    const [selectedGemId, setSelectedGemId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Gemstone types for filter
    const gemTypes = ['all', 'Blue Sapphire', 'Padparadscha', 'Ruby', 'Yellow Sapphire', 'Emerald', 'Other'];

    const fetchListings = async () => {
        try {
            setLoading(true);
            // Fetch all listings first
            const response = await adminAPI.getAllGemstones();
            let allListings = response.data || [];

            // Calculate stats
            const pending = allListings.filter(g => g.approvalStatus === 'pending').length;
            const approved = allListings.filter(g => g.approvalStatus === 'approved').length;
            const rejected = allListings.filter(g => g.approvalStatus === 'rejected').length;
            setStats({ pending, approved, rejected, total: allListings.length });

            // Filter by active tab
            let filtered = allListings;
            if (activeTab !== 'all') {
                filtered = allListings.filter(g => g.approvalStatus === activeTab);
            }

            // Apply search filter
            if (searchQuery) {
                filtered = filtered.filter(g =>
                    g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    g.type?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            // Apply type filter
            if (selectedType !== 'all') {
                filtered = filtered.filter(g => g.type === selectedType);
            }

            // Apply price filter
            if (minPrice) {
                filtered = filtered.filter(g => g.price >= parseFloat(minPrice));
            }
            if (maxPrice) {
                filtered = filtered.filter(g => g.price <= parseFloat(maxPrice));
            }

            setListings(filtered);
        } catch (error) {
            console.error('Fetch listings error:', error);
            Alert.alert('Error', 'Failed to load gemstone listings.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getAllGemstones();
            const allListings = response.data || [];
            const pending = allListings.filter(g => g.approvalStatus === 'pending').length;
            const approved = allListings.filter(g => g.approvalStatus === 'approved').length;
            const rejected = allListings.filter(g => g.approvalStatus === 'rejected').length;
            setStats({ pending, approved, rejected, total: allListings.length });
        } catch (error) {
            console.error('Fetch stats error:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchListings();
        await fetchStats();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchListings();
        fetchStats();
    }, [activeTab, searchQuery, selectedType, minPrice, maxPrice]);

    const handleApprove = (id) => {
        Alert.alert(
            'Confirm Approval',
            'Are you sure you want to approve this gemstone listing?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await adminAPI.approveGemstone(id);
                            Alert.alert('Success', 'Gemstone approved successfully.');
                            fetchListings();
                            fetchStats();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to approve gemstone.');
                        }
                    }
                }
            ]
        );
    };

    const openRejectionModal = (id) => {
        setSelectedGemId(id);
        setRejectionModalVisible(true);
    };

    const handleReject = async () => {
        if (!rejectionReason) {
            Alert.alert('Error', 'Please provide a reason for rejection.');
            return;
        }

        try {
            await adminAPI.rejectGemstone(selectedGemId, rejectionReason);
            Alert.alert('Success', 'Gemstone rejected.');
            fetchListings();
            fetchStats();
            setRejectionModalVisible(false);
            setRejectionReason('');
        } catch (error) {
            Alert.alert('Error', 'Failed to reject gemstone.');
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

    const renderItem = ({ item }) => {
        const imageUrl = item.images && item.images.length > 0
            ? item.images[0].url
            : 'https://via.placeholder.com/150?text=No+Image';

        return (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => navigation.navigate('GemDetail', { gemId: gem._id, gem: gem, fromApproval: true })}
            >
                <Image source={{ uri: imageUrl }} style={styles.gemImage} />
                <View style={styles.gemDetails}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.gemTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.approvalStatus) }]}>
                            <Text style={styles.statusText}>{getStatusText(item.approvalStatus)}</Text>
                        </View>
                    </View>
                    <Text style={styles.gemMeta}>{item.type} • {item.attributes?.carat} ct</Text>
                    <Text style={styles.gemPrice}>${item.price}</Text>
                    <Text style={styles.sellerName}>Seller: {item.sellerId?.name || 'Unknown'}</Text>

                    {item.approvalStatus === 'pending' && (
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

                    {item.approvalStatus === 'rejected' && item.rejectionReason && (
                        <View style={styles.rejectionReason}>
                            <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                            <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gem Approvals</Text>
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

            {/* Filter Button */}
            <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilters(!showFilters)}
            >
                <Text style={styles.filterButtonText}>🔍 {showFilters ? 'Hide Filters' : 'Show Filters'}</Text>
            </TouchableOpacity>

            {/* Filters Section */}
            {showFilters && (
                <View style={styles.filtersContainer}>
                    <TextInput
                        style={styles.filterInput}
                        placeholder="Search by title or type..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <View style={styles.filterRow}>
                        <TextInput
                            style={[styles.filterInput, styles.priceInput]}
                            placeholder="Min Price"
                            value={minPrice}
                            onChangeText={setMinPrice}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={[styles.filterInput, styles.priceInput]}
                            placeholder="Max Price"
                            value={maxPrice}
                            onChangeText={setMaxPrice}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.typeFilterRow}>
                        {gemTypes.map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.typeChip, selectedType === type && styles.activeTypeChip]}
                                onPress={() => setSelectedType(type)}
                            >
                                <Text style={[styles.typeChipText, selectedType === type && styles.activeTypeChipText]}>
                                    {type === 'all' ? 'All' : type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            ) : (
                <FlatList
                    data={listings}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No {activeTab} gemstone listings.</Text>
                        </View>
                    }
                />
            )}

            {/* Rejection Modal */}
            <Modal
                visible={rejectionModalVisible}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reject Listing</Text>
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
    filterButton: {
        backgroundColor: '#667eea',
        marginHorizontal: 15,
        marginBottom: 10,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    filterButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    filtersContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 10,
        padding: 12,
        borderRadius: 10,
    },
    filterInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        marginBottom: 10,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
    },
    priceInput: {
        flex: 1,
    },
    typeFilterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 5,
    },
    typeChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    activeTypeChip: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    typeChipText: {
        fontSize: 12,
        color: '#6b7280',
    },
    activeTypeChipText: {
        color: '#fff',
    },
    list: {
        padding: 15,
        paddingTop: 5,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        overflow: 'hidden',
        flexDirection: 'row',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    gemImage: {
        width: 120,
        height: '100%',
    },
    gemDetails: {
        flex: 1,
        padding: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    gemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    gemMeta: {
        fontSize: 13,
        color: '#6b7280',
        marginVertical: 4,
    },
    gemPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#667eea',
    },
    sellerName: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 8,
    },
    btn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
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
        fontSize: 12,
        fontWeight: 'bold',
    },
    rejectionReason: {
        marginTop: 10,
        padding: 8,
        backgroundColor: '#fef2f2',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fee2e2',
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

export default GemstoneApprovalsScreen;