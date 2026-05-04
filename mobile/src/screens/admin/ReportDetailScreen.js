import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import savedReportAPI from '../../api/services/savedReportAPI';

const ReportDetailScreen = ({ route, navigation }) => {
    const { reportId } = route.params;
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReport = async () => {
        try {
            const response = await savedReportAPI.getById(reportId);
            setReport(response.data);
        } catch (error) {
            console.error('Fetch report error:', error);
            Alert.alert('Error', 'Failed to load report details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchReport(); }, [reportId]);

    const handleRefreshData = async () => {
        try {
            setRefreshing(true);
            await savedReportAPI.refresh(reportId);
            Alert.alert('Success', 'Report data refreshed');
            fetchReport();
        } catch (error) {
            Alert.alert('Error', 'Failed to refresh report data');
        } finally {
            setRefreshing(false);
        }
    };

    const handleExport = async () => {
        try {
            await savedReportAPI.export(reportId);
            Alert.alert('Success', 'Report exported successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to export report');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', minimumFractionDigits: 0
        }).format(amount || 0);
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

    if (!report) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.errorText}>Report not found</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backLink}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const summary = report.data?.transactionSummary || {};

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report Details</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Report Info Card */}
                <View style={styles.card}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    {report.description ? (
                        <Text style={styles.reportDesc}>{report.description}</Text>
                    ) : null}
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>Type: {report.reportType}</Text>
                        <Text style={styles.metaText}>Period: {report.period}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>
                            Created: {new Date(report.createdAt).toLocaleDateString()}
                        </Text>
                        <Text style={styles.metaText}>
                            Status: {report.status}
                        </Text>
                    </View>
                    {report.tags?.length > 0 && (
                        <View style={styles.tagsRow}>
                            {report.tags.map((tag, idx) => (
                                <View key={idx} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Data Preview Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>📊 Report Data</Text>

                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Total Revenue</Text>
                        <Text style={styles.dataValue}>
                            {formatCurrency(summary.totalVolume)}
                        </Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Total Transactions</Text>
                        <Text style={styles.dataValue}>{summary.totalCount || 0}</Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Average Transaction</Text>
                        <Text style={styles.dataValue}>
                            {formatCurrency(summary.avgValue)}
                        </Text>
                    </View>

                    {report.data?.refreshedAt && (
                        <Text style={styles.refreshedText}>
                            🔄 Refreshed: {new Date(report.data.refreshedAt).toLocaleString()}
                        </Text>
                    )}
                </View>

                {/* Actions */}
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleRefreshData}
                    disabled={refreshing}
                >
                    <Text style={styles.actionBtnText}>
                        {refreshing ? '⏳ Refreshing...' : '🔄 Refresh Data'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.exportBtn]} onPress={handleExport}>
                    <Text style={styles.actionBtnText}>📤 Export Report</Text>
                </TouchableOpacity>
            </ScrollView>
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
    content: { padding: 15 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15,
        elevation: 2
    },
    reportTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
    reportDesc: { fontSize: 14, color: '#6b7280', marginBottom: 10, lineHeight: 20 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    metaText: { fontSize: 12, color: '#9ca3af' },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    tag: {
        backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe'
    },
    tagText: { fontSize: 11, color: '#2563eb', fontWeight: '500' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
    dataRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6'
    },
    dataLabel: { fontSize: 14, color: '#4b5563' },
    dataValue: { fontSize: 14, fontWeight: 'bold', color: '#667eea' },
    refreshedText: { fontSize: 11, color: '#9ca3af', marginTop: 10, textAlign: 'center' },
    actionBtn: {
        backgroundColor: '#667eea', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10
    },
    exportBtn: { backgroundColor: '#10b981' },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: '#ef4444', marginBottom: 12 },
    backLink: { fontSize: 14, color: '#667eea', fontWeight: '600' }
});

export default ReportDetailScreen;