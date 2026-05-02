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
    SafeAreaView,
    Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import gemstoneAPI from '../../api/services/gemstoneAPI';

const CreateListingScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'Sapphire',
        description: '',
        carat: '',
        shape: '',
        cut: '',
        colorIntensity: 'Vivid',
        clarity: '',
        origin: '',
        price: '',
    });
    const [images, setImages] = useState([]);
    const [report, setReport] = useState(null);

    const handleChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleImagePick = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                selectionLimit: 5,
                quality: 0.8,
            });

            if (!result.canceled) {
                setImages(result.assets);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleReportPick = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                setReport(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking report:', error);
            Alert.alert('Error', 'Failed to pick report');
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.price || !formData.carat) {
            Alert.alert('Error', 'Please fill in required fields (Title, Price, Carat).');
            return;
        }

        if (images.length === 0) {
            Alert.alert('Error', 'Please select at least one gemstone image.');
            return;
        }

        if (!report) {
            Alert.alert('Error', 'A laboratory certificate (report) is required.');
            return;
        }

        setLoading(true);
        try {
            // Mocking FormData as required by backend
            const form = new FormData();
            form.append("title", formData.title);
            form.append("type", formData.type);
            form.append("description", formData.description);
            form.append("price", formData.price);
            form.append("sellingMethod", "instantPurchase");

            const attributes = {
                carat: formData.carat,
                shape: formData.shape,
                cut: formData.cut,
                colorIntensity: formData.colorIntensity,
                clarity: formData.clarity,
                origin: formData.origin
            };
            form.append("attributes", JSON.stringify(attributes));

            // Add images
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                if (Platform.OS === 'web') {
                    const response = await fetch(img.uri);
                    const blob = await response.blob();
                    form.append("images", blob, img.fileName || `gem_${i}.jpg`);
                } else {
                    form.append("images", {
                        uri: img.uri,
                        name: img.fileName || `gem_${i}.jpg`,
                        type: img.mimeType || 'image/jpeg',
                    });
                }
            }

            // Add report
            if (Platform.OS === 'web') {
                const response = await fetch(report.uri);
                const blob = await response.blob();
                form.append("report", blob, report.fileName || 'report.jpg');
            } else {
                form.append("report", {
                    uri: report.uri,
                    name: report.fileName || 'report.jpg',
                    type: report.mimeType || 'image/jpeg',
                });
            }

            await gemstoneAPI.create(form);
            
            Alert.alert('Success', 'Listing created successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Create listing error:', error);
            Alert.alert('Error', 'Failed to create listing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Create New Listing</Text>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Gemstone Details</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Title *"
                    value={formData.title}
                    onChangeText={(val) => handleChange('title', val)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    spellCheck={false}
                    testID="gemTitleInput"
                    accessibilityLabel="gemTitleInput"
                />
                
                <Text style={styles.label}>Gem Type</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Sapphire, Ruby"
                    value={formData.type}
                    onChangeText={(val) => handleChange('type', val)}
                />

                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description"
                    value={formData.description}
                    onChangeText={(val) => handleChange('description', val)}
                    multiline
                    autoCorrect={false}
                    spellCheck={false}
                />

                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="Weight (Carats) *"
                        keyboardType="numeric"
                        value={formData.carat}
                        onChangeText={(val) => handleChange('carat', val)}
                    />
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="Shape"
                        value={formData.shape}
                        onChangeText={(val) => handleChange('shape', val)}
                    />
                </View>

                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="Cut"
                        value={formData.cut}
                        onChangeText={(val) => handleChange('cut', val)}
                    />
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="Color Intensity"
                        value={formData.colorIntensity}
                        onChangeText={(val) => handleChange('colorIntensity', val)}
                    />
                </View>

                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="Clarity"
                        value={formData.clarity}
                        onChangeText={(val) => handleChange('clarity', val)}
                    />
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="Origin"
                        value={formData.origin}
                        onChangeText={(val) => handleChange('origin', val)}
                    />
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Price</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Price (USD) *"
                    keyboardType="numeric"
                    value={formData.price}
                    onChangeText={(val) => handleChange('price', val)}
                    testID="gemPriceInput"
                    accessibilityLabel="gemPriceInput"
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Certificate Report *</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={handleReportPick}>
                    <Text style={styles.uploadBtnText}>
                        {report ? '✓ Certificate Selected' : '+ Upload Lab Report'}
                    </Text>
                </TouchableOpacity>
                {report && (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: report.uri }} style={styles.previewImage} />
                        <Text style={styles.filename}>{report.fileName || 'certificate.jpg'}</Text>
                    </View>
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Gemstone Media *</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={handleImagePick}>
                    <Text style={styles.uploadBtnText}>+ Select Images (Max 5)</Text>
                </TouchableOpacity>
                {images.length > 0 && (
                    <View style={styles.imagePreviewContainer}>
                        {images.map((img, index) => (
                            <Image key={index} source={{ uri: img.uri }} style={styles.previewImage} />
                        ))}
                    </View>
                )}
            </View>

            <TouchableOpacity 
                style={[styles.submitBtn, loading && styles.disabledBtn]}
                onPress={handleSubmit}
                disabled={loading}
                testID="submitListingButton"
                accessibilityLabel="submitListingButton"
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitBtnText}>Submit Listing</Text>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    content: {
        padding: 15,
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
    label: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 5,
        fontWeight: '600',
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
    imagePreviewContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    previewImage: {
        width: 70,
        height: 70,
        borderRadius: 6,
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
    filename: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 5,
    },
});

export default CreateListingScreen;
