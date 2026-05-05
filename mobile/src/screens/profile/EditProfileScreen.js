import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import authAPI from '../../api/services/authAPI';

const EditProfileScreen = ({ navigation }) => {
    const { user, updateUser } = useAuth();

    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [shippingAddress, setShippingAddress] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await authAPI.getProfile();
            if (res.success) {
                setName(res.data.name || '');
                setPhoneNumber(res.data.phoneNumber || '');
                setShippingAddress(res.data.shippingAddress || {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: ''
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load profile details.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        try {
            setLoading(true);
            const res = await authAPI.updateProfile({
                name,
                phoneNumber,
                shippingAddress
            });
            if (res.success) {
                if (res.data) {
                    updateUser(res.data);
                }
                setSuccessMessage('Profile updated successfully');
                setTimeout(() => {
                    navigation.goBack();
                }, 2000);
            } else {
                Alert.alert('Error', res.message || 'Failed to update profile');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formContainer}>
                {successMessage ? (
                    <View style={styles.successBanner}>
                        <Text style={styles.successText}>{successMessage}</Text>
                    </View>
                ) : null}

                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                />

                <Text style={styles.sectionTitle}>Shipping Address</Text>
                
                <Text style={styles.label}>Street</Text>
                <TextInput
                    style={styles.input}
                    value={shippingAddress.street}
                    onChangeText={(text) => setShippingAddress({...shippingAddress, street: text})}
                    placeholder="Street Address"
                />

                <Text style={styles.label}>City</Text>
                <TextInput
                    style={styles.input}
                    value={shippingAddress.city}
                    onChangeText={(text) => setShippingAddress({...shippingAddress, city: text})}
                    placeholder="City"
                />

                <Text style={styles.label}>State/Province</Text>
                <TextInput
                    style={styles.input}
                    value={shippingAddress.state}
                    onChangeText={(text) => setShippingAddress({...shippingAddress, state: text})}
                    placeholder="State/Province"
                />

                <Text style={styles.label}>Zip Code</Text>
                <TextInput
                    style={styles.input}
                    value={shippingAddress.zipCode}
                    onChangeText={(text) => setShippingAddress({...shippingAddress, zipCode: text})}
                    placeholder="Zip/Postal Code"
                />

                <Text style={styles.label}>Country</Text>
                <TextInput
                    style={styles.input}
                    value={shippingAddress.country}
                    onChangeText={(text) => setShippingAddress({...shippingAddress, country: text})}
                    placeholder="Country"
                />

                <TouchableOpacity 
                    style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    formContainer: {
        padding: 20,
        backgroundColor: '#fff',
        margin: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    successBanner: {
        backgroundColor: '#d1fae5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#10b981',
    },
    successText: {
        color: '#065f46',
        fontSize: 14,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 20,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 5,
    },
    label: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
        color: '#1f2937',
    },
    saveBtn: {
        backgroundColor: '#667eea',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    saveBtnDisabled: {
        backgroundColor: '#9ca3af',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default EditProfileScreen;
