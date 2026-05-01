import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Image,
} from 'react-native';
import auctionAPI from '../../api/services/auctionAPI';
import gemstoneAPI from '../../api/services/gemstoneAPI';
import walletAPI from '../../api/services/walletAPI';
import { useAuth } from '../../context/AuthContext';

const HomeScreen = ({ navigation }) => {
    const { user, signOut } = useAuth();
    const [liveAuctions, setLiveAuctions] = useState([]);
    const [featuredGems, setFeaturedGems] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchFilters, setSearchFilters] = useState({
        keyword: '',
        type: 'All Types',
        carat: 'Any Weight',
        priceRange: 'All Prices',
    });

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, []);

    // Fetch wallet balance if user logged in
    useEffect(() => {
        if (user) {
            fetchWalletBalance();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [auctionRes, gemsRes] = await Promise.all([
                auctionAPI.getLive(),
                gemstoneAPI.getAll(),
            ]);

            setLiveAuctions(auctionRes.data || []);
            setFeaturedGems(gemsRes.data || []);
            setError('');
        } catch (err) {
            setError(err?.message || 'Failed to load data');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletBalance = async () => {
        try {
            const res = await walletAPI.getSummary();
            setBalance(res.data?.availableBalance || 0);
        } catch (err) {
            console.error('Failed to fetch balance:', err);
        }
    };

    // Handle search
    const handleSearch = async () => {
        try {
            setLoading(true);
            const params = {};

            if (searchFilters.keyword) params.keyword = searchFilters.keyword;
            if (searchFilters.type !== 'All Types') params.type = searchFilters.type;

            const res = await gemstoneAPI.search(params);
            setFeaturedGems(res.data || []);
        } catch (err) {
            setError('Search failed');
        } finally {
            setLoading(false);
        }
    };

    // Get gem image
    const getGemImage = (gem) => {
        if (gem.images && gem.images.length > 0) {
            const primaryImage = gem.images.find((img) => img.isPrimary);
            return primaryImage ? primaryImage.url : gem.images[0].url;
        }
        return 'https://via.placeholder.com/300x200?text=No+Image';
    };

    // Get auction image
    const getAuctionImage = (auction) => {
        if (auction.gemId?.images && auction.gemId.images.length > 0) {
            const primaryImage = auction.gemId.images.find((img) => img.isPrimary);
            return primaryImage ? primaryImage.url : auction.gemId.images[0].url;
        }
        return 'https://via.placeholder.com/300x200?text=No+Image';
    };

    // Get time remaining
    const getTimeRemaining = (endTime) => {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;

        if (diff <= 0) return 'Ended';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    // Render auction card
    const renderAuctionCard = ({ item }) => (
        <TouchableOpacity
            style={styles.auctionCard}
            onPress={() => navigation.navigate('AuctionDetail', { auctionId: item._id })}
        >
            <Image
                source={{ uri: getAuctionImage(item) }}
                style={styles.auctionImage}
            />
            <View style={styles.auctionTimer}>
                <Text style={styles.timerText}>⏱ {getTimeRemaining(item.endTime)}</Text>
            </View>

            <View style={styles.auctionContent}>
                <Text style={styles.auctionTitle} numberOfLines={1}>
                    {item.gemId?.title || 'Untitled'}
                </Text>
                <Text style={styles.auctionDetails}>
                    {item.gemId?.attributes?.carat || '0'} Carat • {item.gemId?.attributes?.cut || 'Cut'}
                </Text>

                <View style={styles.auctionFooter}>
                    <View>
                        <Text style={styles.bidLabel}>CURRENT BID</Text>
                        <Text style={styles.bidAmount}>
                            ${item.currentPrice?.toLocaleString() || '0'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.bidButton}>
                        <Text style={styles.bidButtonText}>Bid Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Render gem card
    const renderGemCard = ({ item }) => (
        <TouchableOpacity
            style={styles.gemCard}
            onPress={() => navigation.navigate('GemDetail', { gemId: item._id })}
        >
            <View style={styles.gemImageContainer}>
                <Image
                    source={{ uri: getGemImage(item) }}
                    style={styles.gemImage}
                />
                {item.certifications && item.certifications.length > 0 && (
                    <View style={styles.certifiedBadge}>
                        <Text style={styles.certifiedText}>Certified</Text>
                    </View>
                )}
            </View>

            <View style={styles.gemContent}>
                <Text style={styles.gemTitle}>{item.title}</Text>
                <Text style={styles.gemDetails}>
                    {item.attributes?.carat || '0'} Carat • {item.attributes?.cut || 'Cut'}
                </Text>

                <View style={styles.gemFooter}>
                    <Text style={styles.gemPrice}>${item.price?.toLocaleString() || '0'}</Text>
                    <TouchableOpacity style={styles.viewButton}>
                        <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading && liveAuctions.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.logo}>💎 Ceylon Gems</Text>
                </View>
                <View style={styles.headerRight}>
                    {user ? (
                        <>
                            <View style={styles.wallet}>
                                <Text style={styles.walletText}>
                                    💰 ${balance.toFixed(2)}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={signOut}>
                                <Text style={styles.logoutBtn}>Logout</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginBtn}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.registerBtn}>Register</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>
                            The Heart of{'\n'}
                            <Text style={styles.heroAccent}>Ceylon's Earth</Text>
                        </Text>
                        <Text style={styles.heroDescription}>
                            Trade authentic Sri Lankan gemstones with confidence. Access a curated marketplace of verified sapphires, rubies, and rare minerals.
                        </Text>
                        <View style={styles.heroButtons}>
                            <TouchableOpacity style={styles.btnPrimary}>
                                <Text style={styles.btnPrimaryText}>Explore</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSecondary}>
                                <Text style={styles.btnSecondaryText}>Sell</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchSection}>
                    <View style={styles.searchField}>
                        <Text style={styles.searchLabel}>SEARCH</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Sapphire, Ruby..."
                            value={searchFilters.keyword}
                            onChangeText={(text) =>
                                setSearchFilters({ ...searchFilters, keyword: text })
                            }
                        />
                    </View>

                    <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                        <Text style={styles.searchButtonText}>Search</Text>
                    </TouchableOpacity>
                </View>

                {/* Live Auctions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>🔴 Live Auctions</Text>
                            <Text style={styles.sectionSubtitle}>Bid on exclusive stones in real-time</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Auctions')}>
                            <Text style={styles.viewAll}>View All →</Text>
                        </TouchableOpacity>
                    </View>

                    {liveAuctions.length > 0 ? (
                        <FlatList
                            data={liveAuctions.slice(0, 4)}
                            renderItem={renderAuctionCard}
                            keyExtractor={(item) => item._id}
                            scrollEnabled={false}
                        />
                    ) : (
                        <Text style={styles.noResults}>No live auctions at the moment</Text>
                    )}
                </View>

                {/* Featured Gems */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Featured Gems</Text>
                            <Text style={styles.sectionSubtitle}>
                                Handpicked for exceptional clarity and color
                            </Text>
                        </View>
                    </View>

                    <View style={styles.filterTabs}>
                        {['All', 'Sapphires', 'Rubies'].map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.filterTab,
                                    activeFilter === filter.toLowerCase() && styles.filterTabActive,
                                ]}
                                onPress={() => setActiveFilter(filter.toLowerCase())}
                            >
                                <Text
                                    style={[
                                        styles.filterTabText,
                                        activeFilter === filter.toLowerCase() && styles.filterTabTextActive,
                                    ]}
                                >
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {featuredGems.length > 0 ? (
                        <FlatList
                            data={featuredGems}
                            renderItem={renderGemCard}
                            keyExtractor={(item) => item._id}
                            numColumns={2}
                            scrollEnabled={false}
                            columnWrapperStyle={styles.gemRow}
                        />
                    ) : (
                        <Text style={styles.noResults}>No gems available</Text>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2024 Ceylon Gems. All rights reserved.</Text>
                </View>
            </ScrollView>
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
    scrollView: {
        flex: 1,
    },

    // Header
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    logo: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a202c',
    },
    wallet: {
        backgroundColor: '#667eea',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    walletText: {
        color: '#fff',
        fontWeight: '600',
    },
    loginBtn: {
        color: '#374151',
        fontWeight: '600',
    },
    registerBtn: {
        backgroundColor: '#667eea',
        color: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        fontWeight: '600',
    },
    logoutBtn: {
        color: '#dc2626',
        fontWeight: '600',
    },

    // Hero Section
    heroSection: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 24,
        marginBottom: 16,
    },
    heroContent: {
        gap: 16,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1a202c',
        lineHeight: 36,
    },
    heroAccent: {
        color: '#93c5fd',
    },
    heroDescription: {
        fontSize: 14,
        color: 'rgba(0,0,0,0.6)',
        lineHeight: 20,
    },
    heroButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    btnPrimary: {
        flex: 1,
        backgroundColor: '#667eea',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnPrimaryText: {
        color: '#fff',
        fontWeight: '700',
    },
    btnSecondary: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    btnSecondaryText: {
        color: '#667eea',
        fontWeight: '700',
    },

    // Search
    searchSection: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginHorizontal: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    searchField: {
        marginBottom: 12,
    },
    searchLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    searchInput: {
        borderBottomWidth: 2,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 8,
        fontSize: 16,
        color: '#1a202c',
    },
    searchButton: {
        backgroundColor: '#667eea',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: '700',
    },

    // Section
    section: {
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    sectionHeader: {
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a202c',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    viewAll: {
        color: '#667eea',
        fontWeight: '600',
    },

    // Auction Card
    auctionCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    auctionImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#f3f4f6',
    },
    auctionTimer: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    timerText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    auctionContent: {
        padding: 12,
    },
    auctionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 4,
    },
    auctionDetails: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 12,
    },
    auctionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bidLabel: {
        fontSize: 10,
        color: '#6b7280',
        fontWeight: '600',
        marginBottom: 2,
    },
    bidAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#667eea',
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

    // Gem Card
    gemRow: {
        justifyContent: 'space-between',
    },
    gemCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 12,
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    gemImageContainer: {
        position: 'relative',
        width: '100%',
        height: 140,
        backgroundColor: '#f3f4f6',
    },
    gemImage: {
        width: '100%',
        height: '100%',
    },
    certifiedBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#10b981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    certifiedText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    gemContent: {
        padding: 12,
    },
    gemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 4,
    },
    gemDetails: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 12,
    },
    gemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gemPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a202c',
    },
    viewButton: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    viewButtonText: {
        color: '#374151',
        fontWeight: '700',
        fontSize: 12,
    },

    // Filters
    filterTabs: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 20,
    },
    filterTabActive: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    filterTabText: {
        color: '#6b7280',
        fontWeight: '600',
        fontSize: 12,
    },
    filterTabTextActive: {
        color: '#fff',
    },

    // No Results
    noResults: {
        textAlign: 'center',
        color: '#6b7280',
        paddingVertical: 24,
        fontSize: 14,
    },

    // Footer
    footer: {
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    footerText: {
        color: '#6b7280',
        fontSize: 12,
    },
});

export default HomeScreen;