import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Feather, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../../context/UserContext';
import { isMedicalStudent } from '../../../utils/courseDisplay';
import { getStudentPlacementTrack } from '../../../utils/placementReadiness';
import { getEBooks, getErpLibraryBooks } from '../../../data/apiService';

const { width } = Dimensions.get('window');

const BookCoverImage = ({ uri, title, style, isCompact = false }) => {
  const [failed, setFailed] = React.useState(!uri);

  React.useEffect(() => {
    setFailed(!uri);
  }, [uri]);

  if (failed || !uri) {
    const gradients = [
      ['#3B82F6', '#1D4ED8'],
      ['#8B5CF6', '#5B21B6'],
      ['#EC4899', '#BE185D'],
      ['#059669', '#047857'],
      ['#EA580C', '#C2410C'],
      ['#6366F1', '#4338CA'],
      ['#0284C7', '#0369A1'],
    ];
    let hash = 0;
    for (let i = 0; i < (title || '').length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const grad = gradients[Math.abs(hash) % gradients.length];

    return (
      <LinearGradient colors={grad} style={[style, { justifyContent: 'center', alignItems: 'center', padding: isCompact ? 8 : 14 }]}>
        <MaterialCommunityIcons
          name="book-open-page-variant"
          size={isCompact ? 28 : 44}
          color="rgba(255, 255, 255, 0.85)"
        />
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: isCompact ? 10 : 12,
            fontWeight: '800',
            textAlign: 'center',
            marginTop: isCompact ? 6 : 8,
            lineHeight: isCompact ? 13 : 16,
          }}
          numberOfLines={isCompact ? 3 : 4}
        >
          {title}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
};

export const booksData = [
  {
    id: '1',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    category: 'Programming',
    pages: 464,
    description: 'A Handbook of Agile Software Craftsmanship. Noted software expert Robert C. Martin presents a revolutionary paradigm with Clean Code.',
    pdfUrl: 'https://drive.google.com/file/d/12pesuDYq2ZzUBvN236pUsJIbjz6cFMbq/view?usp=sharing'
  },
  {
    id: '2',
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt',
    cover: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1000&auto=format&fit=crop',
    rating: 4.9,
    category: 'Software Engineering',
    pages: 352,
    description: 'The Pragmatic Programmer is one of those rare tech books you’ll read, re-read, and read again over the years.',
    pdfUrl: 'https://drive.google.com/file/d/1Ra2O97B3FqqQfsekrrRwuTnW50E_przv/view?usp=drive_link'
  },
  {
    id: '3',
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell & Peter Norvig',
    cover: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=1000&auto=format&fit=crop',
    rating: 4.7,
    category: 'AI / ML',
    pages: 1152,
    description: 'The long-anticipated revision of this best-selling text offers the most comprehensive, up-to-date introduction to the theory and practice of AI.',
    pdfUrl: 'https://drive.google.com/file/d/1aGvTmFJ1T7dQTVWbqFeIpIzvX-Z1iTx1/view?usp=drive_link'
  },
  {
    id: '4',
    title: 'Design Patterns',
    author: 'Erich Gamma',
    cover: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    category: 'Design',
    pages: 395,
    description: 'Capturing design experience as a design pattern is the central idea behind this book.',
    pdfUrl: 'https://drive.google.com/file/d/1sclOYxeRCxTk07Gl-tDTrOx4_xdeHUBc/view?usp=drive_link'
  },
  {
    id: '5',
    title: 'Zero to One',
    author: 'Peter Thiel',
    cover: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1000&auto=format&fit=crop',
    rating: 4.6,
    category: 'Entrepreneurship',
    pages: 224,
    description: 'Notes on Startups, or How to Build the Future.',
    pdfUrl: 'https://drive.google.com/file/d/1qxX7hyyHKQIRGxmsS2jye9tmRi599hdd/view?usp=drive_link'
  },
  {
    id: '6',
    title: 'Financial Accounting & Reporting',
    author: 'Barry Elliott & Jamie Elliott',
    cover: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    category: 'Finance',
    pages: 870,
    description: 'Comprehensive introduction to corporate financial reporting, IFRS standards, balance sheet analysis, and auditing.',
    pdfUrl: 'https://drive.google.com/file/d/1S9DxvVIxPKXJNsfuXgs7n3DKr8esbGhl/view?usp=drive_link'
  },
  {
    id: '7',
    title: 'Marketing Management',
    author: 'Philip Kotler & Kevin Lane Keller',
    cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop',
    rating: 4.9,
    category: 'Management',
    pages: 816,
    description: 'The world-standard marketing management textbook covering brand strategy, market segmentation, and digital consumer behavior.',
    pdfUrl: 'https://drive.google.com/file/d/1UT9KIZcOXa6dmaHPx_QAVjiWdAKP1kAQ/view?usp=drive_link'
  },
  {
    id: '8',
    title: 'Corporate Finance & Valuation',
    author: 'Stephen Ross, Randolph Westerfield',
    cover: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1000&auto=format&fit=crop',
    rating: 4.7,
    category: 'Finance',
    pages: 1040,
    description: 'Emphasizes the modern fundamentals of the theory of finance, working capital management, and capital budgeting.',
    pdfUrl: 'https://drive.google.com/file/d/1v2DQHACYu9IdCCYXYmpKQGghPBi3WSam/view?usp=drive_link'
  },
  {
    id: '9',
    title: 'Data Structures and Algorithms in Java',
    author: 'Robert Lafore',
    cover: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    category: 'Computer Science',
    pages: 800,
    description: 'Covers essential data structures (trees, graphs, hash tables) and algorithm design techniques for technical interviews.',
    pdfUrl: 'https://drive.google.com/file/d/12pesuDYq2ZzUBvN236pUsJIbjz6cFMbq/view?usp=sharing'
  },
  {
    id: '10',
    title: 'Microelectronic Circuits',
    author: 'Adel S. Sedra & Kenneth C. Smith',
    cover: 'https://images.unsplash.com/photo-1517055727196-8800e2182046?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    category: 'Circuits',
    pages: 1472,
    description: 'The standard text for microelectronic circuit design, covering analog and digital devices.',
    pdfUrl: 'https://drive.google.com/file/d/1Ra2O97B3FqqQfsekrrRwuTnW50E_przv/view?usp=drive_link'
  },
  {
    id: '11',
    title: 'Digital Design',
    author: 'M. Morris Mano',
    cover: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1000&auto=format&fit=crop',
    rating: 4.7,
    category: 'Digital Systems',
    pages: 565,
    description: 'An introduction to digital design principles, logic gates, and hardware implementation.',
    pdfUrl: 'https://drive.google.com/file/d/1aGvTmFJ1T7dQTVWbqFeIpIzvX-Z1iTx1/view?usp=drive_link'
  },
  {
    id: '12',
    title: 'Principles of Electromagnetics',
    author: 'Matthew N. O. Sadiku',
    cover: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop',
    rating: 4.6,
    category: 'ECE',
    pages: 848,
    description: 'A textbook introducing electromagnetic wave propagation, transmission lines, and antenna systems.',
    pdfUrl: 'https://drive.google.com/file/d/1sclOYxeRCxTk07Gl-tDTrOx4_xdeHUBc/view?usp=drive_link'
  },
  {
    id: '13',
    title: 'Pharmaceutics: Drug Formulation',
    author: 'M.E. Aulton',
    cover: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1000&auto=format&fit=crop',
    rating: 4.8,
    category: 'Pharmaceutics',
    pages: 720,
    description: 'The definitive guide to the design, manufacture and testing of modern pharmaceutical dosage forms.',
    pdfUrl: 'https://drive.google.com/file/d/1qxX7hyyHKQIRGxmsS2jye9tmRi599hdd/view?usp=drive_link'
  },
  {
    id: '14',
    title: 'Pharmaceutical Microbiology',
    author: 'W.B. Hugo & A.D. Russell',
    cover: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=1000&auto=format&fit=crop',
    rating: 4.6,
    category: 'Pharmaceutics',
    pages: 560,
    description: 'Covers microbiological aspects of pharmaceuticals, from contamination control to sterile manufacturing.',
    pdfUrl: 'https://drive.google.com/file/d/1S9DxvVIxPKXJNsfuXgs7n3DKr8esbGhl/view?usp=drive_link'
  },
  {
    id: '15',
    title: 'Foye\'s Medicinal Chemistry',
    author: 'Thomas L. Lemke',
    cover: 'https://images.unsplash.com/photo-1576671081837-49000212a370?q=80&w=1000&auto=format&fit=crop',
    rating: 4.9,
    category: 'Pharmacology',
    pages: 1104,
    description: 'The gold standard reference for medicinal chemistry — drug design, structure-activity relationships, and mechanisms.',
    pdfUrl: 'https://drive.google.com/file/d/1UT9KIZcOXa6dmaHPx_QAVjiWdAKP1kAQ/view?usp=drive_link'
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

const COURSE_FILTERS = [
  { id: 'ALL', label: 'All Books', icon: 'auto-stories' },
  { id: 'COMMERCE', label: 'Commerce & MBA', icon: 'business-center', categories: ['Finance', 'Management', 'Entrepreneurship', 'Business', 'Marketing', 'Accounting', 'Economics'] },
  { id: 'TECH', label: 'CS & IT', icon: 'code', categories: ['Programming', 'Software Engineering', 'AI / ML', 'Computer Science', 'Design', 'Data Structures'] },
  { id: 'ENGINEERING', label: 'Core Engg', icon: 'memory', categories: ['Circuits', 'Digital Systems', 'ECE', 'Engineering', 'Electronics'] },
  { id: 'PHARMA', label: 'Pharmacy', icon: 'medication', categories: ['Pharmaceutics', 'Pharmacology'] },
  { id: 'MEDICAL', label: 'Medical (MBBS)', icon: 'local-hospital', categories: ['Medical', 'Anatomy', 'Physiology', 'Pathology'] },
];

const LibraryMainScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();

  const getInitialFilter = () => {
    if (!user) return 'ALL';
    if (isMedicalStudent(user)) return 'MEDICAL';
    const track = getStudentPlacementTrack(user);
    if (track === 'commerce_management') return 'COMMERCE';
    if (track === 'pharma_healthcare') return 'PHARMA';
    if (track === 'tech') return 'TECH';
    return 'ALL';
  };

  const [activeFilter, setActiveFilter] = React.useState(getInitialFilter());
  const [books, setBooks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchText, setSearchText] = React.useState('');

  const fetchBooks = React.useCallback(async (query = '') => {
    setLoading(true);
    const isMedStudent = isMedicalStudent(user) || (user?.course || '').toLowerCase().includes('mbbs') || (user?.category || '').toLowerCase().includes('medical');
    const parts = String(user?.rollno || user?.emp_id || '').split('/');
    const colgcd = parts.length >= 2 && parts[1] && parts[1] !== '0' ? parts[1] : (isMedStudent ? '11' : '2');

    try {
      const [backendRes, srmsRes] = await Promise.allSettled([
        accessToken ? getErpLibraryBooks(accessToken, query) : Promise.resolve([]),
        getEBooks(query, colgcd),
      ]);

      const backendBooks = backendRes.status === 'fulfilled' && Array.isArray(backendRes.value) ? backendRes.value : [];
      const srmsBooks = srmsRes.status === 'fulfilled' && Array.isArray(srmsRes.value) ? srmsRes.value : [];

      const mappedBackend = backendBooks.map((b, i) => ({
        id: String(b.id || `erp_${b.isbn || i}`),
        title: b.title || 'Academic Reference Book',
        author: b.author || b.publisher || 'ERP Library',
        cover: b.cover_url || b.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop',
        pdfUrl: b.ebook_url || b.pdfUrl,
        rating: b.rating || 4.8,
        category: b.category || 'General',
        pages: b.pages || 450,
        description: b.description || `Official library copy of ${b.title || 'resource'}.`,
        is_ebook: b.is_ebook,
        copies_available: b.copies_available,
      }));

      // Merge real ERP and SRMS library books
      const allBooks = [...mappedBackend, ...srmsBooks];
      const seen = new Set();
      const unique = [];
      for (const item of allBooks) {
        const key = (item.title || '').trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
      }

      setBooks(unique);
    } catch (err) {
      console.warn('[Library] Failed to fetch ebooks:', err);
    } finally {
      setLoading(false);
    }
  }, [user, accessToken]);

  React.useEffect(() => {
    fetchBooks('');
  }, [fetchBooks]);

  const filteredBooks = React.useMemo(() => {
    if (activeFilter === 'ALL') return books;
    const targetConfig = COURSE_FILTERS.find(f => f.id === activeFilter);
    if (!targetConfig || !targetConfig.categories) return books;
    const allowed = targetConfig.categories.map(c => c.toLowerCase());
    return books.filter(b => {
      const cat = (b.category || '').toLowerCase();
      return allowed.includes(cat);
    });
  }, [books, activeFilter]);

  const renderBook = ({ item }) => {
    const isBookUnlocked = true; // All ERP-synced e-books are unlocked for academic use
    return (
      <TouchableOpacity 
        style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          navigation.navigate('BookDetail', { book: item });
        }}
      >
        <BookCoverImage uri={item.cover} title={item.title} style={styles.bookCover} />
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
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); fetchBooks(''); }}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Course Filter Pills Bar */}
      <View style={{ marginBottom: 14 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={COURSE_FILTERS}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = activeFilter === item.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveFilter(item.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                <MaterialIcons
                  name={item.icon}
                  size={15}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? '#FFFFFF' : colors.textSecondary,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4338CA" />
          <Text style={{ marginTop: 12, color: colors.textSecondary, fontWeight: '600' }}>Fetching library e-books...</Text>
        </View>
      ) : filteredBooks.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Ionicons name="book-outline" size={48} color={colors.textMuted} />
          <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>No E-Books in this Category</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
            {searchText ? 'No matching books found for your search query.' : 'Try selecting "All Books" to view the full university collection.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
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
