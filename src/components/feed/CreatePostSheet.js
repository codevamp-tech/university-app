import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadAvatarAPI, uploadDocumentAPI, createPost } from '../../data/apiService';

const POST_CHAR_LIMIT = 3000;
const MAX_DOC_SIZE_MB = 100;
const MAX_DOC_SIZE_BYTES = MAX_DOC_SIZE_MB * 1024 * 1024;

const QUICK_ICONS = [
  '💡', '⚡', '🔬', '🧠', '⚙️', '📊', '🔍', '🎯', '🚀', '✨', '•', '** **', '` `'
];

const ICON_CATEGORIES = [
  {
    id: 'academic',
    name: 'Academic & Tech',
    icons: ['💡', '🔬', '🧠', '⚙️', '💻', '📐', '🧬', '🔭', '🧪', '🔋', '🤖', '⚡', '💻', '🛰️', '📡', '💾'],
  },
  {
    id: 'structure',
    name: 'Structure & Highlights',
    icons: ['•', '📌', '🔍', '🎯', '🚀', '✨', '🔑', '📝', '⚠️', '✅', '📍', '💎', '🏷️', '📢', '🌟', '👉'],
  },
  {
    id: 'business',
    name: 'Career & Business',
    icons: ['📊', '📈', '🏢', '💼', '🏆', '🎓', '📚', '💰', '🤝', '🔥', '🌐', '🧩', '🥇', '📈', '📋', '🎯'],
  },
  {
    id: 'syntax',
    name: 'Formulas & Math',
    icons: ['` `', '** **', '---', '∑', '√', 'π', '≈', '≠', '≤', '≥', '→', '∆', '∞', '±', 'θ', 'λ'],
  },
];

export function CreatePostSheet({
  visible,
  onClose,
  accessToken,
  currentUser,
  colors,
  isDark,
  onPostSuccess,
  initialSlideDeck = false,
}) {
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [isSlideDeckMode, setIsSlideDeckMode] = useState(initialSlideDeck);
  const [selectedTheme, setSelectedTheme] = useState('indigo');
  const [showIconDrawer, setShowIconDrawer] = useState(false);
  const [selectedIconCategory, setSelectedIconCategory] = useState('academic');
  const [posting, setPosting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  React.useEffect(() => {
    if (visible && initialSlideDeck) {
      setIsSlideDeckMode(true);
    }
  }, [visible, initialSlideDeck]);

  const THEME_OPTIONS = [
    { id: 'indigo', label: 'Systems', color: '#4F46E5', grad: ['#1E1B4B', '#312E81'] },
    { id: 'violet', label: 'AI/ML', color: '#9333EA', grad: ['#2E1065', '#581C87'] },
    { id: 'crimson', label: 'Engineering', color: '#E11D48', grad: ['#4C0519', '#881337'] },
    { id: 'emerald', label: 'Business', color: '#059669', grad: ['#022C22', '#064E3B'] },
    { id: 'amber', label: 'Startups', color: '#D97706', grad: ['#451A03', '#78350F'] },
    { id: 'slate', label: 'Research', color: '#475569', grad: ['#0F172A', '#1E293B'] },
  ];

  if (!visible) return null;

  const handlePickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.5,
      });
      if (!result.canceled && result.assets) {
        setSelectedDocs([]); // LinkedIn model: photos or document
        setSelectedImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 9));
      }
    } catch (err) {
      console.warn('Image pick error:', err);
    }
  };

  const handlePickDocs = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'public.item',
          '*/*',
        ],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.size && asset.size > MAX_DOC_SIZE_BYTES) {
          Alert.alert(
            'File too large',
            `Documents must be under ${MAX_DOC_SIZE_MB} MB. This matches LinkedIn's document upload policy.`,
          );
          return;
        }
        const cleanName = (asset.name || 'document.pdf').replace(/\.pdf\.pdf$/i, '.pdf');
        setSelectedImages([]); // LinkedIn model: photos or document
        setSelectedDocs([{
          name: cleanName,
          uri: asset.uri,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'application/pdf',
        }]);
      }
    } catch (err) {
      console.warn('Document pick error:', err);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setContent('');
    setSelectedImages([]);
    setSelectedDocs([]);
    setIsSlideDeckMode(false);
    setShowIconDrawer(false);
    onClose();
  };

  const handleInsertSlideBreak = () => {
    setContent(prev => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return '💡 Title / Hook\nOverview of concept...\n\n---\n\n🔍 Deep Dive Part 2\nDetails...';
      }
      return `${prev}\n\n---\n\n`;
    });
  };

  const handleInsertIcon = (icon) => {
    if (icon === '** **') {
      setContent(prev => (prev ? `${prev} **bold text**` : '**bold text**'));
    } else if (icon === '` `') {
      setContent(prev => (prev ? `${prev} \`formula\`` : '`formula`'));
    } else if (icon === '---') {
      setContent(prev => (prev ? `${prev}\n\n---\n\n` : '---\n\n'));
    } else {
      setContent(prev => (prev ? `${prev} ${icon} ` : `${icon} `));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0 && selectedDocs.length === 0) return;
    if (content.length > POST_CHAR_LIMIT) {
      Alert.alert('Too long', `Posts can be at most ${POST_CHAR_LIMIT} characters.`);
      return;
    }

    setPosting(true);
    try {
      // 1. Resolve access token
      let tokenToUse = accessToken;
      if (!tokenToUse) {
        try {
          tokenToUse = (await AsyncStorage.getItem('access_token')) ||
                       (await AsyncStorage.getItem('jwt_token')) ||
                       (await AsyncStorage.getItem('token')) ||
                       (await AsyncStorage.getItem('@access_token'));
        } catch (_) {}
      }

      // 2. Upload images
      let mediaUrls = [];
      if (selectedImages.length > 0 && tokenToUse) {
        setUploadingImages(true);
        for (const uri of selectedImages) {
          try {
            const up = await uploadAvatarAPI(tokenToUse, uri);
            if (up.ok && up.json?.success) {
              mediaUrls.push(up.json.data.file_url || up.json.data.avatar_url || uri);
            } else {
              mediaUrls.push(uri);
            }
          } catch {
            mediaUrls.push(uri);
          }
        }
        setUploadingImages(false);
      } else if (selectedImages.length > 0) {
        mediaUrls = [...selectedImages];
      }

      // 3. Upload documents (PDF / DOC / PPT)
      let docUrls = [];
      if (selectedDocs.length > 0 && tokenToUse) {
        setUploadingDocs(true);
        for (const doc of selectedDocs) {
          try {
            const up = await uploadDocumentAPI(tokenToUse, doc.uri, doc.name);
            const data = up.json?.data || {};
            const url = data.document_url || data.file_url || data.url || doc.uri;
            const pageCount = data.page_count || 1;
            const pageUrls = data.page_urls || [];
            const cleanName = (doc.name || 'Document.pdf').replace(/\.pdf\.pdf$/i, '.pdf');
            docUrls.push({
              url: url.replace(/\.pdf\.pdf$/i, '.pdf'),
              name: cleanName,
              size: doc.size,
              mimeType: doc.mimeType || 'application/pdf',
              pageCount,
              pageUrls,
            });
          } catch {
            docUrls.push({
              url: doc.uri,
              name: (doc.name || 'Document.pdf').replace(/\.pdf\.pdf$/i, '.pdf'),
              size: doc.size,
              mimeType: doc.mimeType || 'application/pdf',
              pageCount: 1,
              pageUrls: [],
            });
          }
        }
        setUploadingDocs(false);
      } else if (selectedDocs.length > 0) {
        docUrls = [...selectedDocs];
      }

      // Merge image URLs and doc URLs for universal backward-compatibility
      const combinedMediaUrls = [...mediaUrls];
      if (docUrls.length > 0) {
        docUrls.forEach(d => {
          const u = typeof d === 'string' ? d : d.url;
          if (u && !combinedMediaUrls.includes(u)) {
            combinedMediaUrls.push(u);
          }
        });
      }

      const tags = isSlideDeckMode ? ['#slidedeck', `#theme_${selectedTheme}`] : [];

      let result = null;
      if (tokenToUse) {
        try {
          result = await createPost(tokenToUse, {
            content,
            media_urls: combinedMediaUrls,
            doc_urls: docUrls,
            post_type: 'post',
            tags,
          });
        } catch (apiErr) {
          console.warn('[CreatePostSheet] createPost API error:', apiErr);
        }
      }

      if (tokenToUse && !result) {
        Alert.alert('Could Not Share Post', 'The server was unable to save your post. Please check your internet connection or try again.');
        return;
      }

      const newPostObj = {
        ...(result && typeof result === 'object' ? result : {}),
        id: result?.id || `local-${Date.now()}`,
        content,
        media_urls: combinedMediaUrls,
        doc_urls: docUrls,
        post_type: isSlideDeckMode ? 'carousel' : (result?.post_type || 'post'),
        is_carousel: isSlideDeckMode,
        carousel_theme: selectedTheme,
        tags,
        user: currentUser ? {
          full_name: currentUser.name || currentUser.full_name || 'You',
          avatar_url: currentUser.avatar_url || currentUser.avatar || null,
          course: currentUser.course,
          branch: currentUser.branch,
          year: currentUser.year,
        } : (result?.user || null),
        created_at: result?.created_at || new Date().toISOString(),
        like_count: 0,
        comment_count: 0,
        repost_count: 0,
        user_reaction: null,
      };

      handleClose();
      if (onPostSuccess) onPostSuccess(newPostObj);
      Alert.alert(
        'Posted!',
        isSlideDeckMode
          ? 'Your interactive Slide Deck has been shared with campus.'
          : 'Your post has been shared to the campus feed.'
      );
    } catch (err) {
      Alert.alert('Failed to Post', err.message || 'An error occurred.');
    } finally {
      setPosting(false);
      setUploadingImages(false);
      setUploadingDocs(false);
    }
  };

  const detectedSlidesCount = content.includes('---')
    ? content.split(/\n\s*---\s*\n/).filter(s => s.trim().length > 0).length || 1
    : (content.trim().length > 0 ? 1 : 0);

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
      >
        {/* Backdrop tap to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', zIndex: 10 }}>

          {/* ── Drag handle ── */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#D1D5DB' }} />
          </View>

          {/* ── Modal Header — pinned, never scrolls away ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>
                {isSlideDeckMode ? 'Create Slide Deck 🎴' : 'Create Post'}
              </Text>
              {isSlideDeckMode && (
                <View style={{ backgroundColor: '#4F46E520', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ color: '#4F46E5', fontSize: 11, fontWeight: '800' }}>
                    {detectedSlidesCount} {detectedSlidesCount === 1 ? 'Slide' : 'Slides'}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9', borderRadius: 20, padding: 6 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* ── Scrollable body ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ paddingHorizontal: 20 }}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* Slide Deck Theme Picker */}
            {isSlideDeckMode && (
              <View style={{ marginBottom: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>
                  Deck Gradient Theme:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {THEME_OPTIONS.map(th => {
                    const isSelected = selectedTheme === th.id;
                    return (
                      <TouchableOpacity
                        key={th.id}
                        onPress={() => setSelectedTheme(th.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 20,
                          backgroundColor: isSelected ? th.color + '25' : (isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF'),
                          borderWidth: 1.5,
                          borderColor: isSelected ? th.color : (isDark ? 'transparent' : '#E2E8F0'),
                        }}
                      >
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: th.color }} />
                        <Text style={{ fontSize: 12, fontWeight: isSelected ? '800' : '600', color: isSelected ? th.color : colors.textPrimary }}>
                          {th.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    Tip: Use <Text style={{ fontWeight: '800', color: colors.primary }}>---</Text> to divide slides
                  </Text>
                  <TouchableOpacity
                    onPress={handleInsertSlideBreak}
                    style={{ backgroundColor: colors.primary + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>+ Add Slide Break</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Text Input */}
            <TextInput
              placeholder={isSlideDeckMode ? `💡 Title: [Topic]\nShort overview / hook sentence...\n\n---\n\n🔍 The Challenge / Analysis\nExplain the mechanism...\n\n---\n\n⚡ Takeaways & Application\n• Key Point 1\n• Key Point 2` : `Share knowledge, ask questions, use #hashtags...`}
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.postTextInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                  borderColor: content.length > POST_CHAR_LIMIT ? '#EF4444' : isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                  borderWidth: 1,
                  minHeight: isSlideDeckMode ? 140 : 100,
                }
              ]}
              multiline
              value={content}
              onChangeText={t => t.length <= POST_CHAR_LIMIT + 50 && setContent(t)}
              maxLength={POST_CHAR_LIMIT + 50}
            />

            {/* Character counter & Quick Insert Strip */}
            <View style={{ marginTop: 14, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, letterSpacing: 0.5 }}>
                  QUICK ICONS & FORMULAS
                </Text>
                <Text style={{
                  fontSize: 12, fontWeight: '600',
                  color: content.length > POST_CHAR_LIMIT ? '#EF4444' : content.length > POST_CHAR_LIMIT * 0.85 ? '#F59E0B' : colors.textSecondary
                }}>
                  {content.length} / {POST_CHAR_LIMIT}
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center' }}>
                {QUICK_ICONS.map((ic, i) => (
                  <TouchableOpacity
                    key={i}
                    style={{
                      paddingHorizontal: ic.length > 2 ? 10 : 8,
                      paddingVertical: 5,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                    }}
                    onPress={() => handleInsertIcon(ic)}
                  >
                    <Text style={{
                      fontSize: ic.length > 2 ? 11 : 14,
                      fontWeight: '700',
                      color: colors.textPrimary,
                      fontFamily: ic === '` `' ? (Platform.OS === 'ios' ? 'Menlo' : 'monospace') : undefined,
                    }}>
                      {ic}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ── Image Previews ── */}
            {selectedImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
                {selectedImages.map((uri, idx) => (
                  <View key={idx} style={styles.imgPickerPreviewWrap}>
                    <Image source={{ uri }} style={styles.imgPickerPreview} />
                    <TouchableOpacity
                      style={styles.imgPickerRemoveBtn}
                      onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {selectedImages.length < 9 && (
                  <TouchableOpacity style={styles.imgPickerAddMore} onPress={handlePickImages}>
                    <Ionicons name="add" size={28} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}

            {/* ── Document Previews (Max 1 like LinkedIn) ── */}
            {selectedDocs.length > 0 && (
              <View style={{ marginBottom: 12, gap: 8 }}>
                {selectedDocs.map((doc, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.docPickerCard,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0F4FF', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#C7D2FE' },
                    ]}
                  >
                    <MaterialCommunityIcons name="file-pdf-box" size={30} color="#E53E3E" />
                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{doc.name}</Text>
                      {doc.size > 0 && (
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                          {doc.size < 1024 * 1024 ? `${(doc.size / 1024).toFixed(0)} KB` : `${(doc.size / (1024 * 1024)).toFixed(1)} MB`}
                          {' · Max 100 MB'}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedDocs(prev => prev.filter((_, i) => i !== idx))}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ── Toolbar ── */}
            <View style={[styles.postModalToolbar, { flexWrap: 'wrap' }]}>
              {/* Slide Deck Mode Toggle */}
              <TouchableOpacity
                style={[
                  styles.postModalTool,
                  {
                    backgroundColor: isSlideDeckMode ? '#4F46E525' : (isDark ? 'rgba(255,255,255,0.06)' : '#EEF2FF'),
                    borderColor: isSlideDeckMode ? '#4F46E5' : 'transparent',
                    borderWidth: 1,
                  }
                ]}
                onPress={() => {
                  const next = !isSlideDeckMode;
                  setIsSlideDeckMode(next);
                  if (next && !content.includes('---') && !content.trim()) {
                    setContent('💡 Title: [Topic or Key Concept]\nShort overview / hook sentence...\n\n---\n\n🔍 The Challenge / Analysis\nExplain the mechanism...\n\n---\n\n⚡ Takeaways & Application\n• Key Point 1\n• Key Point 2');
                  }
                }}
              >
                <MaterialCommunityIcons name="cards-outline" size={20} color={isSlideDeckMode ? '#4F46E5' : colors.primary} />
                <Text style={[styles.postModalToolLabel, { color: isSlideDeckMode ? '#4F46E5' : colors.primary, fontWeight: isSlideDeckMode ? '800' : '600' }]}>
                  {isSlideDeckMode ? 'Deck Mode ✓' : 'Slide Deck'}
                </Text>
              </TouchableOpacity>

              {/* Curated Icons Drawer Toggle */}
              <TouchableOpacity
                style={[
                  styles.postModalTool,
                  {
                    backgroundColor: showIconDrawer ? '#F59E0B25' : (isDark ? 'rgba(255,255,255,0.06)' : '#FFFBEB'),
                    borderColor: showIconDrawer ? '#F59E0B' : 'transparent',
                    borderWidth: 1,
                  }
                ]}
                onPress={() => setShowIconDrawer(prev => !prev)}
              >
                <Ionicons name="happy-outline" size={20} color="#D97706" />
                <Text style={[styles.postModalToolLabel, { color: '#D97706', fontWeight: showIconDrawer ? '800' : '600' }]}>
                  {showIconDrawer ? 'Icons Tray ✓' : 'Icons & Math'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.postModalTool, { backgroundColor: colors.primary + '15' }]} onPress={handlePickImages}>
                <Ionicons name="image-outline" size={20} color={colors.primary} />
                <Text style={[styles.postModalToolLabel, { color: colors.primary }]}>Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.postModalTool, { backgroundColor: '#E53E3E15' }]}
                onPress={handlePickDocs}
              >
                <MaterialCommunityIcons name="file-pdf-box" size={20} color="#E53E3E" />
                <Text style={[styles.postModalToolLabel, { color: '#E53E3E' }]}>Document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.postModalTool, { backgroundColor: '#8B5CF615' }]}
                onPress={() => setContent(p => p + ' #')}
              >
                <Ionicons name="pricetag-outline" size={20} color="#8B5CF6" />
                <Text style={[styles.postModalToolLabel, { color: '#8B5CF6' }]}>Tag</Text>
              </TouchableOpacity>
            </View>

            {/* ── Categorized Icon Drawer ── */}
            {showIconDrawer && (
              <View style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                borderRadius: 16,
                padding: 12,
                marginTop: 4,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
              }}>
                {/* Category Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
                  {ICON_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: selectedIconCategory === cat.id ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : '#EEF2FF'),
                      }}
                      onPress={() => setSelectedIconCategory(cat.id)}
                    >
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: selectedIconCategory === cat.id ? '#FFFFFF' : colors.textPrimary,
                      }}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Icons Grid in Selected Category */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(ICON_CATEGORIES.find(c => c.id === selectedIconCategory)?.icons || []).map((ic, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={{
                        paddingHorizontal: ic.length > 2 ? 10 : 8,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.14)' : '#CBD5E1',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => handleInsertIcon(ic)}
                    >
                      <Text style={{
                        fontSize: ic.length > 2 ? 12 : 16,
                        fontWeight: '700',
                        color: colors.textPrimary,
                        fontFamily: ic.includes('`') ? (Platform.OS === 'ios' ? 'Menlo' : 'monospace') : undefined,
                      }}>
                        {ic}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* ── Share Button — positioned above bottom tab bar and keyboard ── */}
          <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: Math.max(34, (insets.bottom || 0) + 72) }}>
            <TouchableOpacity
              style={[
                styles.sharePostBtn,
                {
                  backgroundColor:
                    posting ||
                    (!content.trim() && selectedImages.length === 0 && selectedDocs.length === 0) ||
                    content.length > POST_CHAR_LIMIT
                      ? colors.border
                      : colors.primary,
                },
              ]}
              onPress={handleSubmit}
              disabled={
                posting ||
                (!content.trim() && selectedImages.length === 0 && selectedDocs.length === 0) ||
                content.length > POST_CHAR_LIMIT
              }
            >
              {posting || uploadingImages || uploadingDocs ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="hourglass-empty" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                    {uploadingDocs ? 'Uploading documents...' : uploadingImages ? 'Uploading photos...' : 'Sharing...'}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>Share Post</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  postTextInput: {
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  imgPickerPreviewWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imgPickerPreview: {
    width: '100%',
    height: '100%',
  },
  imgPickerRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgPickerAddMore: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docPickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  postModalToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  postModalTool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postModalToolLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  sharePostBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
