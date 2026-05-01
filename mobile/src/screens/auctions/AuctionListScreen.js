import React, { useState, useEffect } from 'react';
import {
    View,
    FlatList,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    ScrollView,
} from 'react-native';
import auctionAPI from '../../api/services/auctionAPI';
import { useAuth } from '../../context/AuthContext';

const AuctionListScreen = ({ navigation }) => {
    const [auctions, setAuctions] = useState([]);
    const [upcomingAuctions, setUpcomingAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('ending-soon');
    const [searchQuery, setSearchQuery] = useState('');
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [ws, setWs] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);

    // WebSocket connection
    useEffect(() => {
        const websocket = new WebSocket('ws://localhost:5000');

        websocket.onopen = () => {
            console.log('✅ WebSocket connected');
            setWsConnected(true);
            setLoading(true);
            websocket.send(JSON.stringify({ type: 'get-auctions' }));
        };

        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'auctions-data') {
                    console.log('📊 Received auctions data:', data.data.length);
                    setAuctions(data.data);
                    setLoading(false);
                    setError('');
                } else if (data.type === 'auction-updated') {
                    console.log('🔄 Auction updated:', data.data.auctionId);
                    setAuctions(prevAuctions =>
                        prevAuctions.map(auction =>
                            auction._id === data.data.auctionId
                                ? {
                                    ...auction,
                                    currentPrice: data.data.currentPrice,
                                    totalBids: data.data.totalBids,
                                    winnerId: data.data.winnerId
                                }
                                : auction
                        )
                    );
                }
            } catch (err) {
                console.error('❌ WebSocket message error:', err);
            }
        };

        websocket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            setError('Real-time connection failed');
            setWsConnected(false);
        };

        websocket.onclose = () => {
            console.log('❌ WebSocket disconnected');
            setWsConnected(false);
        };

        setWs(websocket);

        return () => {
            if (websocket.readyState === WebSocket.OPEN) {
                websocket.close();
            }
        };
    }, []);

    // Update countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setUpdateTrigger(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Fetch upcoming auctions
    useEffect(() => {
        const fetchUpcomingAuctions = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/auctions?status=scheduled');
                const data = await response.json();
                if (data.success) {
                    setUpcomingAuctions(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch upcoming auctions:', err);
            }
        };

        fetchUpcomingAuctions();
    }, []);

    // Get time remaining
    const getTimeRemaining = (endTime) => {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;

        if (diff <= 0) {
            return { ended: true, text: 'Auction Ended' };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
            return { ended: false, text: `${days}d ${hours}h ${minutes}m`, urgent: false };
        } else if (hours > 0) {
            return { ended: false, text: `${hours}h ${minutes}m ${seconds}s`, urgent: false };
        } else {
            return { ended: false, text: `${minutes}m ${seconds}s`, urgent: true };
        }
    };

    // Get time until start
    const getTimeUntilStart = (startTime) => {
        const now = new Date();
        const start = new Date(startTime);
        const diff = start - now;

        if (diff <= 0) {
            return { started: true, text: 'Starting Soon' };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            return { started: false, text: `Starts in ${days}d ${hours}h`, urgent: false };
        } else if (hours > 0) {
            return { started: false, text: `Starts in ${hours}h ${minutes}m`, urgent: false };
        } else {
            return { started: false, text: `Starts in ${minutes}m`, urgent: true };
        }
    };

    // Filter and sort auctions
    const getFilteredAndSortedAuctions = () => {
        let filtered = filter === 'upcoming' ? [...upcomingAuctions] : [...auctions];

        // Search
        if (searchQuery) {
            filtered = filtered.filter(auction =>
                auction.gemId?.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter
        if (filter === 'active') {
            filtered = filtered.filter(auction => auction.status === 'active');
        } else if (filter === 'ending-soon') {
            const oneHour = 60 * 60 * 1000;
            filtered = filtered.filter(auction => {
                const timeLeft = new Date(auction.endTime) - new Date();
                return timeLeft <= oneHour && timeLeft > 0;
            });
        }

        // Sort
        if (filter === 'upcoming') {
            if (sortBy === 'ending-soon') {
                filtered.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            } else if (sortBy === 'newest') {
                filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            } else if (sortBy === 'highest-bid') {
                filtered.sort((a, b) => b.startPrice - a.startPrice);
            } else if (sortBy === 'lowest-bid') {
                filtered.sort((a, b) => a.startPrice - b.startPrice);
            }
        } else {
            if (sortBy === 'ending-soon') {
                filtered.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
            } else if (sortBy === 'newest') {
                filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            } else if (sortBy === 'highest-bid') {
                filtered.sort((a, b) => b.currentPrice - a.currentPrice);
            } else if (sortBy === 'lowest-bid') {
                filtered.sort((a, b) => a.currentPrice - b.currentPrice);
            }
        }

        return filtered;
    };

    const getAuctionImage = (auction) => {
        if (auction.gemId?.images && auction.gemId.images.length > 0) {
            const primaryImage = auction.gemId.images.find(img => img.isPrimary);
            return primaryImage ? primaryImage.url : auction.gemId.images[0].url;
        }
        return 'https://via.placeholder.com/300x200?text=No+Image';
    };

    const isUpcoming = filter === 'upcoming';
    const allFilteredAuctions = getFilteredAndSortedAuctions();

    const renderAuctionCard = ({ item }) => {
        const timeRemaining = isUpcoming
            ? getTimeUntilStart(item.startTime)
            : getTimeRemaining(item.endTime);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('AuctionDetail', { auctionId: item._id })}
            >
                <View style={styles.cardImage}>
                    <Text style={styles.imagePlaceholder}>
                        {getAuctionImage(item) ? '🖼️' : '📷'}
                    </Text>
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.gemId?.title || 'Untitled'}
                    </Text>

                    <Text style={styles.cardDetails}>
                        {item.gemId?.attributes?.carat || '0'} ct • {item.gemId?.attributes?.cut || 'Cut'}
                    </Text>

                    <View style={styles.cardPricing}>
                        <View>
                            <Text style={styles.priceLabel}>
                                {isUpcoming ? 'Starting' : 'Current'}
                            </Text>
                            <Text style={styles.priceAmount}>
                                ${(isUpcoming ? item.startPrice : item.currentPrice)?.toLocaleString() || '0'}
                            </Text>
                        </View>
                        <View>
                            <Text style={[
                                styles.timeBadge,
                                timeRemaining.urgent && styles.timeBadgeUrgent
                            ]}>
                                {timeRemaining.text}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        {!isUpcoming && (
                            <Text style={styles.bidCount}>
                                {item.totalBids || 0} bids
                            </Text>
                        )}
                        <TouchableOpacity
                            style={styles.bidButton}
                            onPress={() => navigation.navigate('AuctionDetail', { auctionId: item._id })}
                            disabled={timeRemaining.ended || (isUpcoming && !timeRemaining.started)}
                        >
                            <Text style={styles.bidButtonText}>
                                {timeRemaining.ended ? 'Ended' : isUpcoming ? 'View' : 'Bid'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Title Card */}
            <View style={styles.titleCard}>
                <Text style={styles.titleIcon}>🔴</Text>
                <View>
                    <Text style={styles.titleText}>Live Auctions</Text>
                    <Text style={styles.titleSubtitle}>Bid on exclusive stones in real-time</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search auctions..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Filter Tabs */}
            <view style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterOptions}
                    contentContainerStyle={styles.filterContent}
                >
                    {['all', 'active', 'ending-soon', 'upcoming'].map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterTab, filter === f && styles.filterTabActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[
                                styles.filterTabText,
                                filter === f && styles.filterTabTextActive
                            ]}>
                                {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </view>


            {/* Sort */}
            <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort:</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.sortOptions}
                    contentContainerStyle={styles.sortContent}
                >
                    {['ending-soon', 'newest', 'highest-bid', 'lowest-bid'].map(option => (
                        <TouchableOpacity
                            key={option}
                            style={[styles.sortOption, sortBy === option && styles.sortOptionActive]}
                            onPress={() => setSortBy(option)}
                        >
                            <Text style={[
                                styles.sortOptionText,
                                sortBy === option && styles.sortOptionTextActive
                            ]}>
                                {option.replace('-', ' ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Results */}
            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : allFilteredAuctions.length > 0 ? (
                <FlatList
                    data={allFilteredAuctions}
                    renderItem={renderAuctionCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContainer}
                    scrollEnabled={true}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No auctions found</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Title Card
    titleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    titleIcon: {
        fontSize: 24,
    },
    titleText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a202c',
    },
    titleSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },

    // Search
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchInput: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1a202c',
    },

    // Filter Tabs
    filterContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',

    },
    filterContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        height: 32,
    },
    filterOptions: {
        flex: 1,
    },
    filterTabActive: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    filterTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    filterTabTextActive: {
        color: '#fff',
    },

    // Sort Options
    sortContainer: {
        //flexDirection: 'row',
        //alignItems: 'top',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',

    },
    sortLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginRight: 10,
    },
    sortOptions: {
        flex: 1,
    },
    sortContent: {
        gap: 6,
    },
    sortOption: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#f9fafb',
    },
    sortOptionActive: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    sortOptionText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6b7280',
    },
    sortOptionTextActive: {
        color: '#fff',
    },

    // List
    listContainer: {
        padding: 16,
        gap: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholder: {
        fontSize: 48,
    },
    cardContent: {
        padding: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 4,
    },
    cardDetails: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 12,
    },
    cardPricing: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    priceLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 2,
    },
    priceAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#667eea',
    },
    timeBadge: {
        fontSize: 11,
        fontWeight: '600',
        color: '#374151',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    timeBadgeUrgent: {
        backgroundColor: '#ef4444',
        color: '#fff',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bidCount: {
        fontSize: 12,
        color: '#6b7280',
    },
    bidButton: {
        backgroundColor: '#667eea',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    bidButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },

    // States
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 16,
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
    },
});

export default AuctionListScreen;