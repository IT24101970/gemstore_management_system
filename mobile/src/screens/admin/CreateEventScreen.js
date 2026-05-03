import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
    Switch,
    Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import eventAPI from '../../api/services/eventAPI';

const EVENT_TYPES = [
    { label: 'Exhibition', value: 'exhibition' },
    { label: 'Discount Sale', value: 'discount_sale' },
    { label: 'Auction', value: 'auction' },
    { label: 'Conference', value: 'conference' },
    { label: 'Workshop', value: 'workshop' },
];

const CreateEventScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);

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
        contactEmail: 'ceylongem@market.com',
        contactPhone: '0771234567',
        hasDiscount: false,
        discount: '',
        discountDescription: '',
    });

    const handleChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
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

    const handleImagePick = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera roll permissions are required.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                setImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
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

        if (!formData.type) {
            Alert.alert('Validation Error', 'Please select an event type.');
            return false;
        }

        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (start < today) {
            Alert.alert('Validation Error', 'Past dates are not allowed.');
            return false;
        }

        if (end < start) {
            Alert.alert('Validation Error', 'End date must be after or same as start date.');
            return false;
        }

        if (!formData.capacity || isNaN(capacity) || capacity < 50) {
            Alert.alert('Validation Error', 'Capacity must be minimum 50.');
            return false;
        }

        if (formData.hasDiscount) {
            const discount = Number(formData.discount);

            if (!formData.discount || isNaN(discount) || discount <= 0 || discount > 100) {
                Alert.alert('Validation Error', 'Discount must be between 1 and 100.');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            const form = new FormData();

            Object.keys(formData).forEach((key) => {
                form.append(key, formData[key]);
            });

            if (image) {
                form.append('image', {
                    uri: image.uri,
                    name: image.fileName || 'event.jpg',
                    type: image.mimeType || 'image/jpeg',
                });
            }

            await eventAPI.create(form);
            Alert.alert('Success', 'Event created successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Create event error:', error);
            Alert.alert('Error', error?.response?.data?.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Create New Event</Text>

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

                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={formData.type}
                        onValueChange={(val) => handleChange('type', val)}
                    >
                        {EVENT_TYPES.map((item) => (
                            <Picker.Item key={item.value} label={item.label} value={item.value} />
                        ))}
                    </Picker>
                </View>

                <View style={styles.row}>
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
                </View>

                <View style={styles.row}>
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
                </View>

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
                        keyboardType="email-address"
                        value={formData.contactEmail}
                        editable={false}
                    />

                    <TextInput
                        style={[styles.input, styles.half, styles.readOnlyInput]}
                        placeholder="Contact Phone"
                        keyboardType="phone-pad"
                        value={formData.contactPhone}
                        editable={false}
                    />
                </View>

                <Text style={styles.helperText}>Contact email and phone are read-only.</Text>

                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Enable Discount for Attendees</Text>
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

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Event Image</Text>

                <TouchableOpacity style={styles.uploadBtn} onPress={handleImagePick}>
                    <Text style={styles.uploadBtnText}>
                        {image ? 'Change Image' : '+ Select Event Banner'}
                    </Text>
                </TouchableOpacity>

                {image && <Image source={{ uri: image.uri }} style={styles.previewImage} />}
            </View>

            <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabledBtn]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitBtnText}>Create Event</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => navigation.goBack()}
                disabled={loading}
            >
                <Text style={styles.cancelBtnText}>Cancel</Text>
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
        paddingTop: 50,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
        justifyContent: 'center',
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
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        marginBottom: 15,
        backgroundColor: '#f9fafb',
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    half: {
        width: '48%',
    },
    dateText: {
        color: '#111827',
        fontSize: 16,
    },
    placeholderText: {
        color: '#9ca3af',
        fontSize: 16,
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
    uploadBtn: {
        borderWidth: 1,
        borderColor: '#667eea',
        borderStyle: 'dashed',
        padding: 15,
        borderRadius: 6,
        alignItems: 'center',
        marginBottom: 10,
    },
    uploadBtnText: {
        color: '#667eea',
        fontWeight: 'bold',
    },
    previewImage: {
        width: '100%',
        height: 150,
        borderRadius: 6,
        resizeMode: 'cover',
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
    cancelBtn: {
        backgroundColor: '#e5e7eb',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#4b5563',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CreateEventScreen;