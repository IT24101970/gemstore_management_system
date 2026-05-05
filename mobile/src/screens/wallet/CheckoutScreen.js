import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    Platform,
} from 'react-native';
import gemstoneAPI from '../../api/services/gemstoneAPI';
import walletAPI from '../../api/services/walletAPI';

const CheckoutScreen = ({ route, navigation }) => {
    const { gem } = route.params;
    const [loading, setLoading] = useState(false);
    const [balanceLoading, setBalanceLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState(0);

    const [address, setAddress] = useState({
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Sri Lanka',
    });

    useEffect(() => {
        fetchWalletBalance();
    }, []);

    const fetchWalletBalance = async () => {
        try {
            setBalanceLoading(true);
            const res = await walletAPI.getBalance();
            const balanceAmount = res.data?.balance || res.balance || res.data || 0;
            setWalletBalance(typeof balanceAmount === 'number' ? balanceAmount : 0);
        } catch (error) {
            console.error('Failed to fetch wallet balance:', error);
            setWalletBalance(0);
        } finally {
            setBalanceLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!address.street || !address.city) {
            Alert.alert('Error', 'Please enter at least Street and City for the shipping address.');
            return;
        }

        if (walletBalance < finalPrice) {
            if (Platform.OS === 'web') {
                const confirmed = window.confirm(`Insufficient Balance\n\nYou need $${(gem.price - walletBalance).toFixed(2)} more to purchase this gem. Please top up your wallet. Click OK to go to Wallet.`);
                if (confirmed) navigation.navigate('WalletTab');
            } else {
                Alert.alert(
                    'Insufficient Balance',
                    `You need $${(finalPrice - walletBalance).toFixed(2)} more. Please top up your wallet.`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Top Up', onPress: () => navigation.navigate('WalletTab') }
                    ]
                );
            }
            return;
        }

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Confirm Purchase\n\nAre you sure you want to purchase ${gem.title} for $${gem.price.toFixed(2)}? This will be deducted from your wallet.`);
            if (confirmed) processPurchase();
        } else {
            Alert.alert(
                'Confirm Purchase',
                `Are you sure you want to purchase ${gem.title} for $${gem.price.toFixed(2)}? This will be deducted from your wallet.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: processPurchase }
                ]
            );
        }
    };

    const processPurchase = async () => {
        try {
            setLoading(true);
            await gemstoneAPI.purchase(gem._id, address);
            if (Platform.OS === 'web') {
                window.alert('Purchase Successful!\nYour gem will be shipped to your address.');
                navigation.navigate('HomeTab');
            } else {
                Alert.alert(
                    'Purchase Successful! 🎉',
                    'Your gem will be shipped to your address.',
                    [{ text: 'OK', onPress: () => navigation.navigate('HomeTab') }]
                );
            }

        } catch (error) {
            console.error('Purchase error full:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url,
                baseURL: error.config?.baseURL,
            });

            const errorMsg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                'An error occurred during checkout.';

            if (Platform.OS === 'web') {
                window.alert('Purchase Failed\n' + errorMsg);
            } else {
                Alert.alert('Purchase Failed', errorMsg);
            }
        }

        finally {
            setLoading(false);
        }
    };

    const finalPrice = gem.activeEventDiscountPercentage > 0
        ? gem.price * (1 - gem.activeEventDiscountPercentage / 100)
        : gem.price;
    const discount = gem.price - finalPrice;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.headerTitle}>Checkout</Text>

                {/* Order Summary */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Item</Text>
                        <Text style={styles.summaryValue}>{gem.title}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Original Price</Text>
                        <Text style={styles.summaryValue}>{`$${gem.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</Text>
                    </View>
                    {discount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: '#10b981' }]}>{`Event Discount (${gem.activeEventDiscountPercentage}%)`}</Text>
                            <Text style={{ color: '#10b981', fontWeight: '600' }}>{`-$${discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</Text>
                        </View>
                    )}
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{`$${finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</Text>
                    </View>
                </View>

                {/* Payment */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <View style={styles.walletRow}>
                        <Text style={styles.walletLabel}>Wallet Balance</Text>
                        {balanceLoading ? (
                            <ActivityIndicator size="small" color="#667eea" />
                        ) : (
                            <Text style={[styles.walletBalance, walletBalance < finalPrice && styles.insufficient]}>
                                {`$${walletBalance.toFixed(2)}`}
                            </Text>
                        )}
                    </View>
                    {walletBalance < finalPrice && !balanceLoading && (
                        <Text style={styles.errorText}>
                            {`Insufficient funds. You need $${(finalPrice - walletBalance).toFixed(2)} more.`}
                        </Text>
                    )}
                </View>

                {/* Shipping Address */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Shipping Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Street Address *"
                        value={address.street}
                        onChangeText={(text) => setAddress({ ...address, street: text })}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="City *"
                        value={address.city}
                        onChangeText={(text) => setAddress({ ...address, city: text })}
                    />
                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, styles.half]}
                            placeholder="State/Province"
                            value={address.state}
                            onChangeText={(text) => setAddress({ ...address, state: text })}
                        />
                        <TextInput
                            style={[styles.input, styles.half]}
                            placeholder="Postal Code"
                            value={address.postalCode}
                            onChangeText={(text) => setAddress({ ...address, postalCode: text })}
                        />
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Country"
                        value={address.country}
                        onChangeText={(text) => setAddress({ ...address, country: text })}
                    />
                </View>

                <View style={{ height: 110 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.payBtn, (loading || walletBalance < finalPrice || balanceLoading) && styles.disabledBtn]}
                    onPress={handleCheckout}
                    disabled={loading || walletBalance < finalPrice || balanceLoading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.payBtnText}>{`Pay $${finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', margin: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { fontSize: 15, color: '#6b7280' },
    summaryValue: { fontSize: 15, color: '#1f2937', fontWeight: '500' },
    totalRow: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10, marginTop: 4 },
    totalLabel: { fontSize: 17, fontWeight: 'bold', color: '#1f2937' },
    totalValue: { fontSize: 20, fontWeight: 'bold', color: '#667eea' },
    walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    walletLabel: { fontSize: 15, color: '#4b5563' },
    walletBalance: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },
    insufficient: { color: '#dc2626' },
    errorText: { color: '#dc2626', fontSize: 12, marginTop: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#f9fafb',
        fontSize: 15,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    half: { width: '48%' },
    footer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    payBtn: {
        backgroundColor: '#667eea',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    disabledBtn: { backgroundColor: '#9ca3af' },
    payBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default CheckoutScreen;
