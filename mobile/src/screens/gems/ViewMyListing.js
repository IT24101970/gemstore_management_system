import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import gemstoneAPI from '../../api/services/gemstoneAPI';
import { API_BASE_URL } from '@env';

const ViewMyListing = ({ navigation }) => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleDelete = async (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this listing?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await gemstoneAPI.delete(id);
                            setListings(listings.filter((gem) => gem._id !== id));
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', 'Failed to delete listing');
                        }
                    },
                },
            ]
        );
    };

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
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('GemDetail', { gemId: item._id })}>
            <Image
                source={{ uri: getImageUrl(item) }}
                style={styles.image}
            />
            <View style={styles.cardContent}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.price}>${item.price}</Text>
                
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                        {(item.status || item.approvalStatus || 'pending').toUpperCase()}
                    </Text>
                </View>

                <View style={styles.actions}>
                    {item.status !== 'sold' && (
                        <TouchableOpacity 
                            style={styles.deleteBtn}
                            onPress={() => handleDelete(item._id)}
                        >
                            <Text style={styles.deleteBtnText}>Delete</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Listings</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity 
                        style={styles.createBtn}
                        onPress={() => {
                            console.log('Navigating to CreateListing');
                            navigation.navigate('CreateListing');
                        }}
                    >
                        <Text style={styles.createBtnText}>+ Listing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.createBtn, { backgroundColor: '#10b981' }]}
                        onPress={() => {
                            console.log('Navigating to CreateAuction');
                            navigation.navigate('CreateAuction');
                        }}
                    >
                        <Text style={styles.createBtnText}>+ Auction</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            ) : listings.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>You don't have any gemstone listings yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={listings}
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
        backgroundColor: '#f9fafb',
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    createBtn: {
        backgroundColor: '#667eea',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    createBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 16,
    },
    list: {
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 15,
        overflow: 'hidden',
        flexDirection: 'row',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    image: {
        width: 100,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        padding: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#1f2937',
    },
    price: {
        fontSize: 15,
        color: '#667eea',
        fontWeight: '600',
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 8,
    },
    statusText: {
        color: '#4338ca',
        fontSize: 12,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    deleteBtn: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
    },
    deleteBtnText: {
        color: '#dc2626',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default ViewMyListing;