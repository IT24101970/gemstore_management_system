import React, { useState, useEffect } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import gemstoneAPI from '../../api/services/gemstoneAPI';

const EditListingScreen = ({ route, navigation }) => {
    const { gem } = route.params;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: gem.title || '',
        type: gem.type || '',
        description: gem.description || '',
        carat: gem.attributes?.carat?.toString() || '',
        shape: gem.attributes?.shape || '',
        cut: gem.attributes?.cut || '',
        colorIntensity: gem.attributes?.colorIntensity || '',
        clarity: gem.attributes?.clarity || '',
        origin: gem.attributes?.origin || '',
        price: gem.price?.toString() || '',
    });

    const [existingImages, setExistingImages] = useState(gem.images || []);
    const [newImages, setNewImages] = useState([]);
    const [existingReport, setExistingReport] = useState(gem.report || null);
    const [newReport, setNewReport] = useState(null);

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
                selectionLimit: 5 - existingImages.length,
                quality: 0.8,
            });

            if (!result.canceled) {
                setNewImages([...newImages, ...result.assets]);
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
                setNewReport(result.assets[0]);
                setExistingReport(null);
            }
        } catch (error) {
            console.error('Error picking report:', error);
            Alert.alert('Error', 'Failed to pick report');
        }
    };

    const removeExistingImage = (index) => {
        const updated = [...existingImages];
        updated.splice(index, 1);
        setExistingImages(updated);
    };

    const removeNewImage = (index) => {
        const updated = [...newImages];
        updated.splice(index, 1);
        setNewImages(updated);
    };

    const handleSubmit = async () => {
        const requiredFields = [
            { key: 'title', label: 'Title' },
            { key: 'type', label: 'Gem Type' },
            { key: 'description', label: 'Description' },
            { key: 'carat', label: 'Weight (Carats)' },
            { key: 'shape', label: 'Shape' },
            { key: 'cut', label: 'Cut' },
            { key: 'colorIntensity', label: 'Color Intensity' },
            { key: 'clarity', label: 'Clarity' },
            { key: 'origin', label: 'Origin' },
            { key: 'price', label: 'Price' },
        ];

        for (const field of requiredFields) {
            if (!formData[field.key] || formData[field.key].toString().trim() === '') {
                Alert.alert('Error', `Please fill in the ${field.label}. All fields are mandatory.`);
                return;
            }
        }

        if (existingImages.length === 0 && newImages.length === 0) {
            Alert.alert('Error', 'Please have at least one gemstone image.');
            return;
        }

        setLoading(true);
        try {
            const form = new FormData();
            form.append("title", formData.title);
            form.append("type", formData.type);
            form.append("description", formData.description);
            form.append("price", formData.price);

            const attributes = {
                carat: formData.carat,
                shape: formData.shape,
                cut: formData.cut,
                colorIntensity: formData.colorIntensity,
                clarity: formData.clarity,
                origin: formData.origin
            };
            form.append("attributes", JSON.stringify(attributes));

            // Tell backend which existing images to keep
            form.append("retainedImages", JSON.stringify(existingImages.map(img => img.url)));

            // Add new images
            for (let i = 0; i < newImages.length; i++) {
                const img = newImages[i];
                if (Platform.OS === 'web') {
                    const response = await fetch(img.uri);
                    const blob = await response.blob();
                    form.append("images", blob, img.fileName || `gem_new_${i}.jpg`);
                } else {
                    form.append("images", {
                        uri: img.uri,
                        name: img.fileName || `gem_new_${i}.jpg`,
                        type: img.mimeType || 'image/jpeg',
                    });
                }
            }

            // Report logic
            if (newReport) {
                form.append("retainReport", "false");
                if (Platform.OS === 'web') {
                    const response = await fetch(newReport.uri);
                    const blob = await response.blob();
                    form.append("report", blob, newReport.fileName || 'report.jpg');
                } else {
                    form.append("report", {
                        uri: newReport.uri,
                        name: newReport.fileName || 'report.jpg',
                        type: newReport.mimeType || 'image/jpeg',
                    });
                }
            } else {
                form.append("retainReport", "true");
            }

            await gemstoneAPI.update(gem._id, form);
            
            Alert.alert('Success', 'Listing updated successfully and sent for admin approval.');
            navigation.pop(2); // Go back to listings dashboard
        } catch (error) {
            console.error('Update listing error:', error);
            Alert.alert('Error', 'Failed to update listing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text style={styles.title}>Edit Listing</Text>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Gemstone Details</Text>
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Title *"
                        value={formData.title}
                        onChangeText={(val) => handleChange('title', val)}
                        autoCapitalize="words"
                    />
                    
                    <View style={[styles.input, { padding: 0, justifyContent: 'center' }]}>
                        <Picker
                            selectedValue={formData.type}
                            onValueChange={(itemValue) => handleChange('type', itemValue)}
                            style={{ width: '100%' }}
                        >
                            <Picker.Item label="Gem Type *" value="" color="#a0aec0" />
                            <Picker.Item label="Sapphire" value="Sapphire" />
                            <Picker.Item label="Ruby" value="Ruby" />
                            <Picker.Item label="Emerald" value="Emerald" />
                            <Picker.Item label="Diamond" value="Diamond" />
                            <Picker.Item label="Padparadscha" value="Padparadscha" />
                            <Picker.Item label="Alexandrite" value="Alexandrite" />
                            <Picker.Item label="Other" value="Other" />
                        </Picker>
                    </View>

                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Description *"
                        value={formData.description}
                        onChangeText={(val) => handleChange('description', val)}
                        multiline
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
                            placeholder="Shape *"
                            value={formData.shape}
                            onChangeText={(val) => handleChange('shape', val)}
                        />
                    </View>

                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, styles.half]}
                            placeholder="Cut *"
                            value={formData.cut}
                            onChangeText={(val) => handleChange('cut', val)}
                        />
                        <View style={[styles.input, styles.half, { padding: 0, justifyContent: 'center' }]}>
                            <Picker
                                selectedValue={formData.colorIntensity}
                                onValueChange={(itemValue) => handleChange('colorIntensity', itemValue)}
                                style={{ width: '100%', marginLeft: -8 }}
                            >
                                <Picker.Item label="Color Intensity *" value="" color="#a0aec0" />
                                <Picker.Item label="Faint" value="Faint" />
                                <Picker.Item label="Light" value="Light" />
                                <Picker.Item label="Fancy" value="Fancy" />
                                <Picker.Item label="Intense" value="Intense" />
                                <Picker.Item label="Vivid" value="Vivid" />
                                <Picker.Item label="Deep" value="Deep" />
                                <Picker.Item label="Dark" value="Dark" />
                                <Picker.Item label="None" value="None" />
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, styles.half]}
                            placeholder="Clarity *"
                            value={formData.clarity}
                            onChangeText={(val) => handleChange('clarity', val)}
                        />
                        <TextInput
                            style={[styles.input, styles.half]}
                            placeholder="Origin *"
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
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Certificate Report</Text>
                    {existingReport && (
                        <View style={styles.imagePreviewContainer}>
                            <View style={styles.previewWrapper}>
                                <Image source={{ uri: existingReport }} style={styles.previewImage} />
                                <Text style={styles.badgeLabel}>Current</Text>
                            </View>
                        </View>
                    )}
                    <TouchableOpacity style={styles.uploadBtn} onPress={handleReportPick}>
                        <Text style={styles.uploadBtnText}>
                            {newReport ? '✓ New Certificate Selected' : '+ Change Certificate'}
                        </Text>
                    </TouchableOpacity>
                    {newReport && (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: newReport.uri }} style={styles.previewImage} />
                            <Text style={styles.filename}>{newReport.fileName || 'new_report.jpg'}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Gemstone Media</Text>
                    <View style={styles.imagePreviewContainer}>
                        {existingImages.map((img, index) => (
                            <View key={`existing-${index}`} style={styles.previewWrapper}>
                                <Image source={{ uri: img.url }} style={styles.previewImage} />
                                <TouchableOpacity 
                                    style={styles.removeBtn} 
                                    onPress={() => removeExistingImage(index)}
                                >
                                    <Text style={styles.removeBtnText}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                        {newImages.map((img, index) => (
                            <View key={`new-${index}`} style={styles.previewWrapper}>
                                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                                <TouchableOpacity 
                                    style={styles.removeBtn} 
                                    onPress={() => removeNewImage(index)}
                                >
                                    <Text style={styles.removeBtnText}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                    {existingImages.length + newImages.length < 5 && (
                        <TouchableOpacity style={[styles.uploadBtn, {marginTop: 10}]} onPress={handleImagePick}>
                            <Text style={styles.uploadBtnText}>+ Add New Images</Text>
                        </TouchableOpacity>
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
                        <Text style={styles.submitBtnText}>Update Listing</Text>
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
        marginBottom: 10,
    },
    previewWrapper: {
        position: 'relative',
    },
    previewImage: {
        width: 70,
        height: 70,
        borderRadius: 6,
    },
    removeBtn: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#ef4444',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    badgeLabel: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: '#fff',
        fontSize: 10,
        textAlign: 'center',
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 6,
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

export default EditListingScreen;
