import React, { useState, useEffect } from 'react';
import {
    View,
    FlatList,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import auctionAPI from '../../api/services/auctionAPI';
import { useAuth } from '../../context/AuthContext';

const AuctionListScreen = ({ navigation }) => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { signOut } = useAuth();

    useEffect(() => {
        fetchAuctions();
    }, []);

    const fetchAuctions = async () => {
        try {
            setLoading(true);
            const response = await auctionAPI.getLive();
            setAuctions(response.data || []);
            setError('');
        } catch (err) {
            setError(err?.message || 'Failed to load auctions');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderAuctionCard = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AuctionDetail', { auctionId: item._id })}
        >
            <Text style={styles.title}>{item.gemId?.title || 'Auction'}</Text>
            <Text style={styles.price}>${item.currentPrice}</Text>
            <Text style={styles.bids}>{item.totalBids || 0} bids</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchAuctions}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Live Auctions</Text>
                <TouchableOpacity onPress={signOut}>
                    <Text style={styles.logoutButton}>Logout</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={auctions}
                renderItem={renderAuctionCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        backgroundColor: '#667eea',
        padding: 16,
        paddingTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoutButton: {
        color: '#fff',
        fontSize: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#667eea',
        marginBottom: 4,
    },
    bids: {
        fontSize: 12,
        color: '#9ca3af',
    },
    errorText: {
        color: '#ef4444',
        marginBottom: 16,
        fontSize: 16,
    },
    retryButton: {
        backgroundColor: '#667eea',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default AuctionListScreen;