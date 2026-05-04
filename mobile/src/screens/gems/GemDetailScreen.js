import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import gemstoneAPI from '../../api/services/gemstoneAPI';
import { useAuth } from '../../context/AuthContext';

const GemDetailScreen = ({ route, navigation }) => {
    const { gemId, gem: passedGem } = route.params;
    const { user } = useAuth();
    const [gem, setGem] = useState(passedGem || null);
    const [loading, setLoading] = useState(!passedGem);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!passedGem) {
            fetchGemDetails();
        }
    }, [gemId, passedGem]);

    const fetchGemDetails = async () => {
        try {
            setLoading(true);
            const res = await gemstoneAPI.getOne(gemId);
            setGem(res.data || res);
        } catch (err) {
            console.error('Error fetching gem details:', err);
            setError('Failed to load gem details.');
        } finally {
            setLoading(false);
        }
    };

    const handleBuyNow = () => {
        if (!user) {
            Alert.alert('Login Required', 'Please login to purchase gems.');
            navigation.navigate('Auth');
            return;
        }

        if (gem.sellerId?._id === user._id || gem.sellerId === user._id) {
            Alert.alert('Error', 'You cannot buy your own gem.');
            return;
        }

        navigation.navigate('Checkout', { gem });
    };

    const handleDelete = () => {
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
                            setLoading(true);
                            await gemstoneAPI.delete(gem._id);
                            Alert.alert('Success', 'Listing deleted successfully');
                            navigation.goBack();
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', 'Failed to delete listing');
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    if (error || !gem) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error || 'Gem not found'}</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const primaryImage = gem.images?.find(img => img.isPrimary)?.url || gem.images?.[0]?.url || 'https://via.placeholder.com/400';

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Image source={{ uri: primaryImage }} style={styles.gemImage} />

                <View style={styles.content}>
                    <Text style={styles.title}>{gem.title}</Text>
                    <Text style={styles.price}>{`$${(gem.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</Text>

                    <View style={styles.badgeContainer}>
                        {gem.status === 'available' && (
                            <View style={[styles.badge, styles.availableBadge]}>
                                <Text style={styles.badgeText}>Available</Text>
                            </View>
                        )}
                        {gem.approvalStatus && (
                            <View style={[
                                styles.badge,
                                gem.approvalStatus === 'approved' ? styles.approvedBadge :
                                    gem.approvalStatus === 'pending' ? styles.pendingBadge :
                                        styles.rejectedBadge
                            ]}>
                                <Text style={[
                                    styles.badgeText,
                                    gem.approvalStatus === 'pending' && { color: '#d97706' },
                                    gem.approvalStatus === 'rejected' && { color: '#b91c1c' }
                                ]}>
                                    {gem.approvalStatus.charAt(0).toUpperCase() + gem.approvalStatus.slice(1)}
                                </Text>
                            </View>
                        )}
                        {gem.type && (
                            <View style={[styles.badge, styles.typeBadge]}>
                                <Text style={styles.badgeText}>{gem.type}</Text>
                            </View>
                        )}
                    </View>

                    {gem.approvalStatus === 'rejected' && gem.rejectionReason && (
                        <View style={{ backgroundColor: '#fee2e2', padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#f87171' }}>
                            <Text style={{ color: '#b91c1c', fontWeight: 'bold', marginBottom: 4 }}>Reason for Rejection:</Text>
                            <Text style={{ color: '#991b1b', lineHeight: 20 }}>{gem.rejectionReason}</Text>
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{gem.description || 'No description provided.'}</Text>

                    <Text style={styles.sectionTitle}>Specifications</Text>
                    <View style={styles.specsContainer}>
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Weight (Carats):</Text>
                            <Text style={styles.specValue}>{gem.attributes?.carat || 'N/A'}</Text>
                        </View>
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Shape:</Text>
                            <Text style={styles.specValue}>{gem.attributes?.shape || 'N/A'}</Text>
                        </View>
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Cut:</Text>
                            <Text style={styles.specValue}>{gem.attributes?.cut || 'N/A'}</Text>
                        </View>
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Color Intensity:</Text>
                            <Text style={styles.specValue}>{gem.attributes?.colorIntensity || 'N/A'}</Text>
                        </View>
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Clarity:</Text>
                            <Text style={styles.specValue}>{gem.attributes?.clarity || 'N/A'}</Text>
                        </View>
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Origin:</Text>
                            <Text style={styles.specValue}>{gem.attributes?.origin || 'N/A'}</Text>
                        </View>
                    </View>

                    {gem.report && (
                        <>
                            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Certificate</Text>
                            <Image
                                source={{ uri: gem.report }}
                                style={{ width: '100%', height: 400, resizeMode: 'contain', backgroundColor: '#f9fafb', borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#e5e7eb' }}
                            />
                        </>
                    )}
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
                {user && (gem.sellerId?._id === user._id || gem.sellerId === user._id) ? (
                    <View style={styles.buttonContainer}>
                        {(gem.status === 'available' || gem.approvalStatus === 'rejected') && (
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.editBtn]}
                                onPress={() => navigation.navigate('EditListing', { gem })}
                            >
                                <Text style={styles.actionBtnIcon}></Text>
                                <Text style={styles.actionBtnText}>Edit</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.deleteBtn]}
                            onPress={handleDelete}
                        >
                            <Text style={styles.actionBtnIcon}></Text>
                            <Text style={styles.actionBtnText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                ) : route.params?.fromApproval ? null : (
                    <TouchableOpacity
                        style={[styles.buyBtn, gem.status !== 'available' && styles.disabledBtn]}
                        onPress={handleBuyNow}
                        disabled={gem.status !== 'available'}
                    >
                        <Text style={styles.buyBtnText}>
                            {gem.status === 'available' ? 'Buy Now' : 'Not Available'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        color: '#dc2626',
        marginBottom: 20,
    },
    backBtn: {
        padding: 10,
        backgroundColor: '#e5e7eb',
        borderRadius: 8,
    },
    backBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    gemImage: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    price: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#667eea',
        marginBottom: 15,
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    availableBadge: {
        backgroundColor: '#d1fae5',
    },
    typeBadge: {
        backgroundColor: '#e0e7ff',
    },
    approvedBadge: {
        backgroundColor: '#dcfce7',
    },
    pendingBadge: {
        backgroundColor: '#fef3c7',
    },
    rejectedBadge: {
        backgroundColor: '#fee2e2',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 20,
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        color: '#4b5563',
        lineHeight: 24,
    },
    specsContainer: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 15,
        marginTop: 10,
    },
    specRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    specLabel: {
        fontSize: 15,
        color: '#6b7280',
        fontWeight: '500',
    },
    specValue: {
        fontSize: 15,
        color: '#1f2937',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    buyBtn: {
        backgroundColor: '#667eea',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledBtn: {
        backgroundColor: '#9ca3af',
    },
    buyBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    editBtn: {
        backgroundColor: '#6366f1',
    },
    deleteBtn: {
        backgroundColor: '#ef4444',
    },
    actionBtnIcon: {
        fontSize: 18,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default GemDetailScreen;
