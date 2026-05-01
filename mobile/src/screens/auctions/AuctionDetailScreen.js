import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AuctionDetailScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Auction Detail</Text>
            <Text style={styles.subtitle}>Coming Soon...</Text>
        </View>
    );
};
//
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
    },
});

export default AuctionDetailScreen;