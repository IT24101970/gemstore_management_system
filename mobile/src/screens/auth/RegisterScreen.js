import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    Switch,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
    const { signUp } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        shippingAddress: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Sri Lanka',
        },
        becomeSeller: false,
        businessName: '',
        businessRegistration: '',
        verificationDocuments: [],
    });

    const handleChange = (name, value) => {
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value,
                },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const validateStep1 = () => {
        if (!formData.name || !formData.email || !formData.password) {
            Alert.alert('Error', 'Please fill in all required fields');
            return false;
        }
        if (formData.password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return false;
        }
        if (!formData.phoneNumber) {
            Alert.alert('Error', 'Phone number is required');
            return false;
        }
        if (!formData.shippingAddress.street || !formData.shippingAddress.city) {
            Alert.alert('Error', 'Please provide your shipping address');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (formData.verificationDocuments.length === 0) {
            Alert.alert('Error', 'Please upload at least one verification document');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep1()) return;

        if (formData.becomeSeller) {
            setStep(2);
        } else {
            handleRegister();
        }
    };

    const handleMockUpload = () => {
        const mockDoc = {
            type: 'businessRegistration',
            url: `https://placeholder.com/docs/mock_doc.pdf`,
            uploadedAt: new Date(),
        };
        setFormData((prev) => ({
            ...prev,
            verificationDocuments: [...prev.verificationDocuments, mockDoc],
        }));
        Alert.alert('Success', 'Mock document uploaded successfully.');
    };

    const handleRegister = async () => {
        if (step === 2 && !validateStep2()) return;

        setLoading(true);
        try {
            await signUp(formData);
            Alert.alert('Success', 'Registration successful!');
            // After successful registration, context will update userToken and navigate to Home automatically.
        } catch (error) {
            Alert.alert('Registration Failed', error?.message || 'Unable to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>Ceylon Gems</Text>

            {step === 1 ? (
                <>
                    <Text style={styles.subtitle}>Create Account</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Full Name *"
                        value={formData.name}
                        onChangeText={(val) => handleChange('name', val)}
                        editable={!loading}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email Address *"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(val) => handleChange('email', val)}
                        editable={!loading}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Phone Number *"
                        keyboardType="phone-pad"
                        value={formData.phoneNumber}
                        onChangeText={(val) => handleChange('phoneNumber', val)}
                        editable={!loading}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password *"
                        secureTextEntry
                        value={formData.password}
                        onChangeText={(val) => handleChange('password', val)}
                        editable={!loading}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password *"
                        secureTextEntry
                        value={formData.confirmPassword}
                        onChangeText={(val) => handleChange('confirmPassword', val)}
                        editable={!loading}
                    />

                    <Text style={styles.sectionTitle}>Shipping Address *</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Street Address"
                        value={formData.shippingAddress.street}
                        onChangeText={(val) => handleChange('shippingAddress.street', val)}
                        editable={!loading}
                    />

                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, styles.halfInput]}
                            placeholder="City"
                            value={formData.shippingAddress.city}
                            onChangeText={(val) => handleChange('shippingAddress.city', val)}
                            editable={!loading}
                        />
                        <TextInput
                            style={[styles.input, styles.halfInput]}
                            placeholder="State/Province"
                            value={formData.shippingAddress.state}
                            onChangeText={(val) => handleChange('shippingAddress.state', val)}
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, styles.halfInput]}
                            placeholder="Postal Code"
                            value={formData.shippingAddress.postalCode}
                            onChangeText={(val) => handleChange('shippingAddress.postalCode', val)}
                            editable={!loading}
                        />
                        <TextInput
                            style={[styles.input, styles.halfInput]}
                            placeholder="Country"
                            value={formData.shippingAddress.country}
                            onChangeText={(val) => handleChange('shippingAddress.country', val)}
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>I want to sell gemstones (requires verification)</Text>
                        <Switch
                            value={formData.becomeSeller}
                            onValueChange={(val) => handleChange('becomeSeller', val)}
                            disabled={loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleNext}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {formData.becomeSeller ? 'Continue to Seller Info' : 'Create Account'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text style={styles.subtitle}>Seller Information</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Business Name (Optional)"
                        value={formData.businessName}
                        onChangeText={(val) => handleChange('businessName', val)}
                        editable={!loading}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Business Registration Number (Optional)"
                        value={formData.businessRegistration}
                        onChangeText={(val) => handleChange('businessRegistration', val)}
                        editable={!loading}
                    />

                    <Text style={styles.sectionTitle}>Verification Documents *</Text>
                    
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={handleMockUpload}
                        disabled={loading}
                    >
                        <Text style={styles.uploadButtonText}>Upload Document (Mock)</Text>
                    </TouchableOpacity>

                    {formData.verificationDocuments.length > 0 && (
                        <Text style={styles.docInfo}>
                            {formData.verificationDocuments.length} document(s) uploaded.
                        </Text>
                    )}

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.backButton, loading && styles.buttonDisabled]}
                            onPress={() => setStep(1)}
                            disabled={loading}
                        >
                            <Text style={[styles.buttonText, styles.backButtonText]}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Submit</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
                    <Text style={styles.loginText}>Sign In</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#667eea',
    },
    subtitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 20,
        color: '#374151',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 10,
        color: '#4b5563',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#f9fafb',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 15,
        padding: 10,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
    },
    switchLabel: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        marginRight: 10,
    },
    button: {
        backgroundColor: '#667eea',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    backButton: {
        backgroundColor: '#f3f4f6',
        width: '30%',
    },
    backButtonText: {
        color: '#374151',
    },
    submitButton: {
        width: '65%',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    uploadButton: {
        borderWidth: 1,
        borderColor: '#667eea',
        borderStyle: 'dashed',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    uploadButtonText: {
        color: '#667eea',
        fontWeight: 'bold',
    },
    docInfo: {
        color: '#10b981',
        marginBottom: 15,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: '#6b7280',
        fontSize: 14,
    },
    loginText: {
        color: '#667eea',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default RegisterScreen;