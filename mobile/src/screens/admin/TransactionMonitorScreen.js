import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    TextInput,
} from 'react-native';
import adminAPI from '../../api/services/adminAPI';

const TransactionMonitorScreen = ({ navigation }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState(null);
    const [filterType, setFilterType] = useState('all');

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllTransactions({ type: filterType });
            setTransactions(response.data || []);
            setSummary(response.summary || null);
        } catch (error) {
            console.error('Fetch transactions error:', error);
            Alert.alert('Error', 'Failed to load transactions.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchTransactions();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchTransactions();
    }, [filterType]);

    const getTransactionColor = (type) => {
        switch (type) {
            case 'deposit': return '#10b981';
            case 'withdrawal': return '#ef4444';
            case 'bid': return '#6366f1';
            case 'purchase': return '#f59e0b';
            case 'refund': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: getTransactionColor(item.type) + '20' }]}>
                    <Text style={[styles.typeText, { color: getTransactionColor(item.type) }]}>
                        {item.type.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.userName}>{item.userId?.name || 'System'}</Text>
                <Text style={styles.description}>{item.description}</Text>
                <View style={styles.footer}>
                    <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
                    <Text style={[styles.status, { color: item.status === 'completed' ? '#10b981' : '#f59e0b' }]}>
                        {item.status}
                    </Text>
                </View>
            </View>
        </View>
    );

    const FilterButton = ({ type, label }) => (
        <TouchableOpacity 
            style={[styles.filterBtn, filterType === type && styles.filterBtnActive]}
            onPress={() => setFilterType(type)}
        >
            <Text style={[styles.filterBtnText, filterType === type && styles.filterBtnTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transaction Monitor</Text>
                <View style={{ width: 40 }} />
            </View>

            {summary && (
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Volume</Text>
                        <Text style={styles.summaryValue}>${summary.totalVolume?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Count</Text>
                        <Text style={styles.summaryValue}>{summary.totalTransactions}</Text>
                    </View>
                </View>
            )}

            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[
                        { id: 'all', label: 'All' },
                        { id: 'deposit', label: 'Deposits' },
                        { id: 'purchase', label: 'Purchases' },
                        { id: 'bid', label: 'Bids' },
                        { id: 'refund', label: 'Refunds' },
                    ]}
                    renderItem={({ item }) => <FilterButton type={item.id} label={item.label} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No transactions found.</Text>
                        </View>
                    }
                />
            )}
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
    summaryContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        margin: 15,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    filterContainer: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    filterList: {
        paddingHorizontal: 15,
        gap: 10,
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        marginRight: 8,
    },
    filterBtnActive: {
        backgroundColor: '#667eea',
    },
    filterBtnText: {
        fontSize: 13,
        color: '#4b5563',
        fontWeight: '600',
    },
    filterBtnTextActive: {
        color: '#fff',
    },
    list: {
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    date: {
        fontSize: 11,
        color: '#9ca3af',
    },
    status: {
        fontSize: 11,
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
});

export default TransactionMonitorScreen;
