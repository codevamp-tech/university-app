import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, DeviceEventEmitter
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { createShopListingAPI, uploadAvatarAPI } from '../../data/apiService';

const AddProductScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('electronics');
  const [imageUri, setImageUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'electronics', label: 'Electronics' },
    { id: 'books', label: 'Books' },
    { id: 'gear', label: 'Gear & Equipment' },
    { id: 'other', label: 'Other' }
  ];

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission needed', 'You need to grant permission to access your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !price.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (!imageUri) {
      Alert.alert('Image Required', 'Please add a cover photo for your product.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = '';
      
      const uploadRes = await uploadAvatarAPI(accessToken, imageUri);
      if (uploadRes.ok && uploadRes.json?.success) {
        finalImageUrl = uploadRes.json.data.avatar_url;
      } else {
        Alert.alert('Image Upload Failed', 'Could not upload photo to Cloudinary. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const response = await createShopListingAPI(accessToken, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        image_url: finalImageUrl
      });
      if (!response) {
        throw new Error('Failed to create listing');
      }
      
      DeviceEventEmitter.emit('newProductAdded', {
        id: 'local_' + Date.now(),
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        image_url: finalImageUrl,
        seller: {
          username: 'You',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
          status: 'online'
        }
      });
      
      Alert.alert('Success!', 'Your product is now live on the Hub! Students can now see and purchase your item.', [
        { text: 'Awesome', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Sell an Item</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Image Picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <LinearGradient
              colors={isDark ? ['#1F2937', '#111827'] : ['#F3F4F6', '#E5E7EB']}
              style={styles.imagePlaceholder}
            >
              <MaterialIcons name="add-a-photo" size={32} color={colors.textMuted} />
              <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>Add Cover Photo</Text>
            </LinearGradient>
          )}
          {imageUri && (
            <View style={styles.changeImageBadge}>
              <MaterialIcons name="edit" size={14} color="#FFF" />
              <Text style={styles.changeImageText}>Change</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Product Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="e.g. Almost new Engineering Math textbook"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Price (₹) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="e.g. 500"
            placeholderTextColor={colors.textMuted}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { 
                    backgroundColor: category === cat.id ? colors.primary : colors.card,
                    borderColor: category === cat.id ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={[
                  styles.categoryText,
                  { color: category === cat.id ? '#FFF' : colors.textPrimary }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Description & Specifications *</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Describe the condition, features, or specs..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer Submit Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom || 20 }]}>
        <TouchableOpacity 
          style={[styles.submitBtn, { opacity: (!title || !price || !description || isSubmitting) ? 0.6 : 1 }]} 
          onPress={handleSubmit}
          disabled={!title || !price || !description || isSubmitting}
        >
          <LinearGradient
            colors={isDark ? ['#9A3412', '#78350F'] : ['#EA580C', '#C2410C']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.submitText}>List Product</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Nice Full Screen Loader */}
      <Modal visible={isSubmitting} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={[styles.loaderBox, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.textPrimary }]}>Listing Product...</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  changeImageBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeImageText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
  }
});

export default AddProductScreen;
