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
} from 'react-native';
import adminAPI from '../../api/services/adminAPI';

const GemstoneApprovalsScreen = ({ navigation }) => {
    const [pendingGems, setPendingGems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
    const [selectedGemId, setSelectedGemId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchPendingGems = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getPendingGemstones();
            setPendingGems(response.data || []);
        } catch (error) {
            console.error('Fetch pending gems error:', error);
            Alert.alert('Error', 'Failed to load pending gemstones.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPendingGems();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchPendingGems();
    }, []);

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
                            setPendingGems(pendingGems.filter(item => item.gemstone?._id !== id));
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
            setPendingGems(pendingGems.filter(item => item.gemstone?._id !== selectedGemId));
            setRejectionModalVisible(false);
            setRejectionReason('');
        } catch (error) {
            Alert.alert('Error', 'Failed to reject gemstone.');
        }
    };

    const renderItem = ({ item }) => {
        const gem = item.gemstone;
        if (!gem) return null;

        const imageUrl = gem.images && gem.images.length > 0 
            ? gem.images[0].url 
            : 'https://via.placeholder.com/150?text=No+Image';

        return (
            <View style={styles.card}>
                <Image source={{ uri: imageUrl }} style={styles.gemImage} />
                <View style={styles.gemDetails}>
                    <Text style={styles.gemTitle}>{gem.title}</Text>
                    <Text style={styles.gemMeta}>{gem.type} • {gem.attributes?.carat} ct</Text>
                    <Text style={styles.gemPrice}>${gem.price}</Text>
                    <Text style={styles.sellerName}>Seller: {gem.sellerId?.name || 'Unknown'}</Text>
                    
                    <View style={styles.actionButtons}>
                        <TouchableOpacity 
                            style={[styles.btn, styles.approveBtn]}
                            onPress={() => handleApprove(gem._id)}
                        >
                            <Text style={styles.btnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.btn, styles.rejectBtn]}
                            onPress={() => openRejectionModal(gem._id)}
                        >
                            <Text style={styles.btnText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gem Approvals</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            ) : (
                <FlatList
                    data={pendingGems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.gemstone?._id || Math.random().toString()}
                    contentContainerStyle={styles.list}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No pending gemstones to review.</Text>
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
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    list: {
        padding: 15,
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
    gemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
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
