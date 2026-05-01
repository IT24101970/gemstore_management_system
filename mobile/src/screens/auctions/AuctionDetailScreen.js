import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import walletAPI from '../../api/services/walletAPI';

const AuctionDetailScreen = ({ navigation, route }) => {
    const { auctionId } = route.params;
    const { user } = useAuth();
    const [auction, setAuction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bidAmount, setBidAmount] = useState('');
    const [bidError, setBidError] = useState('');
    const [bidLoading, setBidLoading] = useState(false);
    const [balance, setBalance] = useState(0);
    const [auctionBids, setAuctionBids] = useState([]);
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [ws, setWs] = useState(null);

    // Fetch auction details
    useEffect(() => {
        fetchAuctionDetails();
        fetchWalletBalance();
    }, [auctionId]);

    // Update countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setUpdateTrigger(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // WebSocket for real-time updates
    useEffect(() => {
        const websocket = new WebSocket('ws://localhost:5000');

        websocket.onopen = () => {
            websocket.send(JSON.stringify({ type: 'subscribe-auction', auctionId }));
        };

        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'auction-updated' && data.data.auctionId === auctionId) {
                    setAuction(prev => ({
                        ...prev,
                        currentPrice: data.data.currentPrice,
                        totalBids: data.data.totalBids,
                        winnerId: data.data.winnerId
                    }));
                    // Refetch bids
                    fetchAuctionBids(auctionId);
                }
            } catch (err) {
                console.error('WebSocket error:', err);
            }
        };

        setWs(websocket);

        return () => {
            if (websocket.readyState === WebSocket.OPEN) {
                websocket.close();
            }
        };
    }, [auctionId]);

    const fetchAuctionDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/auctions/${auctionId}`);
            const data = await response.json();
            if (data.success) {
                setAuction(data.data);
                fetchAuctionBids(auctionId);
                const minBid = (parseFloat(data.data.currentPrice) + parseFloat(data.data.minIncrement)).toFixed(2);
                setBidAmount(minBid);
            }
        } catch (err) {
            console.error('Failed to fetch auction:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuctionBids = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/auctions/${id}/bids`);
            const data = await response.json();
            if (data.success) {
                setAuctionBids(data.data.bids);
            }
        } catch (err) {
            console.error('Failed to fetch bids:', err);
        }
    };

    const fetchWalletBalance = async () => {
        try {
            const res = await walletAPI.getBalance();
            if (res.data?.balance !== undefined) {
                setBalance(res.data.balance);
            }
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        }
    };

    const getTimeRemaining = (endTime) => {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;

        if (diff <= 0) {
            return { ended: true, text: 'Auction Ended' };
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { ended: false, text: `${hours}h ${minutes}m ${seconds}s` };
    };

    const handlePlaceBid = async () => {
        setBidError('');

        if (!user) {
            setBidError('You must be logged in to place a bid');
            return;
        }

        if (auction.winnerId === user.id) {
            setBidError('You already have the highest bid');
            return;
        }

        if (!bidAmount || parseFloat(bidAmount) <= 0) {
            setBidError('Please enter a valid bid amount');
            return;
        }

        const minBid = parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement);

        if (parseFloat(bidAmount) < minBid) {
            setBidError(`Minimum bid is $${minBid.toFixed(2)}`);
            return;
        }

        if (parseFloat(bidAmount) > balance) {
            setBidError('Insufficient wallet balance');
            return;
        }

        setBidLoading(true);

        try {
            const token = localStorage.getItem('token') || '';
            const response = await fetch(`http://localhost:5000/api/auctions/${auctionId}/bid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bidAmount: parseFloat(bidAmount) })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to place bid');
            }

            // Update auction
            setAuction(data.data.auction);
            setAuctionBids(data.data.allBids);

            // Update balance
            if (data.data.wallet) {
                setBalance(data.data.wallet.balance);
            }

            // Reset bid amount
            const newMinBid = (parseFloat(data.data.auction.currentPrice) + parseFloat(data.data.auction.minIncrement)).toFixed(2);
            setBidAmount(newMinBid);

        } catch (err) {
            setBidError(err.message || 'Failed to place bid');
            console.error('Bid error:', err);
        } finally {
            setBidLoading(false);
        }
    };

    const getAuctionImage = () => {
        if (auction?.gemId?.images && auction.gemId.images.length > 0) {
            const primaryImage = auction.gemId.images.find(img => img.isPrimary);
            return primaryImage?.url || auction.gemId.images[0].url;
        }
        return null;
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    if (!auction) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Auction not found</Text>
            </View>
        );
    }

    const timeRemaining = getTimeRemaining(auction.endTime);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>

                {/* Auction Image */}
                <View style={styles.imageContainer}>
                    {getAuctionImage() ? (
                        <Image
                            source={{ uri: getAuctionImage() }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.imagePlaceholderText}>📷</Text>
                        </View>
                    )}

                    <View style={[
                        styles.timeBadge,
                        timeRemaining.ended && styles.timeBadgeEnded
                    ]}>
                        <Text style={styles.timeBadgeText}>
                            ⏱ {timeRemaining.text}
                        </Text>
                    </View>

                    {auction.totalBids > 0 && (
                        <View style={styles.bidsBadge}>
                            <Text style={styles.bidsBadgeText}>
                                🔨 {auction.totalBids} bids
                            </Text>
                        </View>
                    )}
                </View>

                {/* Gem Info */}
                <View style={styles.gemInfoContainer}>
                    <Text style={styles.gemTitle}>{auction.gemId?.title}</Text>
                    <Text style={styles.gemDetails}>
                        {auction.gemId?.attributes?.carat} ct • {auction.gemId?.attributes?.cut} • {auction.gemId?.attributes?.color}
                    </Text>
                </View>

                {/* Bid Info */}
                <View style={styles.bidInfoContainer}>
                    <View style={styles.bidInfoRow}>
                        <Text style={styles.bidInfoLabel}>Current Bid</Text>
                        <Text style={styles.bidInfoValue}>
                            ${parseFloat(auction.currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                    </View>

                    <View style={styles.bidInfoRow}>
                        <Text style={styles.bidInfoLabel}>Minimum Increment</Text>
                        <Text style={styles.bidInfoValue}>
                            ${parseFloat(auction.minIncrement).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                    </View>

                    <View style={styles.bidInfoRow}>
                        <Text style={styles.bidInfoLabel}>Your Wallet</Text>
                        <Text style={[
                            styles.bidInfoValue,
                            balance < (parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement)) && styles.balanceLow
                        ]}>
                            ${parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>

                {/* Error Message */}
                {bidError && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorBannerText}>⚠️ {bidError}</Text>
                    </View>
                )}

                {/* Bid Form */}
                {!timeRemaining.ended && user && (
                    <>
                        <View style={styles.bidFormContainer}>
                            <Text style={styles.bidFormLabel}>Your Bid Amount (USD)</Text>
                            <View style={styles.bidInputWrapper}>
                                <Text style={styles.bidCurrency}>$</Text>
                                <TextInput
                                    style={styles.bidInput}
                                    placeholder={((parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement))).toFixed(2)}
                                    value={bidAmount}
                                    onChangeText={setBidAmount}
                                    keyboardType="decimal-pad"
                                    editable={!bidLoading}
                                />
                            </View>

                            {/* Quick Bid Buttons */}
                            <View style={styles.quickBidsContainer}>
                                <TouchableOpacity
                                    style={styles.quickBidBtn}
                                    onPress={() => setBidAmount((parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement)).toFixed(2))}
                                    disabled={bidLoading}
                                >
                                    <Text style={styles.quickBidBtnText}>Min Bid</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickBidBtn}
                                    onPress={() => setBidAmount((parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement) * 2).toFixed(2))}
                                    disabled={bidLoading}
                                >
                                    <Text style={styles.quickBidBtnText}>
                                        +${(parseFloat(auction.minIncrement) * 2).toFixed(2)}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickBidBtn}
                                    onPress={() => setBidAmount((parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement) * 5).toFixed(2))}
                                    disabled={bidLoading}
                                >
                                    <Text style={styles.quickBidBtnText}>
                                        +${(parseFloat(auction.minIncrement) * 5).toFixed(2)}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Warning */}
                            <View style={styles.warningBanner}>
                                <Text style={styles.warningText}>
                                    ℹ️ Your bid will be held in your wallet until the auction ends.
                                </Text>
                            </View>

                            {/* Place Bid Button */}
                            <TouchableOpacity
                                style={[styles.placeBidBtn, bidLoading && styles.placeBidBtnDisabled]}
                                onPress={handlePlaceBid}
                                disabled={bidLoading || auction.winnerId === user.id}
                            >
                                {bidLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.placeBidBtnText}>
                                        {auction.winnerId === user.id ? 'You are Winning' : 'Confirm Bid'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* Bid History */}
                {auctionBids.length > 0 && (
                    <View style={styles.bidHistoryContainer}>
                        <Text style={styles.bidHistoryTitle}>Recent Bids</Text>
                        {auctionBids.slice(0, 10).map((bid, index) => (
                            <View key={bid._id} style={styles.bidHistoryItem}>
                                <View style={styles.bidHistoryLeft}>
                                    <Text style={styles.bidHistoryName}>
                                        {bid.bidderId?.name || 'Anonymous'}
                                    </Text>
                                    <Text style={styles.bidHistoryTime}>
                                        {new Date(bid.bidTime).toLocaleTimeString()}
                                    </Text>
                                </View>
                                <Text style={styles.bidHistoryAmount}>
                                    ${parseFloat(bid.bidAmount).toFixed(2)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.spacer} />
            </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    closeBtnText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 280,
        backgroundColor: '#f3f4f6',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 64,
    },
    timeBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    timeBadgeEnded: {
        backgroundColor: 'rgba(107, 114, 128, 0.75)',
    },
    timeBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    bidsBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(102, 126, 234, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    bidsBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    gemInfoContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    gemTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 4,
    },
    gemDetails: {
        fontSize: 12,
        color: '#6b7280',
    },
    bidInfoContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#f9fafb',
        gap: 12,
    },
    bidInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    bidInfoLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
    },
    bidInfoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a202c',
    },
    balanceLow: {
        color: '#dc2626',
    },
    errorBanner: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#fee2e2',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#dc2626',
    },
    errorBannerText: {
        color: '#dc2626',
        fontSize: 13,
        fontWeight: '500',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 16,
    },
    bidFormContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
    },
    bidFormLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    bidInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    bidCurrency: {
        position: 'absolute',
        left: 12,
        fontSize: 18,
        fontWeight: '700',
        color: '#6b7280',
    },
    bidInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        paddingLeft: 32,
        fontSize: 16,
        fontWeight: '700',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        color: '#1a202c',
    },
    quickBidsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    quickBidBtn: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 8,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
    },
    quickBidBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
    warningBanner: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#fef3c7',
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
        borderRadius: 6,
    },
    warningText: {
        fontSize: 12,
        color: '#92400e',
        fontWeight: '500',
    },
    placeBidBtn: {
        paddingVertical: 14,
        backgroundColor: '#10b981',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeBidBtnDisabled: {
        opacity: 0.5,
    },
    placeBidBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    bidHistoryContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 8,
    },
    bidHistoryTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 8,
    },
    bidHistoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#f9fafb',
        borderLeftWidth: 3,
        borderLeftColor: '#667eea',
        borderRadius: 6,
    },
    bidHistoryLeft: {
        flex: 1,
    },
    bidHistoryName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a202c',
        marginBottom: 2,
    },
    bidHistoryTime: {
        fontSize: 11,
        color: '#9ca3af',
    },
    bidHistoryAmount: {
        fontSize: 13,
        fontWeight: '700',
        color: '#667eea',
    },
    spacer: {
        height: 40,
    },
});

export default AuctionDetailScreen;