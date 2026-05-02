import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const booksData = [
  {
    id: '1',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    category: 'Programming',
    pages: 464,
    description: 'A Handbook of Agile Software Craftsmanship. Noted software expert Robert C. Martin presents a revolutionary paradigm with Clean Code.'
  },
  {
    id: '2',
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt',
    cover: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1000&auto=format&fit=crop',
    rating: 4.9,
    category: 'Software Engineering',
    pages: 352,
    description: 'The Pragmatic Programmer is one of those rare tech books you’ll read, re-read, and read again over the years.'
  },
  {
    id: '3',
    title: 'Artificial Intelligence',
    author: 'Stuart Russell',
    cover: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=1000&auto=format&fit=crop',
    rating: 4.7,
    category: 'AI / ML',
    pages: 1152,
    description: 'The long-anticipated revision of this best-selling text offers the most comprehensive, up-to-date introduction to the theory and practice of AI.'
  },
  {
    id: '4',
    title: 'Design Patterns',
    author: 'Erich Gamma',
    cover: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    category: 'Design',
    pages: 395,
    description: 'Capturing design experience as a design pattern is the central idea behind this book.'
  },
  {
    id: '5',
    title: 'Zero to One',
    author: 'Peter Thiel',
    cover: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1000&auto=format&fit=crop',
    rating: 4.6,
    category: 'Entrepreneurship',
    pages: 224,
    description: 'Notes on Startups, or How to Build the Future.'
  },
  {
    id: '6',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=1000&auto=format&fit=crop',
    rating: 4.7,
    category: 'Psychology',
    pages: 499,
    description: 'The New York Times Bestseller. Kahneman takes us on a groundbreaking tour of the mind.'
  }
];

const LibraryMainScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const renderBook = ({ item }) => (
    <TouchableOpacity 
      style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate('BookDetail', { book: item })}
    >
      <Image source={{ uri: item.cover }} style={styles.bookCover} />
      <View style={styles.bookInfo}>
        <Text style={[styles.bookTitle, { color: colors.textPrimary }]} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.bookAuthor, { color: colors.textSecondary }]}>{item.author}</Text>
        <View style={styles.bookMeta}>
          <View style={styles.ratingBox}>
            <MaterialIcons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <Text style={[styles.categoryTag, { color: colors.textMuted }]}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>E-Library</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={20} color={colors.textSecondary} />
          <TextInput 
            placeholder="Search books, authors..." 
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>
      </View>

      <FlatList
        data={booksData}
        renderItem={renderBook}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: { height: 50, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600' },
  list: { paddingHorizontal: 12, paddingBottom: 40 },
  bookCard: { width: (width - 48) / 2, margin: 6, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  bookCover: { width: '100%', height: 220, backgroundColor: '#F1F5F9' },
  bookInfo: { padding: 12 },
  bookTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  bookAuthor: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  bookMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#B45309' },
  categoryTag: { fontSize: 10, fontWeight: '700' },
});

export default LibraryMainScreen;
