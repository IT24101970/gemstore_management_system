import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import eventAPI from '../../api/services/eventAPI';

const EventPurchaseHistoryScreen = ({ navigation }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        try {
            const data = await eventAPI.getPurchaseHistory();
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Event purchase history error:', error);
            Alert.alert('Error', 'Failed to load event purchase history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';

        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };


    const handleDownloadCSV = async () => {
        try {
            const csvData = await eventAPI.downloadPurchaseHistory();

            if (Platform.OS === 'web') {
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = 'event_purchase_history.csv';
                document.body.appendChild(link);
                link.click();

                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                return;
            }

            Alert.alert(
                'Download',
                'CSV download is easiest from the browser. Please open the app in web and press Download CSV.'
            );
        } catch (error) {
            console.error('CSV download error:', error);
            Alert.alert('Error', 'Failed to download purchase history');
        }
    };



    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.eventName}>{item.eventName || 'Unknown Event'}</Text>

            <Text style={styles.rowText}>Customer: {item.customerName || 'N/A'}</Text>
            <Text style={styles.rowText}>Email: {item.email || 'N/A'}</Text>
            <Text style={styles.rowText}>Gem: {item.gemName || 'N/A'}</Text>
            <Text style={styles.rowText}>Original Price: Rs. {item.originalPrice || 0}</Text>
            <Text style={styles.rowText}>
                Discount Percentage: {item.eventDiscountPercentage || item.discountPercentage || 0}%
            </Text>

            <Text style={styles.rowText}>
                Discount Amount: Rs. {item.discount || item.discountAmount || 0}
            </Text>
            <Text style={styles.finalPrice}>Final Price: Rs. {item.finalPrice || 0}</Text>
            <Text style={styles.rowText}>Date: {formatDate(item.date)}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Event Purchases</Text>

                <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadCSV}>
                    <Text style={styles.downloadBtnText}>Download CSV</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={history}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No event purchases found</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        backgroundColor: '#1f2937',
        padding: 20,
        paddingTop: 45,
    },
    backText: {
        color: '#c7d2fe',
        fontSize: 14,
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    list: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    eventName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
    },
    rowText: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 5,
    },
    finalPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#15803d',
        marginBottom: 5,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyContainer: {
        paddingTop: 80,
        alignItems: 'center',
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 16,
    },

    downloadBtn: {
        backgroundColor: '#16a34a',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 10,
    },

    downloadBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default EventPurchaseHistoryScreen;