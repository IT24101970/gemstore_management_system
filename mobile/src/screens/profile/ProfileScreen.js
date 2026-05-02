import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
    const { user, signOut } = useAuth();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                </View>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Text style={styles.userRole}>{(user?.role || 'user').toUpperCase()}</Text>
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Account Information</Text>
                
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
                
                {user?.role === 'seller' && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Business Status</Text>
                        <Text style={styles.infoValue}>Approved Seller</Text>
                    </View>
                )}
            </View>

            <View style={styles.actionsSection}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
                    <Text style={styles.actionBtnText}>Edit Profile</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
                    <Text style={styles.actionBtnText}>Change Password</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
                    <Text style={styles.actionBtnText}>Notification Settings</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        backgroundColor: '#fff',
        padding: 30,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 5,
    },
    userRole: {
        fontSize: 12,
        color: '#667eea',
        fontWeight: '700',
        letterSpacing: 1,
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    infoSection: {
        backgroundColor: '#fff',
        marginTop: 20,
        padding: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    infoLabel: {
        color: '#6b7280',
        fontSize: 14,
    },
    infoValue: {
        color: '#1f2937',
        fontSize: 14,
        fontWeight: '500',
    },
    actionsSection: {
        backgroundColor: '#fff',
        marginTop: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
    },
    actionBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    actionBtnText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    arrow: {
        fontSize: 20,
        color: '#9ca3af',
    },
    logoutBtn: {
        marginTop: 30,
        marginHorizontal: 20,
        marginBottom: 40,
        backgroundColor: '#fee2e2',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutText: {
        color: '#dc2626',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;