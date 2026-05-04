import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { initializeApiClient } from '../../api/services/apiClient';
import auctionAPI from '../../api/services/auctionAPI';
import gemstoneAPI from '../../api/services/gemstoneAPI';
import walletAPI from '../../api/services/walletAPI';
import { useAuth } from '../../context/AuthContext';
import HomeContent from './HomeContent';

const HomeScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [liveAuctions, setLiveAuctions] = useState([]);
    const [featuredGems, setFeaturedGems] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    useEffect(() => {
        if (user) {
            fetchWalletBalance();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            await initializeApiClient();

            const [auctionRes, gemsRes] = await Promise.all([
                auctionAPI.getLive(),
                gemstoneAPI.getAll(),
            ]);

            console.log('📊 Auction response:', auctionRes);
            console.log('📊 Gems response:', gemsRes);

            // Handle flexible response structure
            const auctionData = auctionRes?.data || auctionRes || [];
            const gemsData = gemsRes?.data || gemsRes || [];

            setLiveAuctions(Array.isArray(auctionData) ? auctionData : []);
            setFeaturedGems(Array.isArray(gemsData) ? gemsData : []);
            setError('');
        } catch (err) {
            setError(err?.message || 'Failed to load data');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletBalance = async () => {
        try {
            await initializeApiClient();
            const res = await walletAPI.getBalance();

            // Handle flexible response structure
            const balanceAmount = res?.data?.balance || res?.balance || 0;
            setBalance(balanceAmount);
        } catch (err) {
            console.error('Failed to fetch balance:', err);
        }
    };

    if (loading && liveAuctions.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <HomeContent
                    navigation={navigation}
                    liveAuctions={liveAuctions}
                    featuredGems={featuredGems}
                    error={error}
                    loading={loading}
                    onSearch={fetchData}
                />
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
});

export default HomeScreen;