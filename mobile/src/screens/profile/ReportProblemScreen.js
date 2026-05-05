import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import reportAPI from '../../api/services/reportAPI';

const ReportProblemScreen = ({ navigation }) => {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async () => {
        if (!subject.trim() || !description.trim()) {
            Alert.alert('Error', 'Please provide both a subject and a description');
            return;
        }

        try {
            setLoading(true);
            const res = await reportAPI.submitReport({
                subject,
                description,
                category: 'bug' // Default to bug or general issue for app reporting
            });
            
            if (res.success) {
                setSuccessMessage('Your report has been submitted successfully. Our team will review it shortly.');
                setTimeout(() => {
                    navigation.goBack();
                }, 2000);
            } else {
                Alert.alert('Error', res.message || 'Failed to submit report');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to submit report. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formContainer}>
                    {successMessage ? (
                        <View style={styles.successBanner}>
                            <Text style={styles.successText}>{successMessage}</Text>
                        </View>
                    ) : null}

                    <Text style={styles.headerTitle}>Report a Problem</Text>
                    <Text style={styles.subtext}>
                        Describe the issue you're experiencing in detail. This helps our team understand and resolve it quickly.
                    </Text>

                    <Text style={styles.label}>Subject</Text>
                    <TextInput
                        style={styles.input}
                        value={subject}
                        onChangeText={setSubject}
                        placeholder="E.g., App crashes when placing a bid"
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Please provide details about the problem..."
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity 
                        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Submit Report</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollContainer: {
        flexGrow: 1,
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
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    subtext: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
        lineHeight: 20,
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
        marginBottom: 20,
        fontSize: 16,
        color: '#1f2937',
    },
    textArea: {
        height: 120,
        justifyContent: 'flex-start',
    },
    submitBtn: {
        backgroundColor: '#667eea',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    submitBtnDisabled: {
        backgroundColor: '#9ca3af',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ReportProblemScreen;
