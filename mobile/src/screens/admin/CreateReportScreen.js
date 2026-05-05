import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator, SafeAreaView
} from 'react-native';
import adminAPI from '../../api/services/adminAPI';
import savedReportAPI from '../../api/services/savedReportAPI';

const REPORT_TYPES = [
    { label: '💰 Revenue', value: 'revenue' },
    { label: '👥 Users', value: 'users' },
    { label: '🏪 Sellers', value: 'sellers' },
    { label: '💎 Gemstones', value: 'gemstones' },
    { label: '📊 Transactions', value: 'transactions' },
    { label: '✅ Approvals', value: 'approvals' },
    { label: '📝 Custom', value: 'custom' }
];

const PERIODS = [
    { label: 'Last 7 Days', value: 'week' },
    { label: 'Last 30 Days', value: 'month' },
    { label: 'Last Year', value: 'year' }
];

const CreateReportScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        reportType: 'revenue',
        period: 'month',
        tags: ''
    });

    useEffect(() => { fetchCurrentAnalytics(); }, [formData.period]);

    const fetchCurrentAnalytics = async () => {
        try {
            setFetchingData(true);
            const response = await adminAPI.getAnalytics(formData.period);
            setAnalyticsData(response.data);
        } catch (error) {
            console.error('Fetch analytics error:', error);
        } finally {
            setFetchingData(false);
        }
    };

    const handleChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            Alert.alert('Validation Error', 'Please enter a report title');
            return;
        }

        if (!analyticsData) {
            Alert.alert('Error', 'No analytics data to save. Please wait for data to load.');
            return;
        }

        setLoading(true);
        try {
            const tagsArray = formData.tags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                reportType: formData.reportType,
                period: formData.period,
                dateRange: {
                    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                    endDate: new Date()
                },
                data: analyticsData,
                tags: tagsArray
            };

            await savedReportAPI.create(payload);
            Alert.alert('Success', 'Report saved successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Save report error:', error);
            Alert.alert('Error', error?.response?.data?.message || 'Failed to save report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Save Report</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Report Details</Text>

                    <Text style={styles.label}>Title *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Q2 Revenue Summary"
                        value={formData.title}
                        onChangeText={(val) => handleChange('title', val)}
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Optional description..."
                        value={formData.description}
                        onChangeText={(val) => handleChange('description', val)}
                        multiline
                    />

                    <Text style={styles.label}>Report Type</Text>
                    <View style={styles.chipContainer}>
                        {REPORT_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.chip,
                                    formData.reportType === type.value && styles.chipActive
                                ]}
                                onPress={() => handleChange('reportType', type.value)}
                            >
                                <Text style={[
                                    styles.chipText,
                                    formData.reportType === type.value && styles.chipTextActive
                                ]}>{type.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Period</Text>
                    <View style={styles.periodRow}>
                        {PERIODS.map((p) => (
                            <TouchableOpacity
                                key={p.value}
                                style={[
                                    styles.periodBtn,
                                    formData.period === p.value && styles.periodBtnActive
                                ]}
                                onPress={() => handleChange('period', p.value)}
                            >
                                <Text style={[
                                    styles.periodBtnText,
                                    formData.period === p.value && styles.periodBtnTextActive
                                ]}>{p.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Tags (comma separated)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., monthly, revenue, summary"
                        value={formData.tags}
                        onChangeText={(val) => handleChange('tags', val)}
                    />
                </View>

                {fetchingData ? (
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color="#667eea" />
                        <Text style={styles.loadingText}>Fetching analytics data...</Text>
                    </View>
                ) : analyticsData ? (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>📊 Data Preview</Text>
                        <Text style={styles.previewText}>
                            ✅ Analytics data loaded successfully
                        </Text>
                        <Text style={styles.previewSmall}>
                            Revenue, users, seller stats, gemstone data and more will be saved with this report.
                        </Text>
                    </View>
                ) : null}

                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.disabledBtn]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>💾 Save Report</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
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
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
    input: {
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12,
        fontSize: 14, backgroundColor: '#f9fafb', marginBottom: 8
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    chip: {
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb'
    },
    chipActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
    chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
    chipTextActive: { color: '#fff' },
    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    periodBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 8,
        borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center'
    },
    periodBtnActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
    periodBtnText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
    periodBtnTextActive: { color: '#fff' },
    loadingCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 30, marginBottom: 15,
        elevation: 2, alignItems: 'center'
    },
    loadingText: { marginTop: 10, color: '#6b7280' },
    previewText: { fontSize: 14, color: '#10b981', fontWeight: '600' },
    previewSmall: { fontSize: 12, color: '#6b7280', marginTop: 4 },
    saveBtn: {
        backgroundColor: '#667eea', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10
    },
    disabledBtn: { opacity: 0.6 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cancelBtn: {
        backgroundColor: '#e5e7eb', padding: 15, borderRadius: 8, alignItems: 'center'
    },
    cancelBtnText: { color: '#4b5563', fontSize: 16, fontWeight: 'bold' }
});

export default CreateReportScreen;