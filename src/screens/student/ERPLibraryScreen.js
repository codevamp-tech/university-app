import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getErpLibraryBooks, getErpMyIssuedBooks } from '../../data/apiService';

const { width } = Dimensions.get('window');
const CATEGORIES = ['All', 'Engineering', 'Science', 'Management', 'Pharmacy', 'Reference'];

export default function ERPLibraryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const rollno = user?.rollno || user?.username;

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const [booksRes, issuedRes] = await Promise.allSettled([
        getErpLibraryBooks(accessToken, ''),
        getErpMyIssuedBooks(accessToken, rollno),
      ]);
      setBooks(booksRes.status === 'fulfilled' ? (booksRes.value || []) : []);
      setIssuedBooks(issuedRes.status === 'fulfilled' ? (issuedRes.value || []) : []);
    } catch (e) {
      console.warn('[ERPLibrary] load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, rollno]);

  useEffect(() => { load(false); }, [load]);

  const handleSearch = useCallback(async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { load(false); return; }
    setSearching(true);
    try {
      const res = await getErpLibraryBooks(accessToken, q.trim());
      setBooks(res || []);
    } catch (_) {}
    finally { setSearching(false); }
  }, [accessToken, load]);

  const filteredBooks = activeCategory === 'All'
    ? books
    : books.filter(b => (b.category || '').toLowerCase().includes(activeCategory.toLowerCase()));

  const renderBookCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
    >
      <View style={[styles.bookSpine, { backgroundColor: item.available !== false ? '#5B4BFF' : '#F04438' }]} />
      <View style={styles.bookInfo}>
        <Text style={[styles.bookTitle, { color: colors.textPrimary }]} numberOfLines={2}>{item.title || 'Untitled'}</Text>
        <Text style={[styles.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.author || item.authors || 'Unknown Author'}
        </Text>
        <View style={styles.bookMeta}>
          {item.isbn && (
            <View style={[styles.tag, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>ISBN: {item.isbn}</Text>
            </View>
          )}
          <View style={[styles.availBadge, { backgroundColor: item.available !== false ? '#DCFCE7' : '#FEE2E2' }]}>
            <Text style={{ color: item.available !== false ? '#16A34A' : '#DC2626', fontSize: 11, fontWeight: '600' }}>
              {item.available !== false ? '\u2713 Available' : '\u2717 Issued'}
            </Text>
          </View>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderIssuedCard = (item, idx) => {
    const dueDate = item.due_date ? new Date(item.due_date) : null;
    const isOverdue = dueDate && dueDate < new Date();
    return (
      <View key={idx} style={[styles.issuedCard, { backgroundColor: isOverdue ? '#FEF2F2' : colors.card, borderColor: isOverdue ? '#FCA5A5' : colors.border }]}>
        <View style={[styles.issuedIcon, { backgroundColor: isOverdue ? '#FEE2E2' : '#EEF2FF' }]}>
          <MaterialCommunityIcons name="book-open-page-variant" size={22} color={isOverdue ? '#EF4444' : '#5B4BFF'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.issuedTitle, { color: colors.textPrimary }]} numberOfLines={2}>{item.title || 'Book'}</Text>
          <Text style={[styles.issuedMeta, { color: isOverdue ? '#EF4444' : colors.textSecondary }]}>
            Due: {dueDate ? dueDate.toLocaleDateString('en-IN') : 'N/A'}{isOverdue ? ' · OVERDUE' : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <LinearGradient colors={['#5B4BFF', '#7867FF']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Library</Text>
          <Text style={styles.headerSub}>{books.length > 0 ? books.length + ' books in catalog' : 'Search the catalog'}</Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <MaterialCommunityIcons name="bookshelf" size={18} color="#fff" />
          <Text style={styles.headerBadgeText}>{issuedBooks.length} Issued</Text>
        </View>
      </LinearGradient>

      <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search books, authors, ISBN..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {searching && <ActivityIndicator size="small" color="#5B4BFF" />}
      </View>

      <View style={styles.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScrollContent}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
              style={[styles.catChip, { backgroundColor: activeCategory === cat ? '#5B4BFF' : (isDark ? '#1E293B' : '#F1F5F9') }]}>
              <Text style={[styles.catChipText, { color: activeCategory === cat ? '#fff' : colors.textSecondary }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#5B4BFF" />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {issuedBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Currently Issued</Text>
            {issuedBooks.map((b, i) => renderIssuedCard(b, i))}
          </View>
        )}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {searchQuery ? 'Results for "' + searchQuery + '"' : 'Library Catalog'}
          </Text>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#5B4BFF" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading catalog...</Text>
            </View>
          ) : filteredBooks.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="book-off-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'No books found' : 'No books in catalog yet'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredBooks}
              keyExtractor={(item, i) => String(item.id || i)}
              renderItem={renderBookCard}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  headerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 14, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  catContainer: { height: 44, marginBottom: 10, justifyContent: 'center' },
  catScrollContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  catChip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, height: 36, justifyContent: 'center', alignItems: 'center' },
  catChipText: { fontSize: 13, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  bookCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, overflow: 'hidden', padding: 14 },
  bookSpine: { width: 4, borderRadius: 2, marginRight: 12, minHeight: 60 },
  bookInfo: { flex: 1, gap: 4 },
  bookTitle: { fontSize: 14, fontWeight: '700' },
  bookAuthor: { fontSize: 12 },
  bookMeta: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' },
  tag: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 10 },
  availBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  issuedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  issuedIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  issuedTitle: { fontSize: 13, fontWeight: '600' },
  issuedMeta: { fontSize: 11, marginTop: 2 },
  center: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
