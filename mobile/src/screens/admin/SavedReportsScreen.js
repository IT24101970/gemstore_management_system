import React, { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, RefreshControl, SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import savedReportAPI from '../../api/services/savedReportAPI';

const TYPE_LABELS = {
    revenue: '💰 Revenue',
    users: '👥 Users',
    sellers: '🏪 Sellers',
    gemstones: '💎 Gemstones',
    transactions: '📊 Transactions',
    approvals: '✅ Approvals',
    custom: '📝 Custom'
};

const STATUS_COLORS = {
    published: { bg: '#dcfce7', text: '#15803d' },
    draft: { bg: '#fef3c7', text: '#b45309' },
    archived: { bg: '#f3f4f6', text: '#6b7280' }
};

const SavedReportsScreen = ({ navigation }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    const fetchReports = async () => {
        try {
            const response = await savedReportAPI.getAll();
            setReports(response.data || []);
        } catch (error) {
            console.error('Fetch saved reports error:', error);
            Alert.alert('Error', 'Failed to load saved reports');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => { fetchReports(); }, [])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        fetchReports();
    };

    const handleDelete = (id, title) => {
        Alert.alert(
            'Delete Report',
            `Are you sure you want to delete "${title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setProcessingId(id);
                            await savedReportAPI.delete(id);
                            Alert.alert('Success', 'Report deleted');
                            fetchReports();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete report');
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const handleArchive = async (id, currentStatus) => {
        const newStatus = currentStatus === 'archived' ? 'published' : 'archived';
        try {
            setProcessingId(id);
            await savedReportAPI.update(id, { status: newStatus });
            Alert.alert('Success', `Report ${newStatus === 'archived' ? 'archived' : 'restored'}`);
            fetchReports();
        } catch (error) {
            Alert.alert('Error', 'Failed to update report status');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const renderItem = ({ item }) => {
        const statusColors = STATUS_COLORS[item.status] || STATUS_COLORS.published;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ReportDetail', { reportId: item._id })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                        <Text style={styles.cardIcon}>{TYPE_LABELS[item.reportType]?.split(' ')[0] || '📊'}</Text>
                        <View style={styles.cardTitleArea}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.cardType}>{TYPE_LABELS[item.reportType] || item.reportType}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusText, { color: statusColors.text }]}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                    </View>
                </View>

                {item.description ? (
                    <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
                ) : null}

                <View style={styles.cardMeta}>
                    <Text style={styles.metaText}>Period: {item.period || 'N/A'}</Text>
                    <Text style={styles.metaText}>Created: {formatDate(item.createdAt)}</Text>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('ReportDetail', { reportId: item._id })}
                    >
                        <Text style={styles.actionBtnText}>👁 View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.archiveBtn]}
                        onPress={() => handleArchive(item._id, item.status)}
                        disabled={processingId === item._id}
                    >
                        <Text style={styles.actionBtnText}>
                            {item.status === 'archived' ? '📂 Restore' : '📦 Archive'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => handleDelete(item._id, item.title)}
                        disabled={processingId === item._id}
                    >
                        <Text style={[styles.actionBtnText, { color: '#fff' }]}>🗑 Delete</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Reports</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('CreateReport')}
                >
                    <Text style={styles.addBtnText}>+ New</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={reports}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyTitle}>No Saved Reports</Text>
                        <Text style={styles.emptyText}>Tap "+ New" to save your first analytics report</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb'
    },
    backBtn: { color: '#667eea', fontWeight: 'bold', fontSize: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    addBtn: { backgroundColor: '#667eea', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    list: { padding: 15, paddingTop: 5 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
    cardIcon: { fontSize: 24 },
    cardTitleArea: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1f2937' },
    cardType: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: '600' },
    cardDescription: { fontSize: 13, color: '#4b5563', marginBottom: 8, lineHeight: 18 },
    cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    metaText: { fontSize: 11, color: '#9ca3af' },
    cardActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
    actionBtn: {
        flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center',
        backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb'
    },
    actionBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
    archiveBtn: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
    deleteBtn: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { paddingTop: 80, alignItems: 'center' },
    emptyIcon: { fontSize: 56, marginBottom: 12 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
    emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' }
});

export default SavedReportsScreen;