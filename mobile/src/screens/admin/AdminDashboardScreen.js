import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const AdminDashboardScreen = ({ navigation }) => {
    const { user } = useAuth();

    const handleFeaturePress = (feature) => {
        Alert.alert('Coming Soon', `${feature} management will be available in future updates.`);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Admin Panel</Text>
                <Text style={styles.headerSubtitle}>Welcome back, {user?.name}</Text>
            </View>

            <View style={styles.grid}>
                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => handleFeaturePress('Gem Approvals')}
                >
                    <Text style={styles.cardIcon}>✅</Text>
                    <Text style={styles.cardTitle}>Approvals</Text>
                    <Text style={styles.cardSubtitle}>Review new gem listings</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => handleFeaturePress('User Management')}
                >
                    <Text style={styles.cardIcon}>👥</Text>
                    <Text style={styles.cardTitle}>Users</Text>
                    <Text style={styles.cardSubtitle}>Manage accounts</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => navigation.navigate('CreateEvent')}
                >
                    <Text style={styles.cardIcon}>📅</Text>
                    <Text style={styles.cardTitle}>Create Event</Text>
                    <Text style={styles.cardSubtitle}>Create new events</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => handleFeaturePress('Disputes')}
                >
                    <Text style={styles.cardIcon}>⚖️</Text>
                    <Text style={styles.cardTitle}>Disputes</Text>
                    <Text style={styles.cardSubtitle}>Resolve auction issues</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => handleFeaturePress('Reports')}
                >
                    <Text style={styles.cardIcon}>📊</Text>
                    <Text style={styles.cardTitle}>Reports</Text>
                    <Text style={styles.cardSubtitle}>View system analytics</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => handleFeaturePress('System Settings')}
                >
                    <Text style={styles.cardIcon}>⚙️</Text>
                    <Text style={styles.cardTitle}>Settings</Text>
                    <Text style={styles.cardSubtitle}>Configure platform</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
        paddingTop: 30,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: '#fff',
        width: '48%',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardIcon: {
        fontSize: 32,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 5,
    },
});

export default AdminDashboardScreen;
