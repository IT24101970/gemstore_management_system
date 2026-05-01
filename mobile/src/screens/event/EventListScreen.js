import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WalletScreen = () => {
    return (
        <View style={styles.container}>
            <Text>eventListing</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default WalletScreen;