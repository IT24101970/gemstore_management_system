import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
    Alert,
    Share,
    Dimensions,
} from 'react-native';
import adminAPI from '../../api/services/adminAPI';

const { width } = Dimensions.get('window');

const ReportsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [period, setPeriod] = useState('month');
    const [topSellers, setTopSellers] = useState([]);
    const [topGems, setTopGems] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [expandedSection, setExpandedSection] = useState(null);

    const fetchAllData = async () => {
        try {
            setLoading(true);

            // Fetch main analytics
            const response = await adminAPI.getAnalytics(period);
            setAnalytics(response.data);

            // Fetch top sellers
            const sellersResponse = await adminAPI.getTopSellers();
            setTopSellers(sellersResponse.data || []);

            // Fetch top selling gemstones
            const gemsResponse = await adminAPI.getTopGemstones();
            setTopGems(gemsResponse.data || []);

            // Fetch top customers
            const customersResponse = await adminAPI.getTopCustomers();
            setTopCustomers(customersResponse.data || []);

            // Fetch monthly revenue data for chart
            const chartResponse = await adminAPI.getRevenueTimeline(period);
            setChartData(chartResponse.data || []);

        } catch (error) {
            console.error('Fetch data error:', error);
            Alert.alert('Error', 'Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAllData();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchAllData();
    }, [period]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num || 0);
    };

    const exportToPDF = async () => {
        // Create report content as text (since PDF generation is complex)
        const reportContent = generateReportContent();

        try {
            await Share.share({
                message: reportContent,
                title: 'GemMarket Report',
            });
            Alert.alert('Success', 'Report shared successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to share report');
        }
    };

    const generateReportContent = () => {
        const summary = analytics?.transactionSummary || {};
        const sellers = analytics?.sellers || [];
        const gemstones = analytics?.gemstones || [];

        const totalSellers = sellers.find(s => s._id === 'approved')?.count || 0;
        const pendingSellers = sellers.find(s => s._id === 'pending')?.count || 0;
        const approvedGemstones = gemstones.find(g => g._id === 'approved')?.count || 0;

        return `
📊 GEM MARKET REPORT - ${new Date().toLocaleDateString()}
${'='.repeat(40)}

💰 REVENUE OVERVIEW
Total Revenue: ${formatCurrency(summary.totalVolume)}
Total Transactions: ${summary.totalCount || 0}
Average Transaction: ${formatCurrency(summary.avgValue)}

👥 USER STATISTICS
Total Sellers: ${totalSellers}
Pending Approvals: ${pendingSellers}
Approved Gemstones: ${approvedGemstones}

🏆 TOP SELLERS
${topSellers.slice(0, 3).map((s, i) => `${i+1}. ${s.businessName}: ${formatCurrency(s.totalSales)}`).join('\n')}

💎 TOP GEMSTONES
${topGems.slice(0, 3).map((g, i) => `${i+1}. ${g.name}: ${formatCurrency(g.sales)}`).join('\n')}

Report generated on ${new Date().toLocaleString()}
        `;
    };

    const PeriodButton = ({ label, value }) => (
        <TouchableOpacity
            style={[styles.periodBtn, period === value && styles.activePeriodBtn]}
            onPress={() => setPeriod(value)}
        >
            <Text style={[styles.periodBtnText, period === value && styles.activePeriodBtnText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const StatCard = ({ title, value, color, subtitle }) => (
        <View style={styles.statCard}>
            <Text style={styles.statCardTitle}>{title}</Text>
            <Text style={[styles.statCardValue, { color }]}>{value}</Text>
            {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
        </View>
    );

    const ToggleSection = ({ title, icon, children }) => (
        <View style={styles.sectionCard}>
            <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setExpandedSection(expandedSection === title ? null : title)}
            >
                <Text style={styles.sectionHeaderText}>{icon} {title}</Text>
                <Text style={styles.sectionHeaderArrow}>
                    {expandedSection === title ? '▼' : '▶'}
                </Text>
            </TouchableOpacity>
            {expandedSection === title && (
                <View style={styles.sectionContent}>
                    {children}
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtn}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Reports</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Loading analytics...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const summary = analytics?.transactionSummary || {};
    const users = analytics?.users || [];
    const sellers = analytics?.sellers || [];
    const gemstones = analytics?.gemstones || [];

    const totalUsers = users.reduce((sum, u) => sum + u.count, 0);
    const totalSellers = sellers.find(s => s._id === 'approved')?.count || 0;
    const pendingSellers = sellers.find(s => s._id === 'pending')?.count || 0;
    const rejectedSellers = sellers.find(s => s._id === 'rejected')?.count || 0;

    // Approval ratio
    const approvedGemstones = gemstones.find(g => g._id === 'approved')?.count || 0;
    const pendingGemstones = gemstones.find(g => g._id === 'pending')?.count || 0;
    const rejectedGemstones = gemstones.find(g => g._id === 'rejected')?.count || 0;
    const totalGemstones = approvedGemstones + pendingGemstones + rejectedGemstones;
    const approvalRate = totalGemstones > 0 ? ((approvedGemstones / totalGemstones) * 100).toFixed(1) : 0;

    // Calculate gem type distribution (Popular Gem Types)
    const gemTypes = analytics?.gemTypes || [
        { type: 'Blue Sapphire', count: 45, percentage: 35 },
        { type: 'Ruby', count: 30, percentage: 23 },
        { type: 'Emerald', count: 25, percentage: 19 },
        { type: 'Yellow Sapphire', count: 18, percentage: 14 },
        { type: 'Other', count: 12, percentage: 9 },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analytics & Reports</Text>
                <TouchableOpacity onPress={exportToPDF} style={styles.exportBtn}>
                    <Text style={styles.exportBtnText}>📤 Share</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Period Selector */}
                <View style={styles.periodContainer}>
                    <PeriodButton label="Last 7 Days" value="week" />
                    <PeriodButton label="Last 30 Days" value="month" />
                    <PeriodButton label="Last Year" value="year" />
                </View>

                {/* Revenue Stats */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>💰 Revenue Overview</Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            title="Total Revenue"
                            value={formatCurrency(summary.totalVolume)}
                            color="#10b981"
                        />
                        <StatCard
                            title="Total Transactions"
                            value={formatNumber(summary.totalCount)}
                            color="#667eea"
                        />
                        <StatCard
                            title="Average Transaction"
                            value={formatCurrency(summary.avgValue)}
                            color="#f59e0b"
                        />
                    </View>
                </View>

                {/* Monthly Revenue Chart (Visual) */}
                <ToggleSection title="Monthly Revenue Trend" icon="📈">
                    <View style={styles.chartContainer}>
                        {chartData.length > 0 ? (
                            chartData.map((item, index) => {
                                const maxValue = Math.max(...chartData.map(d => d.total));
                                const barHeight = maxValue > 0 ? (item.total / maxValue) * 100 : 0;
                                return (
                                    <View key={index} style={styles.chartBarContainer}>
                                        <View style={[styles.chartBar, { height: barHeight }]} />
                                        <Text style={styles.chartLabel}>{item._id}</Text>
                                        <Text style={styles.chartValue}>{formatCurrency(item.total)}</Text>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.emptyText}>No chart data available</Text>
                        )}
                    </View>
                </ToggleSection>

                {/* Transaction Breakdown */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>📊 Transaction Breakdown</Text>
                    <View style={styles.breakdownCard}>
                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Deposits</Text>
                            <Text style={styles.breakdownValue}>{formatCurrency(summary.totalTopups)}</Text>
                        </View>
                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Purchases</Text>
                            <Text style={styles.breakdownValue}>{formatCurrency(summary.purchaseTotal)}</Text>
                        </View>
                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Bids</Text>
                            <Text style={styles.breakdownValue}>{formatCurrency(summary.bidTotal)}</Text>
                        </View>
                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Refunds</Text>
                            <Text style={styles.breakdownValue}>{formatCurrency(summary.totalRefunds)}</Text>
                        </View>
                    </View>
                </View>

                {/* Approval/Rejection Ratio */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>✅ Approval Performance</Text>
                    <View style={styles.approvalRateContainer}>
                        <Text style={styles.approvalRateValue}>{approvalRate}%</Text>
                        <Text style={styles.approvalRateLabel}>Approval Rate</Text>
                    </View>
                    <View style={styles.approvalStats}>
                        <View style={styles.approvalStat}>
                            <Text style={[styles.approvalStatValue, { color: '#10b981' }]}>{approvedGemstones}</Text>
                            <Text style={styles.approvalStatLabel}>Approved</Text>
                        </View>
                        <View style={styles.approvalStat}>
                            <Text style={[styles.approvalStatValue, { color: '#f59e0b' }]}>{pendingGemstones}</Text>
                            <Text style={styles.approvalStatLabel}>Pending</Text>
                        </View>
                        <View style={styles.approvalStat}>
                            <Text style={[styles.approvalStatValue, { color: '#ef4444' }]}>{rejectedGemstones}</Text>
                            <Text style={styles.approvalStatLabel}>Rejected</Text>
                        </View>
                    </View>
                </View>

                {/* Popular Gem Types (Pie Chart Style) */}
                <ToggleSection title="Popular Gem Types" icon="💎">
                    {gemTypes.map((type, index) => (
                        <View key={index} style={styles.typeRow}>
                            <View style={styles.typeInfo}>
                                <Text style={styles.typeName}>{type.type}</Text>
                                <Text style={styles.typeCount}>{type.count} listings</Text>
                            </View>
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBar, { width: `${type.percentage}%` }]} />
                            </View>
                            <Text style={styles.typePercentage}>{type.percentage}%</Text>
                        </View>
                    ))}
                </ToggleSection>

                {/* Top Selling Gemstones */}
                <ToggleSection title="Top Selling Gemstones" icon="🏆">
                    {topGems.length > 0 ? (
                        topGems.slice(0, 5).map((gem, index) => (
                            <View key={index} style={styles.topItemRow}>
                                <Text style={styles.topItemRank}>#{index + 1}</Text>
                                <Text style={styles.topItemName}>{gem.name || gem.title || 'Gemstone'}</Text>
                                <Text style={styles.topItemValue}>{formatCurrency(gem.sales || gem.total || 0)}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No sales data available</Text>
                    )}
                </ToggleSection>

                {/* Seller Performance Ranking */}
                <ToggleSection title="Seller Performance Ranking" icon="🎖️">
                    {topSellers.length > 0 ? (
                        topSellers.slice(0, 5).map((seller, index) => (
                            <View key={index} style={styles.topItemRow}>
                                <Text style={styles.topItemRank}>#{index + 1}</Text>
                                <Text style={styles.topItemName}>{seller.businessName || seller.name || 'Seller'}</Text>
                                <Text style={styles.topItemValue}>{formatCurrency(seller.totalSales || 0)}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No seller data available</Text>
                    )}
                </ToggleSection>

                {/* Customer Spending Habits (VIP Buyers) */}
                <ToggleSection title="VIP Customers (Top Spenders)" icon="👑">
                    {topCustomers.length > 0 ? (
                        topCustomers.slice(0, 5).map((customer, index) => (
                            <View key={index} style={styles.topItemRow}>
                                <Text style={styles.topItemRank}>#{index + 1}</Text>
                                <Text style={styles.topItemName}>{customer.name || 'Customer'}</Text>
                                <Text style={styles.topItemValue}>{formatCurrency(customer.totalSpent || 0)}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No customer data available</Text>
                    )}
                </ToggleSection>

                {/* User Statistics */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>👥 User Statistics</Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            title="Total Users"
                            value={formatNumber(totalUsers)}
                            color="#667eea"
                        />
                        <StatCard
                            title="Verified Sellers"
                            value={formatNumber(totalSellers)}
                            color="#10b981"
                        />
                        <StatCard
                            title="Pending Sellers"
                            value={formatNumber(pendingSellers)}
                            color="#f59e0b"
                        />
                        <StatCard
                            title="Rejected Sellers"
                            value={formatNumber(rejectedSellers)}
                            color="#ef4444"
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backBtn: {
        color: '#667eea',
        fontWeight: 'bold',
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    exportBtn: {
        backgroundColor: '#667eea',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    exportBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    scrollContent: {
        padding: 15,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    loadingText: {
        marginTop: 10,
        color: '#6b7280',
    },
    periodContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 4,
        marginBottom: 20,
    },
    periodBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activePeriodBtn: {
        backgroundColor: '#667eea',
    },
    periodBtnText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    activePeriodBtnText: {
        color: '#fff',
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    sectionHeaderArrow: {
        fontSize: 14,
        color: '#667eea',
    },
    sectionContent: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '30%',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    statCardTitle: {
        fontSize: 11,
        color: '#6b7280',
        marginBottom: 6,
    },
    statCardValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statCardSubtitle: {
        fontSize: 10,
        color: '#9ca3af',
        marginTop: 4,
    },
    breakdownCard: {
        marginBottom: 5,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#4b5563',
    },
    breakdownValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#667eea',
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: 200,
        paddingVertical: 10,
    },
    chartBarContainer: {
        alignItems: 'center',
        width: 50,
    },
    chartBar: {
        width: 30,
        backgroundColor: '#667eea',
        borderRadius: 6,
        minHeight: 4,
    },
    chartLabel: {
        fontSize: 10,
        color: '#6b7280',
        marginTop: 8,
    },
    chartValue: {
        fontSize: 9,
        color: '#10b981',
        marginTop: 2,
    },
    approvalRateContainer: {
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        marginBottom: 15,
    },
    approvalRateValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#10b981',
    },
    approvalRateLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 5,
    },
    approvalStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    approvalStat: {
        alignItems: 'center',
    },
    approvalStatValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    approvalStatLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    typeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    typeInfo: {
        width: 120,
    },
    typeName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1f2937',
    },
    typeCount: {
        fontSize: 11,
        color: '#6b7280',
    },
    progressBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        marginHorizontal: 10,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#10b981',
        borderRadius: 4,
    },
    typePercentage: {
        width: 45,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#667eea',
        textAlign: 'right',
    },
    topItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    topItemRank: {
        width: 40,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#667eea',
    },
    topItemName: {
        flex: 1,
        fontSize: 14,
        color: '#1f2937',
    },
    topItemValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10b981',
    },
    emptyText: {
        textAlign: 'center',
        color: '#9ca3af',
        paddingVertical: 20,
    },
});

export default ReportsScreen;