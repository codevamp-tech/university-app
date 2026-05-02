import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Feather, MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const BookDetailScreen = ({ route, navigation }) => {
  const { book } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [fontSize, setFontSize] = React.useState(16);
  const [isReading, setIsReading] = React.useState(false);

  if (isReading) {
    return (
      <View style={[styles.readerContainer, { backgroundColor: isDark ? '#121212' : '#F9F7F2', paddingTop: insets.top }]}>
        <View style={styles.readerHeader}>
          <TouchableOpacity onPress={() => setIsReading(false)}>
            <Feather name="x" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.readerBookTitle, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>{book.title}</Text>
          <TouchableOpacity onPress={() => setFontSize(f => Math.min(f + 2, 24))}>
            <MaterialIcons name="format-size" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.readerContent}>
          <Text style={[styles.readerText, { fontSize, color: isDark ? '#E2E8F0' : '#2D3748' }]}>
            Chapter 1: The Beginning of Clean Code{"\n\n"}
            Software is everywhere. It powers our cars, our phones, and our infrastructure. But as software becomes more complex, the quality of the code that powers it becomes increasingly important. Clean code is not just code that works; it is code that is maintainable, readable, and elegant.{"\n\n"}
            Imagine you are reading a book. If the sentences are convoluted and the vocabulary is inconsistent, you will struggle to understand the message. The same is true for code. When you write clean code, you are writing for other human beings, not just for the machine.{"\n\n"}
            Clean code follows several principles. One of the most important is the Principle of Least Astonishment. This means that when another developer reads your code, they should not be surprised by what it does. The names of variables, functions, and classes should clearly communicate their purpose.{"\n\n"}
            Another principle is the Single Responsibility Principle. A function should do one thing, and it should do it well. Large, monolithic functions are difficult to test and even harder to debug. By breaking down your code into smaller, focused components, you make it more modular and easier to maintain.{"\n\n"}
            In the following chapters, we will explore many techniques for writing cleaner code. We will discuss naming conventions, function design, error handling, and the importance of testing. By the end of this book, you will have a deep understanding of what it means to write high-quality software.
          </Text>
        </ScrollView>
        <View style={styles.readerFooter}>
          <Text style={styles.pageProgress}>Page 12 of {book.pages}</Text>
          <View style={styles.progressBg}>
             <View style={[styles.progressFill, { width: '15%' }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: book.cover }} style={styles.coverImage} />
          <LinearGradient 
            colors={['transparent', 'rgba(0,0,0,0.8)']} 
            style={styles.gradient} 
          />
          <TouchableOpacity 
            style={[styles.backBtn, { top: insets.top + 10 }]} 
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{book.title}</Text>
            <Text style={[styles.author, { color: colors.textSecondary }]}>{book.author}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <FontAwesome name="star" size={16} color="#F59E0B" />
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{book.rating}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{book.pages}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pages</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{book.category.split(' ')[0]}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Type</Text>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About the Book</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{book.description}</Text>
          </View>

          <TouchableOpacity style={styles.readBtn} onPress={() => setIsReading(true)}>
            <LinearGradient colors={['#4338CA', '#312E81']} style={styles.readBtnGradient}>
              <Feather name="book-open" size={20} color="#FFFFFF" />
              <Text style={styles.readBtnText}>Start Reading</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageContainer: { width: width, height: height * 0.5 },
  coverImage: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
  backBtn: { position: 'absolute', left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  content: { marginTop: -40, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30 },
  titleSection: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  author: { fontSize: 18, fontWeight: '600', opacity: 0.7 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', padding: 20, borderRadius: 24, marginBottom: 30 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.1)' },
  descriptionSection: { marginBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  readBtn: { borderRadius: 20, overflow: 'hidden' },
  readBtnGradient: { height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  readBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },

  // Reader Styles
  readerContainer: { flex: 1 },
  readerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  readerBookTitle: { flex: 1, marginHorizontal: 20, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  readerContent: { padding: 30 },
  readerText: { lineHeight: 28, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  readerFooter: { padding: 20, alignItems: 'center' },
  pageProgress: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 10 },
  progressBg: { width: '80%', height: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#4338CA', borderRadius: 2 },
});

export default BookDetailScreen;
