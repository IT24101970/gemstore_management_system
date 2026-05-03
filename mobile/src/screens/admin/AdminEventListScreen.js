import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import eventAPI from '../../api/services/eventAPI';

const TYPE_LABELS = {
    exhibition: 'Exhibition',
    auction: 'Auction',
    workshop: 'Workshop',
    conference: 'Conference',
    discount_sale: 'Discount Sale',
};

const AdminEventListScreen = ({ navigation }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchEvents = async () => {
        try {
            const data = await eventAPI.getAll();
            setEvents(Array.isArray(data) ? data : data?.data || []);
        } catch (error) {
            console.error('Fetch events error:', error);
            Alert.alert('Error', 'Failed to load events');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };

    const handleDelete = (eventId) => {
        Alert.alert(
            'Delete Event',
            'Are you sure you want to delete this event? Customers will not see it after deletion.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await eventAPI.delete(eventId);
                            Alert.alert('Success', 'Event deleted successfully');
                            fetchEvents();
                        } catch (error) {
                            console.error('Delete event error:', error);
                            Alert.alert('Error', 'Failed to delete event');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';

        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const renderEvent = ({ item }) => {
        const imageUrl = item.images?.[0]?.url || item.image || null;
        return (
            <View style={styles.card}>
                <Text style={styles.eventTitle}>{item.title}</Text>

                <Text style={styles.eventText}>
                    Type: {TYPE_LABELS[item.type] || item.type || 'N/A'}
                </Text>

                <Text style={styles.eventText}>
                    Date: {formatDate(item.startDate)} - {formatDate(item.endDate)}
                </Text>

                <Text style={styles.eventText}>
                    Location: {item.location || item.address || 'Not provided'}
                </Text>

                <Text style={styles.eventText}>
                    Capacity: {item.maxAttendees || item.capacity || 'Not provided'}
                </Text>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.updateBtn}
                        onPress={() => navigation.navigate('EditEvent', { eventId: item._id })}
                    >
                        <Text style={styles.buttonText}>Update</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(item._id)}
                    >
                        <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>View Events</Text>
            </View>

            <FlatList
                data={events}
                keyExtractor={(item) => item._id}
                renderItem={renderEvent}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No events found</Text>
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
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    eventText: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 5,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 14,
    },
    updateBtn: {
        backgroundColor: '#667eea',
        paddingVertical: 12,
        borderRadius: 8,
        width: '48%',
        alignItems: 'center',
    },
    deleteBtn: {
        backgroundColor: '#dc2626',
        paddingVertical: 12,
        borderRadius: 8,
        width: '48%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
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


    eventImage: {
        width: '100%',
        height: 160,
        borderRadius: 10,
        marginBottom: 12,
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: 130,
        borderRadius: 10,
        marginBottom: 12,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 44,
    },



});

export default AdminEventListScreen;