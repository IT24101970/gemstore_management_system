import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Image,
    Alert,
    Platform,
    Modal,
    FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { initializeApiClient } from '../../api/services/apiClient';
import auctionAPI from '../../api/services/auctionAPI';
import { useAuth } from '../../context/AuthContext';

const CreateAuctionScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: Select Gem, 2: Set Prices, 3: Set Times, 4: Review
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [gemsLoading, setGemsLoading] = useState(true);

    const [gemstones, setGemstones] = useState([]);
    const [selectedGem, setSelectedGem] = useState(null);
    const [gemSearch, setGemSearch] = useState('');

    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [gemModalVisible, setGemModalVisible] = useState(false);

    const [auctionData, setAuctionData] = useState({
        gemId: '',
        startPrice: '',
        currentPrice: '',
        minIncrement: '',
        reservePrice: '',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000), // 1 hour later
    });

    // Fetch available gemstones
    useEffect(() => {
        const fetchGemstones = async () => {
            try {
                await initializeApiClient();
                const response = await auctionAPI.getAvailableGemstones();
                const data = response?.data?.data || response?.data || response;
                if (Array.isArray(data)) {
                    setGemstones(data);
                } else {
                    setGemstones([]);
                    setError('Failed to fetch your gemstones');
                }
            } catch (err) {
                console.error('Failed to fetch gemstones:', err);
                setError('Failed to load your gemstones');
            } finally {
                setGemsLoading(false);
            }
        };

        if (user) {
            fetchGemstones();
        }
    }, [user]);

    // Filter gemstones based on search
    const filteredGemstones = gemstones.filter(gem =>
        gem.title?.toLowerCase().includes(gemSearch.toLowerCase()) ||
        gem.type?.toLowerCase().includes(gemSearch.toLowerCase())
    );

    // Get gem image
    const getGemImage = (gem) => {
        if (gem.images && gem.images.length > 0) {
            const primaryImage = gem.images.find(img => img.isPrimary);
            return primaryImage ? primaryImage.url : gem.images[0].url;
        }
        return 'https://via.placeholder.com/200x200?text=No+Image';
    };

    // Handle gem selection
    const handleSelectGem = (gem) => {
        setSelectedGem(gem);
        setAuctionData({
            ...auctionData,
            gemId: gem._id,
            currentPrice: gem.price?.toString() || '',
        });
        setGemModalVisible(false);
        setError('');
    };

    // Handle input changes
    const handleChange = (name, value) => {
        setAuctionData({
            ...auctionData,
            [name]: value,
        });
        setError('');
    };

    // Validate step 1
    const validateStep1 = () => {
        if (!selectedGem) {
            setError('Please select a gemstone');
            return false;
        }
        return true;
    };

    // Validate step 2
    const validateStep2 = () => {
        if (!auctionData.startPrice || !auctionData.currentPrice || !auctionData.minIncrement) {
            setError('Please fill in all required price fields');
            return false;
        }

        if (parseFloat(auctionData.startPrice) <= 0) {
            setError('Start price must be greater than 0');
            return false;
        }

        if (parseFloat(auctionData.currentPrice) < parseFloat(auctionData.startPrice)) {
            setError('Current price cannot be less than start price');
            return false;
        }

        if (parseFloat(auctionData.minIncrement) <= 0) {
            setError('Minimum increment must be greater than 0');
            return false;
        }

        if (auctionData.reservePrice && parseFloat(auctionData.reservePrice) < parseFloat(auctionData.startPrice)) {
            setError('Reserve price cannot be less than start price');
            return false;
        }

        return true;
    };

    // Validate step 3
    const validateStep3 = () => {
        if (!auctionData.startTime || !auctionData.endTime) {
            setError('Please set start and end times');
            return false;
        }

        const startTime = new Date(auctionData.startTime);
        const endTime = new Date(auctionData.endTime);
        const now = new Date();

        if (startTime < now) {
            setError('Start time must be in the future');
            return false;
        }

        if (endTime <= startTime) {
            setError('End time must be after start time');
            return false;
        }

        // Minimum auction duration: 1 hour
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        if (durationHours < 1) {
            setError('Auction must be at least 1 hour long');
            return false;
        }

        return true;
    };

    // Handle next step
    const handleNextStep = () => {
        let isValid = false;

        switch (step) {
            case 1:
                isValid = validateStep1();
                break;
            case 2:
                isValid = validateStep2();
                break;
            case 3:
                isValid = validateStep3();
                break;
            default:
                isValid = true;
        }

        if (isValid) {
            setStep(step + 1);
            setError('');
        }
    };

    // Handle previous step
    const handlePrevStep = () => {
        setStep(step - 1);
        setError('');
    };

    // Handle date change
    const handleStartDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowStartDatePicker(false);
        }
        if (selectedDate) {
            setAuctionData({
                ...auctionData,
                startTime: selectedDate,
            });
        }
    };

    const handleEndDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowEndDatePicker(false);
        }
        if (selectedDate) {
            setAuctionData({
                ...auctionData,
                endTime: selectedDate,
            });
        }
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!validateStep3()) return;

        setLoading(true);
        setError('');

        try {
            await initializeApiClient();

            const submissionData = {
                gemId: auctionData.gemId,
                startPrice: parseFloat(auctionData.startPrice),
                currentPrice: parseFloat(auctionData.currentPrice),
                minIncrement: parseFloat(auctionData.minIncrement),
                reservePrice: auctionData.reservePrice ? parseFloat(auctionData.reservePrice) : null,
                startTime: auctionData.startTime.toISOString(),
                endTime: auctionData.endTime.toISOString(),
                status: 'scheduled',
            };

            const response = await auctionAPI.create(submissionData);

            if (response) {
                Alert.alert('✅ Success', 'Auction created successfully!', [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.navigate('AuctionsTab');
                        },
                    },
                ]);
            }
        } catch (err) {
            setError(err?.message || 'Failed to create auction');
        } finally {
            setLoading(false);
        }
    };

    // Format date
    const formatDate = (date) => {
        return date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Calculate duration
    const getDurationHours = () => {
        return Math.floor((auctionData.endTime - auctionData.startTime) / (1000 * 60 * 60));
    };

    // Render gem modal
    const renderGemCard = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.gemCard,
                selectedGem?._id === item._id && styles.gemCardSelected,
            ]}
            onPress={() => handleSelectGem(item)}
        >
            <Image
                source={{ uri: getGemImage(item) }}
                style={styles.gemImage}
            />
            <View style={styles.gemContent}>
                <Text style={styles.gemTitle} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text style={styles.gemType}>{item.type}</Text>
                <Text style={styles.gemDetails}>
                    {item.attributes?.carat || '0'} ct • {item.attributes?.cut || 'Cut'}
                </Text>
                <Text style={styles.gemPrice}>
                    ${item.price?.toLocaleString() || '0'}
                </Text>
            </View>
            {selectedGem?._id === item._id && (
                <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Auction</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Progress Steps */}
            <View style={styles.progressContainer}>
                {[1, 2, 3, 4].map((stepNum) => (
                    <View key={stepNum} style={styles.progressWrapper}>
                        <View
                            style={[
                                styles.stepCircle,
                                step >= stepNum && styles.stepCircleActive,
                                step > stepNum && styles.stepCircleCompleted,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.stepNumber,
                                    step >= stepNum && styles.stepNumberActive,
                                ]}
                            >
                                {step > stepNum ? '✓' : stepNum}
                            </Text>
                        </View>
                        {stepNum < 4 && (
                            <View
                                style={[
                                    styles.progressLine,
                                    step > stepNum && styles.progressLineActive,
                                ]}
                            />
                        )}
                    </View>
                ))}
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Title */}
                <Text style={styles.title}>
                    {step === 1 && 'Select a Gemstone'}
                    {step === 2 && 'Set Auction Prices'}
                    {step === 3 && 'Set Auction Timeline'}
                    {step === 4 && 'Review Your Auction'}
                </Text>

                {/* Error */}
                {error && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                )}

                {/* Step 1: Select Gemstone */}
                {step === 1 && (
                    <View style={styles.stepContent}>
                        {gemsLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#667eea" />
                                <Text style={styles.loadingText}>Loading your gemstones...</Text>
                            </View>
                        ) : gemstones.length > 0 ? (
                            <>
                                <TouchableOpacity
                                    style={styles.selectGemButton}
                                    onPress={() => setGemModalVisible(true)}
                                >
                                    {selectedGem ? (
                                        <View style={styles.selectedGemDisplay}>
                                            <Image
                                                source={{ uri: getGemImage(selectedGem) }}
                                                style={styles.selectedGemImage}
                                            />
                                            <View style={styles.selectedGemInfo}>
                                                <Text style={styles.selectedGemTitle}>
                                                    {selectedGem.title}
                                                </Text>
                                                <Text style={styles.selectedGemMeta}>
                                                    {selectedGem.type} • {selectedGem.attributes?.carat} ct
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.selectGemPlaceholder}>
                                            <Text style={styles.selectGemPlaceholderText}>
                                                💎 Tap to select a gemstone
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* Gem Selection Modal */}
                                <Modal
                                    visible={gemModalVisible}
                                    animationType="slide"
                                    transparent
                                    onRequestClose={() => setGemModalVisible(false)}
                                >
                                    <View style={styles.modalOverlay}>
                                        <View style={styles.modalContent}>
                                            <View style={styles.modalHeader}>
                                                <Text style={styles.modalTitle}>Select Gemstone</Text>
                                                <TouchableOpacity
                                                    onPress={() => setGemModalVisible(false)}
                                                >
                                                    <Text style={styles.modalCloseBtn}>✕</Text>
                                                </TouchableOpacity>
                                            </View>

                                            <View style={styles.modalSearchField}>
                                                <TextInput
                                                    style={styles.modalSearchInput}
                                                    placeholder="Search..."
                                                    value={gemSearch}
                                                    onChangeText={setGemSearch}
                                                    placeholderTextColor="#9ca3af"
                                                />
                                            </View>

                                            <FlatList
                                                data={filteredGemstones}
                                                renderItem={renderGemCard}
                                                keyExtractor={(item) => item._id}
                                                numColumns={2}
                                                columnWrapperStyle={styles.gemGridRow}
                                                contentContainerStyle={styles.gemGridContainer}
                                            />
                                        </View>
                                    </View>
                                </Modal>
                            </>
                        ) : (
                            <View style={styles.noGemsContainer}>
                                <Text style={styles.noGemsIcon}>💎</Text>
                                <Text style={styles.noGemsTitle}>No Available Gemstones</Text>
                                <Text style={styles.noGemsText}>
                                    You can only auction gemstones with "available" status
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Step 2: Set Prices */}
                {step === 2 && (
                    <View style={styles.stepContent}>
                        {selectedGem && (
                            <View style={styles.selectedGemSummary}>
                                <Image
                                    source={{ uri: getGemImage(selectedGem) }}
                                    style={styles.summaryGemImage}
                                />
                                <View>
                                    <Text style={styles.summaryGemTitle}>
                                        {selectedGem.title}
                                    </Text>
                                    <Text style={styles.summaryGemMeta}>
                                        {selectedGem.type} • {selectedGem.attributes?.carat} ct
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Start Price */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Starting Price</Text>
                            <View style={styles.currencyInput}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                    value={auctionData.startPrice}
                                    onChangeText={(value) => handleChange('startPrice', value)}
                                />
                            </View>
                            <Text style={styles.inputHint}>The initial bid amount for the auction</Text>
                        </View>

                        {/* Current Price */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Current Bid</Text>
                            <View style={styles.currencyInput}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                    value={auctionData.currentPrice}
                                    onChangeText={(value) => handleChange('currentPrice', value)}
                                />
                            </View>
                            <Text style={styles.inputHint}>Current highest bid (must be ≥ start price)</Text>
                        </View>

                        {/* Minimum Increment */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Minimum Bid Increment</Text>
                            <View style={styles.currencyInput}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                    value={auctionData.minIncrement}
                                    onChangeText={(value) => handleChange('minIncrement', value)}
                                />
                            </View>
                            <Text style={styles.inputHint}>Minimum amount each bid must increase by</Text>
                        </View>

                        {/* Reserve Price */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Reserve Price (Optional)</Text>
                            <View style={styles.currencyInput}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                    value={auctionData.reservePrice}
                                    onChangeText={(value) => handleChange('reservePrice', value)}
                                />
                            </View>
                            <Text style={styles.inputHint}>
                                Minimum price you're willing to accept
                            </Text>
                        </View>
                    </View>
                )}

                {/* Step 3: Set Times */}
                {step === 3 && (
                    <View style={styles.stepContent}>
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Auction Timeline</Text>

                            {/* Start Time */}
                            <View style={styles.dateTimeGroup}>
                                <Text style={styles.formLabel}>Start Date & Time *</Text>
                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowStartDatePicker(true)}
                                >
                                    <Text style={styles.dateTimeButtonText}>
                                        📅 {formatDate(auctionData.startTime)}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {showStartDatePicker && (
                                <DateTimePicker
                                    value={auctionData.startTime}
                                    mode="datetime"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleStartDateChange}
                                />
                            )}

                            {/* End Time */}
                            <View style={styles.dateTimeGroup}>
                                <Text style={styles.formLabel}>End Date & Time *</Text>
                                <TouchableOpacity
                                    style={styles.dateTimeButton}
                                    onPress={() => setShowEndDatePicker(true)}
                                >
                                    <Text style={styles.dateTimeButtonText}>
                                        📅 {formatDate(auctionData.endTime)}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {showEndDatePicker && (
                                <DateTimePicker
                                    value={auctionData.endTime}
                                    mode="datetime"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleEndDateChange}
                                />
                            )}

                            {/* Duration Info */}
                            {auctionData.startTime && auctionData.endTime && (
                                <View style={styles.durationInfo}>
                                    <Text style={styles.durationLabel}>⏱️ Duration</Text>
                                    <Text style={styles.durationValue}>
                                        {getDurationHours()} hours
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <View style={styles.stepContent}>
                        {/* Gemstone Review */}
                        <View style={styles.reviewSection}>
                            <Text style={styles.reviewTitle}>Gemstone</Text>
                            {selectedGem && (
                                <View style={styles.reviewGem}>
                                    <Image
                                        source={{ uri: getGemImage(selectedGem) }}
                                        style={styles.reviewGemImage}
                                    />
                                    <View>
                                        <Text style={styles.reviewGemTitle}>
                                            {selectedGem.title}
                                        </Text>
                                        <Text style={styles.reviewGemMeta}>
                                            {selectedGem.type} • {selectedGem.attributes?.carat} ct
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Pricing Review */}
                        <View style={styles.reviewSection}>
                            <Text style={styles.reviewTitle}>Pricing Details</Text>
                            <View style={styles.reviewItem}>
                                <Text style={styles.reviewLabel}>Start Price:</Text>
                                <Text style={styles.reviewValue}>
                                    ${parseFloat(auctionData.startPrice).toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.reviewItem}>
                                <Text style={styles.reviewLabel}>Current Price:</Text>
                                <Text style={styles.reviewValue}>
                                    ${parseFloat(auctionData.currentPrice).toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.reviewItem}>
                                <Text style={styles.reviewLabel}>Min. Increment:</Text>
                                <Text style={styles.reviewValue}>
                                    ${parseFloat(auctionData.minIncrement).toLocaleString()}
                                </Text>
                            </View>
                            {auctionData.reservePrice && (
                                <View style={styles.reviewItem}>
                                    <Text style={styles.reviewLabel}>Reserve Price:</Text>
                                    <Text style={styles.reviewValue}>
                                        ${parseFloat(auctionData.reservePrice).toLocaleString()}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Timeline Review */}
                        <View style={styles.reviewSection}>
                            <Text style={styles.reviewTitle}>Timeline</Text>
                            <View style={styles.reviewItem}>
                                <Text style={styles.reviewLabel}>Start:</Text>
                                <Text style={styles.reviewValue}>
                                    {formatDate(auctionData.startTime)}
                                </Text>
                            </View>
                            <View style={styles.reviewItem}>
                                <Text style={styles.reviewLabel}>End:</Text>
                                <Text style={styles.reviewValue}>
                                    {formatDate(auctionData.endTime)}
                                </Text>
                            </View>
                            <View style={styles.reviewItem}>
                                <Text style={styles.reviewLabel}>Duration:</Text>
                                <Text style={styles.reviewValue}>
                                    {getDurationHours()} hours
                                </Text>
                            </View>
                        </View>

                        {/* Info Box */}
                        <View style={styles.infoBox}>
                            <Text style={styles.infoBoxTitle}>⚠️ Before you publish:</Text>
                            <Text style={styles.infoBoxText}>
                                • Review all details carefully{'\n'}
                                • Once published, auction cannot be modified{'\n'}
                                • Auction will start at the scheduled time{'\n'}
                                • Bids cannot be canceled
                            </Text>
                        </View>
                    </View>
                )}

                {/* Spacing */}
                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Form Actions */}
            <View style={styles.formActions}>
                {step > 1 && (
                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={handlePrevStep}
                    >
                        <Text style={styles.btnSecondaryText}>← Previous</Text>
                    </TouchableOpacity>
                )}

                {step < 4 ? (
                    <TouchableOpacity
                        style={[styles.btnPrimary, step === 1 && { marginLeft: 'auto' }]}
                        onPress={handleNextStep}
                    >
                        <Text style={styles.btnPrimaryText}>Next →</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.btnSubmit,
                            loading && styles.btnDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.btnSubmitText}>
                            {loading ? 'Publishing...' : '✓ Publish Auction'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backBtn: {
        color: '#667eea',
        fontWeight: '600',
        fontSize: 14,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a202c',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 20,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    progressWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleActive: {
        backgroundColor: '#667eea',
        elevation: 3,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    stepCircleCompleted: {
        backgroundColor: '#667eea',
    },
    stepNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#9ca3af',
    },
    stepNumberActive: {
        color: '#fff',
    },
    progressLine: {
        position: 'absolute',
        width: '90%',
        height: 2,
        backgroundColor: '#e5e7eb',
        left: '50%',
        marginLeft: -20,
    },
    progressLineActive: {
        backgroundColor: '#667eea',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 16,
        marginTop: 16,
    },
    errorBanner: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#dc2626',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '500',
    },
    stepContent: {
        gap: 12,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280',
        fontSize: 14,
    },
    noGemsContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    noGemsIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    noGemsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a202c',
        marginBottom: 4,
    },
    noGemsText: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    selectGemButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        justifyContent: 'center',
    },
    selectGemPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectGemPlaceholderText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '500',
    },
    selectedGemDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectedGemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    selectedGemInfo: {
        flex: 1,
    },
    selectedGemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 4,
    },
    selectedGemMeta: {
        fontSize: 12,
        color: '#6b7280',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: 50,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a202c',
    },
    modalCloseBtn: {
        fontSize: 24,
        color: '#6b7280',
    },
    modalSearchField: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    modalSearchInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: '#1a202c',
    },
    gemGridContainer: {
        paddingHorizontal: 8,
    },
    gemGridRow: {
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        marginBottom: 8,
    },
    gemCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
    },
    gemCardSelected: {
        borderColor: '#667eea',
        borderWidth: 2,
        backgroundColor: '#f3f4f6',
    },
    gemImage: {
        width: '100%',
        height: 120,
        backgroundColor: '#f3f4f6',
    },
    gemContent: {
        padding: 8,
    },
    gemTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 2,
    },
    gemType: {
        fontSize: 10,
        color: '#6b7280',
    },
    gemDetails: {
        fontSize: 10,
        color: '#9ca3af',
        marginBottom: 4,
    },
    gemPrice: {
        fontSize: 12,
        fontWeight: '700',
        color: '#667eea',
    },
    selectedBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedBadgeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    formSection: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a202c',
    },
    selectedGemSummary: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#f0f4ff',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#667eea',
        borderRadius: 8,
        marginBottom: 12,
    },
    summaryGemImage: {
        width: 60,
        height: 60,
        borderRadius: 6,
    },
    summaryGemTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1a202c',
    },
    summaryGemMeta: {
        fontSize: 11,
        color: '#6b7280',
    },
    currencyInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        paddingHorizontal: 8,
        backgroundColor: '#fff',
    },
    currencySymbol: {
        fontSize: 14,
        fontWeight: '700',
        color: '#667eea',
        marginRight: 4,
    },
    priceInput: {
        flex: 1,
        paddingVertical: 8,
        fontSize: 14,
        color: '#1a202c',
    },
    inputHint: {
        fontSize: 11,
        color: '#9ca3af',
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    dateTimeGroup: {
        gap: 6,
        marginBottom: 12,
    },
    dateTimeButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    dateTimeButtonText: {
        fontSize: 13,
        color: '#1a202c',
    },
    durationInfo: {
        backgroundColor: '#dbeafe',
        borderLeftWidth: 3,
        borderLeftColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 6,
        marginTop: 12,
    },
    durationLabel: {
        fontSize: 11,
        color: '#1e40af',
        fontWeight: '600',
    },
    durationValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e40af',
        marginTop: 2,
    },
    reviewSection: {
        backgroundColor: '#f9fafb',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    reviewTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6b7280',
        textTransform: 'uppercase',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    reviewGem: {
        flexDirection: 'row',
        gap: 10,
    },
    reviewGemImage: {
        width: 70,
        height: 70,
        borderRadius: 6,
    },
    reviewGemTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: 2,
    },
    reviewGemMeta: {
        fontSize: 11,
        color: '#6b7280',
    },
    reviewItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    reviewLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    reviewValue: {
        fontSize: 12,
        color: '#1a202c',
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: '#fef3c7',
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 6,
        marginTop: 12,
    },
    infoBoxTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#b45309',
        marginBottom: 6,
    },
    infoBoxText: {
        fontSize: 11,
        color: '#b45309',
        lineHeight: 16,
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    btnPrimary: {
        flex: 1,
        backgroundColor: '#667eea',
        paddingVertical: 12,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnPrimaryText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    btnSecondary: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingVertical: 12,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnSecondaryText: {
        color: '#374151',
        fontWeight: '700',
        fontSize: 14,
    },
    btnSubmit: {
        flex: 1,
        backgroundColor: '#667eea',
        paddingVertical: 12,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnSubmitText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    btnDisabled: {
        opacity: 0.6,
    },
});

export default CreateAuctionScreen;