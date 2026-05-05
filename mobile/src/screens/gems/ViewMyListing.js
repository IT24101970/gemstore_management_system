import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import gemstoneAPI from '../../api/services/gemstoneAPI';
// eslint-disable-next-line import/no-unresolved
import { API_BASE_URL } from '@env';

const ViewMyListing = ({ navigation }) => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchListings = async () => {
        try {
            setLoading(true);
            const response = await gemstoneAPI.getMyListings();
            const data = response?.data || response || [];
            setListings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch listings:', error);
            Alert.alert('Error', 'Could not load your listings');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchListings();
        }, [])
    );

    const getImageUrl = (gem) => {
        if (gem.images && gem.images.length > 0) {
            const primaryImage = gem.images.find(img => img.isPrimary) || gem.images[0];
            if (primaryImage.url && primaryImage.url.startsWith('http')) {
                return primaryImage.url;
            }
            return `${API_BASE_URL.replace('/api', '')}/uploads/${primaryImage.url}`;
        }
        return 'https://via.placeholder.com/200?text=No+Image';
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            activeOpacity={0.9} 
            style={styles.card} 
            onPress={() => navigation.navigate('GemDetail', { gemId: item._id, gem: item })}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: getImageUrl(item) }}
                    style={styles.image}
                />
            </View>
            <View style={styles.cardContent}>
                <View>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.price}>${(parseFloat(item.price || 0)).toLocaleString()}</Text>
                </View>
                
                <View style={styles.badgeContainer}>
                    {item.status && (
                        <View style={[styles.statusBadge, styles.availabilityBadge]}>
                            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                        </View>
                    )}
                    {item.approvalStatus && (
                        <View style={[
                            styles.statusBadge, 
                            item.approvalStatus === 'approved' ? styles.approvedBadge :
                            item.approvalStatus === 'pending' ? styles.pendingBadge :
                            styles.rejectedBadge
                        ]}>
                            <Text style={[
                                styles.statusText,
                                item.approvalStatus === 'approved' ? styles.approvedText :
                                item.approvalStatus === 'pending' ? styles.pendingText :
                                styles.rejectedText
                            ]}>
                                {item.approvalStatus.toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>My Listings</Text>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity 
                            style={styles.createBtn}
                            onPress={() => navigation.navigate('CreateListing')}
                        >
                            <Text style={styles.createBtnText}>+ Listing</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.createBtn, { backgroundColor: '#10b981', shadowColor: '#10b981' }]}
                            onPress={() => navigation.navigate('CreateAuction')}
                        >
                            <Text style={styles.createBtnText}>+ Auction</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
                    {['all', 'available', 'approved', 'pending', 'rejected', 'sold'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[
                                styles.filterTab,
                                filter === f && styles.filterTabActive,
                            ]}
                            onPress={() => setFilter(f)}
                        >
                            <Text
                                style={[
                                    styles.filterTabText,
                                    filter === f && styles.filterTabTextActive,
                                ]}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            ) : listings.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>You don&apos;t have any gemstone listings yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={listings.filter(item => {
                        if (filter === 'all') return true;
                        if (filter === 'available') return item.status === 'available';
                        if (filter === 'sold') return item.status === 'sold';
                        if (filter === 'approved') return item.approvalStatus === 'approved';
                        if (filter === 'pending') return item.approvalStatus === 'pending';
                        if (filter === 'rejected') return item.approvalStatus === 'rejected';
                        return true;
                    })}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    createBtn: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    createBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    filterTabs: {
        paddingHorizontal: 15,
        paddingVertical: 15,
        gap: 10,
    },
    filterTab: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    filterTabActive: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    filterTabText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '700',
    },
    filterTabTextActive: {
        color: '#ffffff',
    },
    list: {
        padding: 15,
        paddingTop: 5,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
    },
    imageContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    image: {
        width: 85,
        height: 85,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
    },
    cardContent: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'space-between',
        height: 85,
        paddingVertical: 2,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 4,
    },
    price: {
        fontSize: 16,
        color: '#6366f1',
        fontWeight: '700',
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    availabilityBadge: {
        backgroundColor: '#eef2ff',
    },
    availabilityText: {
        color: '#4338ca',
    },
    approvedBadge: {
        backgroundColor: '#f0fdf4',
    },
    approvedText: {
        color: '#15803d',
    },
    pendingBadge: {
        backgroundColor: '#fffbeb',
    },
    pendingText: {
        color: '#b45309',
    },
    rejectedBadge: {
        backgroundColor: '#fef2f2',
    },
    rejectedText: {
        color: '#b91c1c',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default ViewMyListing;