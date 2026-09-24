import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Linking, Alert
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Feather, MaterialIcons, Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export function getActualBookUrl(book) {
  if (!book) return null;
  const rawUrl = book.pdfUrl || book.ebook_url || book.link || book.url || book.file_url || book.download_url;
  
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() !== '' && rawUrl !== '0' && rawUrl.toLowerCase() !== 'null') {
    let clean = rawUrl.trim().replace(/\\/g, '/');
    const idx = clean.toLowerCase().indexOf('/library/cataloguing/');
    if (idx !== -1 && !clean.startsWith('http')) {
      return 'https://myportal.srms.ac.in' + clean.substring(idx);
    }
    const idx2 = clean.toLowerCase().indexOf('/bookuploads/');
    if (idx2 !== -1 && !clean.startsWith('http')) {
      return 'https://myportal.srms.ac.in/library/cataloguing' + clean.substring(idx2);
    }
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    return 'https://myportal.srms.ac.in/' + clean;
  }

  // Live direct reader / catalog link for the exact book title and author
  const title = encodeURIComponent((book.title || '').trim());
  const author = encodeURIComponent((book.author || '').trim());
  return `https://books.google.com/books?q=${title}${author ? '+' + author : ''}`;
}

const BookDetailScreen = ({ route, navigation }) => {
  const { book } = route.params || {};
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Book details unavailable.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bookUrl = getActualBookUrl(book);

  const handleOpenBook = async (customUrl = null) => {
    const targetUrl = customUrl || bookUrl;
    if (!targetUrl) {
      Alert.alert('E-Book', 'Digital link for this book is not available.');
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(targetUrl);
    } catch (err) {
      Linking.openURL(targetUrl).catch(() => {
        Alert.alert('Cannot Open', 'Unable to open digital reader URL.');
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating Top Nav Bar */}
      <View style={[styles.floatingHeader, { top: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity 
          style={styles.floatingBtn} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.floatingBtn} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Tappable Backdrop / Image Header */}
        <TouchableOpacity 
          activeOpacity={0.95} 
          onPress={() => navigation.goBack()} 
          style={styles.imageContainer}
        >
          {book.cover ? (
            <Image source={{ uri: book.cover }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <LinearGradient 
              colors={isDark ? ['#1E1B4B', '#312E81'] : ['#4338CA', '#6366F1']} 
              style={[styles.coverImage, styles.placeholderCover]}
            >
              <MaterialCommunityIcons name="book-open-page-variant" size={64} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          )}
          <LinearGradient 
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.8)']} 
            style={styles.gradient} 
          />
        </TouchableOpacity>

        {/* Bottom Sheet Card Content */}
        <View style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Drag Handle Indicator */}
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.dragHandleContainer}
          >
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          </TouchableOpacity>

          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{book.title}</Text>
            <Text style={[styles.author, { color: colors.textSecondary }]}>{book.author || 'Academic Resource'}</Text>
          </View>

          <View style={[styles.statsRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <FontAwesome name="star" size={16} color="#F59E0B" />
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{book.rating || '4.8'}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Rating</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{book.pages || 450}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pages</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{book.category ? String(book.category).split(' ')[0] : 'Academic'}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Category</Text>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About the Book</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {book.description || `Official study and reference edition of "${book.title}". Access the complete volume online through the university library and partner repositories.`}
            </Text>
          </View>

          {/* Primary Action Button: Open Actual Book URL */}
          <TouchableOpacity 
            style={styles.readBtn} 
            activeOpacity={0.85}
            onPress={() => handleOpenBook()}
          >
            <LinearGradient colors={['#4F46E5', '#3730A3']} style={styles.readBtnGradient}>
              <Feather name="book-open" size={20} color="#FFFFFF" />
              <Text style={styles.readBtnText}>Read Book (Open URL)</Text>
              <Feather name="external-link" size={16} color="rgba(255,255,255,0.8)" style={{ marginLeft: 4 }} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Action: Search / View on Google Books */}
          <TouchableOpacity 
            style={[styles.googleBooksBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }]}
            activeOpacity={0.8}
            onPress={() => {
              const title = encodeURIComponent((book.title || '').trim());
              const author = encodeURIComponent((book.author || '').trim());
              handleOpenBook(`https://books.google.com/books?q=${title}+${author}`);
            }}
          >
            <MaterialIcons name="menu-book" size={18} color={isDark ? '#93C5FD' : '#2563EB'} />
            <Text style={[styles.googleBooksBtnText, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
              Open in Google Books
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.closeBtn, { borderColor: colors.border }]} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>Dismiss / Close</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  floatingHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  imageContainer: { width: width, height: height * 0.38 },
  coverImage: { width: '100%', height: '100%' },
  placeholderCover: { justifyContent: 'center', alignItems: 'center' },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  content: { 
    marginTop: -28, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    paddingHorizontal: 24, 
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 8,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  titleSection: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8, lineHeight: 28 },
  author: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 20, marginBottom: 24, borderWidth: 1 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statDivider: { width: 1, height: 26 },
  descriptionSection: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  readBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  readBtnGradient: { height: 54, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  readBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  googleBooksBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  googleBooksBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: { height: 48, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '700' },
});

export default BookDetailScreen;
