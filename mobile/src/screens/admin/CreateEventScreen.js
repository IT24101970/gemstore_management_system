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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import eventAPI from '../../api/services/eventAPI';

const CreateEventScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'Exhibition',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        location: '',
        address: '',
        capacity: '',
        contactEmail: '',
        contactPhone: '',
        hasDiscount: false,
        discount: '',
        discountDescription: '',
    });
    const [image, setImage] = useState(null);

    const handleChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
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

    const handleSubmit = async () => {
        if (!formData.title || !formData.description || !formData.startDate || !formData.endDate || !formData.location) {
            Alert.alert('Error', 'Please fill in required fields (Title, Description, Start/End Dates, Location).');
            return;
        }

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
            Alert.alert('Error', 'Failed to create event');
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
                
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description *"
                    value={formData.description}
                    onChangeText={(val) => handleChange('description', val)}
                    multiline
                />

                <TextInput
                    style={styles.input}
                    placeholder="Event Type (e.g., Exhibition, Auction) *"
                    value={formData.type}
                    onChangeText={(val) => handleChange('type', val)}
                />

                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="Start Date (YYYY-MM-DD) *"
                        value={formData.startDate}
                        onChangeText={(val) => handleChange('startDate', val)}
                    />
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="End Date (YYYY-MM-DD) *"
                        value={formData.endDate}
                        onChangeText={(val) => handleChange('endDate', val)}
                    />
                </View>

                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="Start Time (e.g., 10:00 AM)"
                        value={formData.startTime}
                        onChangeText={(val) => handleChange('startTime', val)}
                    />
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="End Time (e.g., 6:00 PM)"
                        value={formData.endTime}
                        onChangeText={(val) => handleChange('endTime', val)}
                    />
                </View>

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
                    placeholder="Capacity (Max Attendees)"
                    keyboardType="numeric"
                    value={formData.capacity}
                    onChangeText={(val) => handleChange('capacity', val)}
                />
                
                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="Contact Email"
                        keyboardType="email-address"
                        value={formData.contactEmail}
                        onChangeText={(val) => handleChange('contactEmail', val)}
                    />
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="Contact Phone"
                        keyboardType="phone-pad"
                        value={formData.contactPhone}
                        onChangeText={(val) => handleChange('contactPhone', val)}
                    />
                </View>

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
                            placeholder="Discount Percentage (e.g., 10)"
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
                {image && (
                    <Image source={{ uri: image.uri }} style={styles.previewImage} />
                )}
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
            
            <View style={{height: 40}} />
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
        marginBottom: 15,
        backgroundColor: '#f9fafb',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
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
