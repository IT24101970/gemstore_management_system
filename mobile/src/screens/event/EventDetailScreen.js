import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { getApiClient, initializeApiClient } from '../../api/services/apiClient';
import { ENDPOINTS } from '../../api/endpoints';

const TYPE_LABELS = {
    exhibition: 'Exhibition',
    auction: 'Auction Event',
    workshop: 'Workshop',
    conference: 'Conference',
    discount_sale: 'Sale',
};

const STATUS_COLORS = {
    upcoming: { bg: '#eff6ff', text: '#1d4ed8' },
    active: { bg: '#f0fdf4', text: '#15803d' },
    ended: { bg: '#f9fafb', text: '#6b7280' },
};

const EventDetailScreen = ({ route, navigation }) => {
    const { eventId } = route.params;
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchEvent(); }, [eventId]);

    const fetchEvent = async () => {
        try {
            setLoading(true);
            await initializeApiClient();
            const client = getApiClient();
            const response = await client.get(ENDPOINTS.EVENTS.GET_BY_ID(eventId));
            setEvent(response.data);
        } catch (err) {
            console.error('Error fetching event:', err);
            setError('Failed to load event details.');
        } finally {
            setLoading(false);
        }
    };

    // location can be a string OR { city, venue } object from the backend
    const getLocationString = (loc) => {
        if (!loc) return '';
        if (typeof loc === 'string') return loc;
        const parts = [loc.venue, loc.city].filter(Boolean);
        return parts.join(', ');
    };

    const getEventStatus = () => {
        if (!event) return 'ended';
        const now = new Date();
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        if (now < start) return 'upcoming';
        if (now > end) return 'ended';
        return 'active';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    if (error || !event) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorIcon}>😕</Text>
                <Text style={styles.errorText}>{error || 'Event not found'}</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const status = getEventStatus();
    const colors = STATUS_COLORS[status] || STATUS_COLORS.ended;
    const imageUrl = event.images?.[0]?.url || event.image || null;
    const hasDiscount = (event.discountPercentage || event.discount || 0) > 0;
    const discountValue = event.discountPercentage || event.discount || 0;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.heroImage} />
                ) : (
                    <View style={styles.heroPlaceholder}>
                        <Text style={styles.heroPlaceholderText}>📅</Text>
                    </View>
                )}

                {/* Back Button Overlay */}
                <TouchableOpacity style={styles.backOverlayBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backOverlayText}>← Back</Text>
                </TouchableOpacity>

                <View style={styles.content}>
                    {/* Status + Type row */}
                    <View style={styles.badgeRow}>
                        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                            <Text style={[styles.statusText, { color: colors.text }]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </View>
                        {event.type && (
                            <View style={styles.typeBadge}>
                                <Text style={styles.typeText}>{TYPE_LABELS[event.type] || event.type}</Text>
                            </View>
                        )}
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{event.title}</Text>

                    {/* Discount Banner */}
                    {hasDiscount && (
                        <View style={styles.discountBanner}>
                            <Text style={styles.discountBannerTitle}>{`🏷 ${discountValue}% Event Discount Active!`}</Text>
                            {event.discountDescription ? (
                                <Text style={styles.discountBannerDesc}>{event.discountDescription}</Text>
                            ) : null}
                        </View>
                    )}

                    {/* Details Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Event Details</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>🗓</Text>
                            <View>
                                <Text style={styles.detailLabel}>Start Date</Text>
                                <Text style={styles.detailValue}>{formatDate(event.startDate)}</Text>
                            </View>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>🗓</Text>
                            <View>
                                <Text style={styles.detailLabel}>End Date</Text>
                                <Text style={styles.detailValue}>{formatDate(event.endDate)}</Text>
                            </View>
                        </View>
                        {(event.startTime || event.endTime) && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailIcon}>⏰</Text>
                                <View>
                                    <Text style={styles.detailLabel}>Time</Text>
                                    <Text style={styles.detailValue}>
                                        {event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}
                                    </Text>
                                </View>
                            </View>
                        )}
                        {(event.location || event.address) && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailIcon}>📍</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Location</Text>
                                    <Text style={styles.detailValue}>
                                        {getLocationString(event.location) || getLocationString(event.address) || ''}
                                    </Text>
                                </View>
                            </View>
                        )}
                        {event.maxAttendees && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailIcon}>👥</Text>
                                <View>
                                    <Text style={styles.detailLabel}>Capacity</Text>
                                    <Text style={styles.detailValue}>{`${event.maxAttendees} attendees`}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>About This Event</Text>
                        <Text style={styles.description}>{event.description || 'No description available.'}</Text>
                    </View>

                    {/* Contact */}
                    {(event.contactEmail || event.contactPhone) && (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Contact</Text>
                            {event.contactEmail && (
                                <TouchableOpacity onPress={() => Linking.openURL(`mailto:${event.contactEmail}`)}>
                                    <Text style={styles.contactLink}>✉️ {event.contactEmail}</Text>
                                </TouchableOpacity>
                            )}
                            {event.contactPhone && (
                                <TouchableOpacity onPress={() => Linking.openURL(`tel:${event.contactPhone}`)}>
                                    <Text style={styles.contactLink}>📞 {event.contactPhone}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={{ height: 30 }} />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    heroImage: { width: '100%', height: 240, resizeMode: 'cover' },
    heroPlaceholder: {
        width: '100%', height: 180,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroPlaceholderText: { fontSize: 64 },

    backOverlayBtn: {
        position: 'absolute',
        top: 12, left: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
    },
    backOverlayText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    content: { padding: 16 },

    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12, marginTop: 4 },
    statusBadge: {
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20,
    },
    statusText: { fontSize: 13, fontWeight: '700' },
    typeBadge: {
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: '#e0e7ff',
    },
    typeText: { fontSize: 13, color: '#4338ca', fontWeight: '600' },

    title: {
        fontSize: 26, fontWeight: 'bold', color: '#1f2937',
        marginBottom: 14, lineHeight: 34,
    },

    discountBanner: {
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    discountBannerTitle: { fontSize: 16, fontWeight: 'bold', color: '#92400e' },
    discountBannerDesc: { fontSize: 13, color: '#78350f', marginTop: 4 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 18,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16, fontWeight: 'bold', color: '#374151',
        marginBottom: 14, paddingBottom: 10,
        borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },

    detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
    detailIcon: { fontSize: 20, marginTop: 2 },
    detailLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' },
    detailValue: { fontSize: 15, color: '#1f2937', fontWeight: '500', marginTop: 2 },

    description: { fontSize: 15, color: '#4b5563', lineHeight: 24 },

    contactLink: { fontSize: 15, color: '#667eea', fontWeight: '500', marginBottom: 8 },

    errorIcon: { fontSize: 48, marginBottom: 12 },
    errorText: { fontSize: 16, color: '#dc2626', marginBottom: 16, textAlign: 'center' },
    backBtn: { backgroundColor: '#667eea', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
    backBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

export default EventDetailScreen;
