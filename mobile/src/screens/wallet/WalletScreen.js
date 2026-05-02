import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import walletAPI from '../../api/services/walletAPI';
import { formatPrice } from '../../utils/formatUtils';

const WalletScreen = () => {
    const [balance, setBalance] = useState(0);
    const [heldFunds, setHeldFunds] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Top-up state
    const [topupModalVisible, setTopupModalVisible] = useState(false);
    const [topupAmount, setTopupAmount] = useState('');
    const [bankReference, setBankReference] = useState('');
    const [receiptImage, setReceiptImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const balanceRes = await walletAPI.getBalance();
            const balanceData = balanceRes?.data || balanceRes;
            
            if (balanceData) {
                setBalance(balanceData.balance || 0);
                setHeldFunds(balanceData.heldFunds || 0);
            }

            const transRes = await walletAPI.getTransactions();
            const transData = transRes?.data?.transactions || transRes?.data || [];
            setTransactions(Array.isArray(transData) ? transData : []);
            
        } catch (error) {
            console.error('Wallet fetch error:', error);
            Alert.alert('Error', 'Failed to load wallet information');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchWalletData();
        }, [])
    );

    const handlePickReceipt = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera roll permissions are required.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                setReceiptImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking receipt:', error);
            Alert.alert('Error', 'Failed to pick receipt image');
        }
    };

    const handleTopupSubmit = async () => {
        if (!topupAmount || !bankReference || !receiptImage) {
            Alert.alert('Error', 'Please provide amount, reference, and upload a receipt.');
            return;
        }

        setIsSubmitting(true);
        try {
            const form = new FormData();
            form.append('amount', topupAmount);
            form.append('reference', bankReference);
            form.append('receipt', {
                uri: receiptImage.uri,
                name: receiptImage.fileName || 'receipt.jpg',
                type: receiptImage.mimeType || 'image/jpeg',
            });

            await walletAPI.requestTopup(form);
            Alert.alert('Success', 'Top-up requested successfully. Pending admin approval.');
            setTopupModalVisible(false);
            setTopupAmount('');
            setBankReference('');
            setReceiptImage(null);
            fetchWalletData();
        } catch (error) {
            console.error('Topup error:', error);
            Alert.alert('Error', 'Failed to submit top-up request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderTransaction = ({ item }) => {
        const isIncome = item.type === 'income' || item.type === 'deposit' || item.type === 'refund' || item.type === 'payment';
        return (
            <View style={styles.transactionCard}>
                <View style={styles.transLeft}>
                    <View style={[styles.iconBox, isIncome ? styles.iconGreen : styles.iconRed]}>
                        <Text style={styles.iconText}>
                            {isIncome ? '↓' : '↑'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.transTitle}>{item.description || item.type}</Text>
                        <Text style={styles.transDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>
                <Text style={[styles.transAmount, isIncome ? styles.textGreen : styles.textRed]}>
                    {isIncome ? '+' : '-'}{formatPrice(item.amount)}
                </Text>
            </View>
        );
    };

    if (loading && !balance) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerCard}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>{formatPrice(balance)}</Text>
                
                {heldFunds > 0 && (
                    <View style={styles.heldBox}>
                        <Text style={styles.heldText}>Held Funds (Active Bids): {formatPrice(heldFunds)}</Text>
                    </View>
                )}

                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setTopupModalVisible(true)}>
                        <Text style={styles.actionBtnText}>Deposit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.withdrawBtn]} onPress={() => Alert.alert('Coming Soon', 'Withdraw functionality will be available soon.')}>
                        <Text style={styles.actionBtnText}>Withdraw</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Top-Up Modal */}
            <Modal visible={topupModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Request Top-Up</Text>
                        
                        <TextInput
                            style={styles.input}
                            placeholder="Amount (USD) *"
                            keyboardType="numeric"
                            value={topupAmount}
                            onChangeText={setTopupAmount}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Bank Reference Number *"
                            value={bankReference}
                            onChangeText={setBankReference}
                        />

                        <TouchableOpacity style={styles.uploadBtn} onPress={handlePickReceipt}>
                            <Text style={styles.uploadBtnText}>
                                {receiptImage ? 'Change Receipt Image' : '+ Upload Receipt Image'}
                            </Text>
                        </TouchableOpacity>

                        {receiptImage && (
                            <Image source={{ uri: receiptImage.uri }} style={styles.previewImage} />
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelBtn]} 
                                onPress={() => setTopupModalVisible(false)}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.submitBtn]} 
                                onPress={handleTopupSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.transactionsContainer}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                {transactions.length === 0 ? (
                    <Text style={styles.emptyText}>No recent transactions.</Text>
                ) : (
                    <FlatList
                        data={transactions}
                        keyExtractor={(item) => item._id}
                        renderItem={renderTransaction}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCard: {
        backgroundColor: '#667eea',
        padding: 20,
        paddingTop: 40,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        alignItems: 'center',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    balanceLabel: {
        color: '#e0e7ff',
        fontSize: 16,
        marginBottom: 8,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    heldBox: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 20,
    },
    heldText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
        justifyContent: 'center',
    },
    actionBtn: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
        minWidth: 120,
        alignItems: 'center',
    },
    withdrawBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: '#fff',
    },
    actionBtnText: {
        color: '#4338ca',
        fontWeight: 'bold',
        fontSize: 16,
    },
    transactionsContainer: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 15,
    },
    emptyText: {
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 30,
    },
    transactionCard: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    transLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconGreen: {
        backgroundColor: '#d1fae5',
    },
    iconRed: {
        backgroundColor: '#fee2e2',
    },
    iconText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    transTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        textTransform: 'capitalize',
    },
    transDate: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    transAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    textGreen: {
        color: '#059669',
    },
    textRed: {
        color: '#dc2626',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#1f2937',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
    },
    uploadBtn: {
        borderWidth: 1,
        borderColor: '#667eea',
        borderStyle: 'dashed',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    uploadBtnText: {
        color: '#667eea',
        fontWeight: 'bold',
    },
    previewImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 15,
        resizeMode: 'cover',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    modalBtn: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#e5e7eb',
    },
    submitBtn: {
        backgroundColor: '#667eea',
    },
    cancelBtnText: {
        color: '#374151',
        fontWeight: 'bold',
    },
    submitBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default WalletScreen;