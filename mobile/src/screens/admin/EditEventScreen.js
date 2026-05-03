import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Switch,
    Platform,
} from 'react-native';
import eventAPI from '../../api/services/eventAPI';
import DateTimePicker from '@react-native-community/datetimepicker';

const EVENT_TYPES = [
    { label: 'Exhibition', value: 'exhibition' },
    { label: 'Discount Sale', value: 'discount_sale' },
    { label: 'Auction', value: 'auction' },
    { label: 'Conference', value: 'conference' },
    { label: 'Workshop', value: 'workshop' },
];

const EditEventScreen = ({ route, navigation }) => {
    const { eventId } = route.params;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('date');
    const [activeField, setActiveField] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'exhibition',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        location: '',
        address: '',
        capacity: '',
        contactEmail: '.com',
        contactPhone: '0771234567',
        hasDiscount: false,
        discount: '',
        discountDescription: '',
    });

    useEffect(() => {
        fetchEvent();
    }, []);

    const handleChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const formatInputDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toISOString().split('T')[0];
    };



    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const formatTime = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const openDatePicker = (field) => {
        setActiveField(field);
        setPickerMode('date');
        setShowPicker(true);
    };

    const openTimePicker = (field) => {
        setActiveField(field);
        setPickerMode('time');
        setShowPicker(true);
    };

    const onPickerChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }

        if (!selectedDate) return;

        if (pickerMode === 'date') {
            handleChange(activeField, formatDate(selectedDate));
        } else {
            handleChange(activeField, formatTime(selectedDate));
        }
    };

    const fetchEvent = async () => {

        try {
            const event = await eventAPI.getById(eventId);

            setFormData({
                title: event.title || '',
                description: event.description || '',
                type: event.type || 'exhibition',
                startDate: formatInputDate(event.startDate),
                endDate: formatInputDate(event.endDate),
                startTime: event.startTime || '',
                endTime: event.endTime || '',
                location: event.location?.city || event.location || '',
                address: event.location?.venue || event.address || '',
                capacity: String(event.maxAttendees || event.capacity || ''),
                contactEmail: event.contactEmail || 'trade01@gmail.com',
                contactPhone: event.contactPhone || '0771234567',
                hasDiscount: Number(event.discountPercentage || event.discount || 0) > 0,
                discount: String(event.discountPercentage || event.discount || ''),
                discountDescription: event.discountDescription || '',
            });
        } catch (error) {
            console.error('Fetch event error:', error);
            Alert.alert('Error', 'Failed to load event details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const title = formData.title.trim();
        const description = formData.description.trim();
        const capacity = Number(formData.capacity);

        if (!title || !description || !formData.startDate || !formData.endDate || !formData.location.trim()) {
            Alert.alert('Validation Error', 'Please fill all required fields.');
            return false;
        }

        if (title.length < 10) {
            Alert.alert('Validation Error', 'Event title must be at least 10 characters.');
            return false;
        }

        if (description.length < 50) {
            Alert.alert('Validation Error', 'Description must be at least 50 characters.');
            return false;
        }

        if (!formData.capacity || isNaN(capacity) || capacity < 50) {
            Alert.alert('Validation Error', 'Capacity must be minimum 50.');
            return false;
        }

        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (end < start) {
            Alert.alert('Validation Error', 'End date must be after or same as start date.');
            return false;
        }

        return true;
    };

    const handleUpdate = async () => {
        if (!validateForm()) return;

        setSaving(true);

        try {
            const form = new FormData();

            Object.keys(formData).forEach((key) => {
                form.append(key, formData[key]);
            });

            await eventAPI.update(eventId, form);

            Alert.alert('Success', 'Event updated successfully');
            navigation.goBack();
        } catch (error) {
            console.error('Update event error:', error);
            Alert.alert('Error', error?.response?.data?.message || 'Failed to update event');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Update Event</Text>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Event Details</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Event Title *"
                    value={formData.title}
                    onChangeText={(val) => handleChange('title', val)}
                />
                <Text
                    style={[
                        styles.helperText,
                        formData.title.length > 0 &&
                        formData.title.length < 10 &&
                        styles.errorHelperText,
                    ]}
                >
                    {formData.title.length}/10 characters minimum
                </Text>

                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description *"
                    value={formData.description}
                    onChangeText={(val) => handleChange('description', val)}
                    multiline
                />
                <Text
                    style={[
                        styles.helperText,
                        formData.description.length > 0 &&
                        formData.description.length < 50 &&
                        styles.errorHelperText,
                    ]}
                >
                    {formData.description.length}/50 characters minimum
                </Text>

                <Text style={styles.label}>Event Type</Text>
                <View style={styles.typeContainer}>
                    {EVENT_TYPES.map((item) => (
                        <TouchableOpacity
                            key={item.value}
                            style={[
                                styles.typeOption,
                                formData.type === item.value && styles.typeOptionActive,
                            ]}
                            onPress={() => handleChange('type', item.value)}
                        >
                            <Text
                                style={[
                                    styles.typeOptionText,
                                    formData.type === item.value && styles.typeOptionTextActive,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>


                    <TouchableOpacity
                        style={[styles.input, styles.half]}
                        onPress={() => openDatePicker('startDate')}
                    >
                        <Text style={formData.startDate ? styles.dateText : styles.placeholderText}>
                            {formData.startDate || 'Start Date *'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.input, styles.half]}
                        onPress={() => openDatePicker('endDate')}
                    >
                        <Text style={formData.endDate ? styles.dateText : styles.placeholderText}>
                            {formData.endDate || 'End Date *'}
                        </Text>
                    </TouchableOpacity>


                <TouchableOpacity
                    style={[styles.input, styles.half]}
                    onPress={() => openTimePicker('startTime')}
                >
                    <Text style={formData.startTime ? styles.dateText : styles.placeholderText}>
                        {formData.startTime || 'Start Time'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.input, styles.half]}
                    onPress={() => openTimePicker('endTime')}
                >
                    <Text style={formData.endTime ? styles.dateText : styles.placeholderText}>
                        {formData.endTime || 'End Time'}
                    </Text>
                </TouchableOpacity>
                {showPicker && (
                    <DateTimePicker
                        value={new Date()}
                        mode={pickerMode}
                        display="default"
                        minimumDate={pickerMode === 'date' ? today : undefined}
                        onChange={onPickerChange}
                    />
                )}


                <TextInput
                    style={styles.input}
                    placeholder="City/Location *"
                    value={formData.location}
                    onChangeText={(val) => handleChange('location', val)}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Full Venue Address"
                    value={formData.address}
                    onChangeText={(val) => handleChange('address', val)}
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Additional Information</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Capacity minimum 50 *"
                    keyboardType="numeric"
                    value={formData.capacity}
                    onChangeText={(val) => handleChange('capacity', val)}
                />

                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.half, styles.readOnlyInput]}
                        placeholder="Contact Email"
                        value={formData.contactEmail}
                        editable={false}
                    />

                    <TextInput
                        style={[styles.input, styles.half, styles.readOnlyInput]}
                        placeholder="Contact Phone"
                        value={formData.contactPhone}
                        editable={false}
                    />
                </View>

                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Enable Discount</Text>
                    <Switch
                        value={formData.hasDiscount}
                        onValueChange={(val) => handleChange('hasDiscount', val)}
                    />
                </View>

                {formData.hasDiscount && (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Discount Percentage"
                            keyboardType="numeric"
                            value={formData.discount}
                            onChangeText={(val) => handleChange('discount', val)}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Discount Description"
                            value={formData.discountDescription}
                            onChangeText={(val) => handleChange('discountDescription', val)}
                        />
                    </>
                )}
            </View>

            <TouchableOpacity
                style={[styles.submitBtn, saving && styles.disabledBtn]}
                onPress={handleUpdate}
                disabled={saving}
            >
                {saving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitBtnText}>Update Event</Text>
                )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    content: {
        padding: 15,
        paddingTop: 45,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backText: {
        color: '#667eea',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1f2937',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#374151',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 12,
        marginBottom: 10,
        backgroundColor: '#f9fafb',
        fontSize: 16,
    },
    readOnlyInput: {
        backgroundColor: '#e5e7eb',
        color: '#6b7280',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    helperText: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 12,
    },
    errorHelperText: {
        color: '#dc2626',
    },
    label: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '700',
        marginBottom: 8,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 15,
    },
    typeOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#f9fafb',
    },
    typeOptionActive: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    typeOptionText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 13,
    },
    typeOptionTextActive: {
        color: '#fff',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    half: {
        width: '48%',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    switchLabel: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    submitBtn: {
        backgroundColor: '#667eea',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    disabledBtn: {
        opacity: 0.6,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    dateText: {
        color: '#111827',
        fontSize: 16,
    },
    placeholderText: {
        color: '#9ca3af',
        fontSize: 16,
    },
});

export default EditEventScreen;