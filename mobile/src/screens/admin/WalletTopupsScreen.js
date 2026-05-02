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
} from 'react-native';
import adminAPI from '../../api/services/adminAPI';

const WalletTopupsScreen = ({ navigation }) => {
    const [pendingTopups, setPendingTopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
    const [selectedTopupId, setSelectedTopupId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchPendingTopups = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getPendingTopups();
            setPendingTopups(response.data || []);
        } catch (error) {
            console.error('Fetch pending topups error:', error);
            Alert.alert('Error', 'Failed to load pending top-up requests.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPendingTopups();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchPendingTopups();
    }, []);

    const handleApprove = (id) => {
        Alert.alert(
            'Confirm Approval',
            'Are you sure you want to approve this wallet top-up?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await adminAPI.approveTopup(id);
                            Alert.alert('Success', 'Top-up approved successfully.');
                            setPendingTopups(pendingTopups.filter(item => item._id !== id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to approve top-up.');
                        }
                    }
                }
            ]
        );
    };

    const openRejectionModal = (id) => {
        setSelectedTopupId(id);
        setRejectionModalVisible(true);
    };

    const handleReject = async () => {
        if (!rejectionReason) {
            Alert.alert('Error', 'Please provide a reason for rejection.');
            return;
        }

        try {
            await adminAPI.rejectTopup(selectedTopupId, rejectionReason);
            Alert.alert('Success', 'Top-up rejected.');
            setPendingTopups(pendingTopups.filter(item => item._id !== selectedTopupId));
            setRejectionModalVisible(false);
            setRejectionReason('');
        } catch (error) {
            Alert.alert('Error', 'Failed to reject top-up.');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.userName}>{item.userId?.name || 'Unknown User'}</Text>
                <Text style={styles.amount}>${item.amount}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.infoText}>Ref: {item.bankReference || 'N/A'}</Text>
                <Text style={styles.infoText}>Method: {item.paymentMethod || 'Bank Transfer'}</Text>
                <Text style={styles.dateText}>Requested: {new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
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
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Wallet Top-ups</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            ) : (
                <FlatList
                    data={pendingTopups}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No pending top-up requests.</Text>
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
                        <Text style={styles.modalTitle}>Reject Top-up</Text>
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
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#667eea',
    },
    cardBody: {
        marginBottom: 15,
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

export default WalletTopupsScreen;
