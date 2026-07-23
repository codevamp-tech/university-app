import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useUser } from '../../../context/UserContext';
import { isMedicalStudent } from '../../../utils/courseDisplay';
import { getEBooks } from '../../../data/apiService';

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
  },
  {
    id: '7',
    title: "Gray's Anatomy",
    author: 'Henry Gray',
    cover: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1000&auto=format&fit=crop',
    rating: 4.9,
    category: 'Anatomy',
    pages: 1200,
    description: 'The clinical reference book on human anatomy, widely recognized as a masterpiece in medical literature.'
  },
  {
    id: '8',
    title: 'Robbins Basic Pathology',
    author: 'Vinay Kumar',
    cover: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    category: 'Pathology',
    pages: 952,
    description: 'Readable, well-illustrated, and concise introduction to the study of human disease pathology.'
  },
  {
    id: '9',
    title: 'Essentials of Medical Pharmacology',
    author: 'K.D. Tripathi',
    cover: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1000&auto=format&fit=crop',
    rating: 4.7,
    category: 'Pharmacology',
    pages: 1024,
    description: 'Comprehensive guide to pharmaceuticals, mechanisms of action, and clinical therapeutic uses.'
  },
  {
    id: '10',
    title: 'Microelectronic Circuits',
    author: 'Adel S. Sedra & Kenneth C. Smith',
    cover: 'https://images.unsplash.com/photo-1517055727196-8800e2182046?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    category: 'Circuits',
    pages: 1472,
    description: 'The standard text for microelectronic circuit design, covering analog and digital devices.'
  },
  {
    id: '11',
    title: 'Digital Design',
    author: 'M. Morris Mano',
    cover: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1000&auto=format&fit=crop',
    rating: 4.7,
    category: 'Digital Systems',
    pages: 565,
    description: 'An introduction to digital design principles, logic gates, and hardware implementation.'
  },
  {
    id: '12',
    title: 'Principles of Electromagnetics',
    author: 'Matthew N. O. Sadiku',
    cover: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop',
    rating: 4.6,
    category: 'ECE',
    pages: 848,
    description: 'A textbook introducing electromagnetic wave propagation, transmission lines, and antenna systems.'
  },
  {
    id: '13',
    title: 'Pharmaceutics: Drug Formulation',
    author: 'M.E. Aulton',
    cover: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    category: 'Pharmaceutics',
    pages: 720,
    description: 'The definitive guide to the design, manufacture and testing of modern pharmaceutical dosage forms.'
  },
  {
    id: '14',
    title: 'Pharmaceutical Microbiology',
    author: 'W.B. Hugo & A.D. Russell',
    cover: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=1000&auto=format&fit=crop',
    rating: 4.6,
    category: 'Pharmaceutics',
    pages: 560,
    description: 'Covers microbiological aspects of pharmaceuticals, from contamination control to sterile manufacturing.'
  },
  {
    id: '15',
    title: 'Foye\'s Medicinal Chemistry',
    author: 'Thomas L. Lemke',
    cover: 'https://images.unsplash.com/photo-1576671081837-49000212a370?q=80&w=1000&auto=format&fit=crop',
    rating: 4.9,
    category: 'Pharmacology',
    pages: 1104,
    description: 'The gold standard reference for medicinal chemistry — drug design, structure-activity relationships, and mechanisms.'
  },
  {
    id: '16',
    title: 'Public Health Nutrition',
    author: 'Sheila Chander Vir',
    cover: 'https://drive.google.com/thumbnail?id=12pesuDYq2ZzUBvN236pUsJIbjz6cFMbq&sz=w500',
    rating: 4.8,
    category: 'Medical',
    pages: 928,
    description: 'An essential textbook on public health nutrition, covering nutritional epidemiology, community-based practice, and developing country challenges.',
    pdfUrl: 'https://drive.google.com/file/d/12pesuDYq2ZzUBvN236pUsJIbjz6cFMbq/view?usp=sharing'
  },
  {
    id: '17',
    title: 'Health Information Management',
    author: 'Merida L. Johns',
    cover: 'https://drive.google.com/thumbnail?id=1Ra2O97B3FqqQfsekrrRwuTnW50E_przv&sz=w500',
    rating: 4.7,
    category: 'Medical',
    pages: 480,
    description: 'An in-depth guide on health information systems, clinical records management, and healthcare data governance.',
    pdfUrl: 'https://drive.google.com/file/d/1Ra2O97B3FqqQfsekrrRwuTnW50E_przv/view?usp=drive_link'
  },
  {
    id: '18',
    title: 'Textbook of Medical Physiology',
    author: 'Guyton & Hall',
    cover: 'https://drive.google.com/thumbnail?id=1aGvTmFJ1T7dQTVWbqFeIpIzvX-Z1iTx1&sz=w500',
    rating: 4.9,
    category: 'Physiology',
    pages: 1120,
    description: 'The world\'s foremost medical physiology textbook, presenting complex principles in clear, easy-to-understand language.',
    pdfUrl: 'https://drive.google.com/file/d/1aGvTmFJ1T7dQTVWbqFeIpIzvX-Z1iTx1/view?usp=drive_link'
  },
  {
    id: '19',
    title: "Ganong's Review of Medical Physiology",
    author: 'Kim E. Barrett',
    cover: 'https://drive.google.com/thumbnail?id=1sclOYxeRCxTk07Gl-tDTrOx4_xdeHUBc&sz=w500',
    rating: 4.8,
    category: 'Physiology',
    pages: 750,
    description: 'A concise, high-yield review of medical physiology, perfect for clinical course preparation and USMLE / NEET PG revision.',
    pdfUrl: 'https://drive.google.com/file/d/1sclOYxeRCxTk07Gl-tDTrOx4_xdeHUBc/view?usp=drive_link'
  },
  {
    id: '20',
    title: 'Essentials for Health Protection',
    author: 'Alistair Hunter',
    cover: 'https://drive.google.com/thumbnail?id=1qxX7hyyHKQIRGxmsS2jye9tmRi599hdd&sz=w500',
    rating: 4.6,
    category: 'Medical',
    pages: 320,
    description: 'Focuses on the key components of health protection, including communicable disease control, environmental health, and emergency response.',
    pdfUrl: 'https://drive.google.com/file/d/1qxX7hyyHKQIRGxmsS2jye9tmRi599hdd/view?usp=drive_link'
  },
  {
    id: '21',
    title: 'Demystifying COVID-19',
    author: 'World Health Organization',
    cover: 'https://drive.google.com/thumbnail?id=1S9DxvVIxPKXJNsfuXgs7n3DKr8esbGhl&sz=w500',
    rating: 4.7,
    category: 'Medical',
    pages: 290,
    description: 'An exhaustive compilation detailing the disease history, diagnosis protocols, treatment modalities, and epidemiological profiles of COVID-19.',
    pdfUrl: 'https://drive.google.com/file/d/1S9DxvVIxPKXJNsfuXgs7n3DKr8esbGhl/view?usp=drive_link'
  },
  {
    id: '22',
    title: 'Critical Epidemiology',
    author: 'Jaime Breilh',
    cover: 'https://drive.google.com/thumbnail?id=1UT9KIZcOXa6dmaHPx_QAVjiWdAKP1kAQ&sz=w500',
    rating: 4.6,
    category: 'Medical',
    pages: 340,
    description: 'A critical approach to epidemiological science, discussing social determinants of health, research methodologies, and systemic wellness.',
    pdfUrl: 'https://drive.google.com/file/d/1UT9KIZcOXa6dmaHPx_QAVjiWdAKP1kAQ/view?usp=drive_link'
  },
  {
    id: '23',
    title: 'Anatomy & Physiology Vol. 2',
    author: 'OpenStax',
    cover: 'https://drive.google.com/thumbnail?id=1v2DQHACYu9IdCCYXYmpKQGghPBi3WSam&sz=w500',
    rating: 4.8,
    category: 'Anatomy',
    pages: 680,
    description: 'Volume 2 of the comprehensive textbook covering human anatomy and systemic physiology with detailed illustrations.',
    pdfUrl: 'https://drive.google.com/file/d/1v2DQHACYu9IdCCYXYmpKQGghPBi3WSam/view?usp=drive_link'
  }
];

const LibraryMainScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useUser();

  const [books, setBooks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchText, setSearchText] = React.useState('');

  const fetchBooks = React.useCallback(async (query = '') => {
    setLoading(true);
    // Parse colgcd from rollno or emp_id e.g. "2143291" -> default "11"
    const parts = String(user?.rollno || user?.emp_id || '').split('/');
    const colgcd = parts.length >= 2 ? parts[1] : '11';

    try {
      const data = await getEBooks(query, colgcd);
      
      // Filter the local static drive books (only those that have a pdfUrl link) by query
      const driveBooks = booksData.filter(b => {
        if (!b.pdfUrl) return false;
        const titleMatch = String(b.title || '').toLowerCase().includes(query.toLowerCase());
        const authorMatch = String(b.author || '').toLowerCase().includes(query.toLowerCase());
        return titleMatch || authorMatch;
      });

      // Merge drive books first followed by ERP search results
      setBooks([...driveBooks, ...(data || [])]);
    } catch (err) {
      console.warn('[Library] Failed to fetch ebooks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchBooks('');
  }, [fetchBooks]);

  const renderBook = ({ item }) => {
    const isBookUnlocked = true; // All ERP-synced e-books are unlocked for academic use
    return (
      <TouchableOpacity 
        style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          navigation.navigate('BookDetail', { book: item });
        }}
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
  };

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
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              fetchBooks(text);
            }}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4338CA" />
          <Text style={{ marginTop: 12, color: colors.textSecondary, fontWeight: '600' }}>Fetching library e-books...</Text>
        </View>
      ) : books.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Ionicons name="book-outline" size={48} color={colors.textMuted} />
          <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>No E-Books Found</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
            No matching books with readable PDFs found in the ERP database.
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBook}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  lockBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  lockBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
});

export default LibraryMainScreen;
