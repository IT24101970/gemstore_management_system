import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiClient, initializeApiClient } from '../../api/services/apiClient';
import { ENDPOINTS } from '../../api/endpoints';

const STATUS_COLORS = {
    upcoming: { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
    active: { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
    ended: { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af' },
};

const TYPE_LABELS = {
    exhibition: 'Exhibition',
    auction: 'Auction Event',
    workshop: 'Workshop',
    conference: 'Conference',
    discount_sale: 'Sale',
};

const EventListScreen = ({ navigation }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchEvents = async () => {
        try {
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.EVENTS.GET_ALL);
            const data = response?.data;
            setEvents(Array.isArray(data) ? data : data?.data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            setEvents([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchEvents(); }, []));

    const onRefresh = () => { setRefreshing(true); fetchEvents(); };

    const getLocationString = (loc) => {
        if (!loc) return '';
        if (typeof loc === 'string') return loc;
        const parts = [loc.venue, loc.city].filter(Boolean);
        return parts.join(', ');
    };

    const getEventStatus = (event) => {
        const now = new Date();
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        if (now < start) return 'upcoming';
        if (now > end) return 'ended';
        return 'active';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderEvent = ({ item }) => {
        const status = getEventStatus(item);
        const colors = STATUS_COLORS[status] || STATUS_COLORS.ended;
        const imageUrl = item.images?.[0]?.url || item.image || null;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('EventDetail', { eventId: item._id })}
                activeOpacity={0.85}
            >
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.cardImage} />
                ) : (
                    <View style={styles.cardImagePlaceholder}>
                        <Text style={styles.cardImagePlaceholderText}>📅</Text>
                    </View>
                )}

                <View style={styles.cardBody}>
                    {/* Header row */}
                    <View style={styles.cardHeader}>
                        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                            <View style={[styles.statusDot, { backgroundColor: colors.dot }]} />
                            <Text style={[styles.statusText, { color: colors.text }]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </View>
                        {item.type && (
                            <Text style={styles.typeLabel}>{TYPE_LABELS[item.type] || item.type}</Text>
                        )}
                    </View>

                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

                    <View style={styles.cardMeta}>
                        <Text style={styles.metaText}>🗓 {formatDate(item.startDate)} – {formatDate(item.endDate)}</Text>
                        {(item.location || item.address) ? (
                            <Text style={styles.metaText}>{`📍 ${getLocationString(item.location) || getLocationString(item.address)}`}</Text>
                        ) : null}
                    </View>

                    {item.discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{`🏷 ${item.discount}% OFF during this event`}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.pageHeader}>
                <Text style={styles.pageTitle}>Events</Text>
                <Text style={styles.pageSubtitle}>{events.length} event{events.length !== 1 ? 's' : ''} found</Text>
            </View>

            {events.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyTitle}>No Events Yet</Text>
                    <Text style={styles.emptyText}>Check back soon for upcoming events and sales.</Text>
                </View>
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item) => item._id}
                    renderItem={renderEvent}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    pageHeader: {
        backgroundColor: '#667eea',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 20,
    },
    pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    pageSubtitle: { fontSize: 13, color: '#c7d2fe', marginTop: 2 },
    list: { padding: 16, paddingBottom: 30 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    cardImage: { width: '100%', height: 160, resizeMode: 'cover' },
    cardImagePlaceholder: {
        width: '100%',
        height: 120,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardImagePlaceholderText: { fontSize: 48 },
    cardBody: { padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 5,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 12, fontWeight: '700' },
    typeLabel: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' },

    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 6 },
    cardDesc: { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 12 },

    cardMeta: { gap: 4, marginBottom: 10 },
    metaText: { fontSize: 13, color: '#4b5563' },

    discountBadge: {
        backgroundColor: '#fef3c7',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 4,
    },
    discountText: { fontSize: 13, fontWeight: '700', color: '#92400e' },

    emptyIcon: { fontSize: 56, marginBottom: 12 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
    emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});

export default EventListScreen;