import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator, TextInput, Animated
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listJournalAPI } from '../../../data/apiService';
import { useUser } from '../../../context/UserContext';
import { APP_CONFIG } from '../../../config/appConfig';
import { useTheme } from '../../../hooks/useTheme';
import { getAvatarUrl } from '../../../utils/avatar';

const { width } = Dimensions.get('window');
const JournalSkeleton = () => {
  const animValue = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ marginBottom: 24, paddingHorizontal: 16 }}>
      <Animated.View style={{ width: 100, height: 24, backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: 12, opacity: animValue }} />
      <View style={styles.photoCard}>
        <Animated.View style={{ height: 200, backgroundColor: '#E5E7EB', borderTopLeftRadius: 20, borderTopRightRadius: 20, opacity: animValue }} />
        <View style={styles.cardInfo}>
          <Animated.View style={{ width: 80, height: 24, backgroundColor: '#E5E7EB', borderRadius: 12, marginBottom: 12, opacity: animValue }} />
          <Animated.View style={{ width: '100%', height: 16, backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: 8, opacity: animValue }} />
          <Animated.View style={{ width: '80%', height: 16, backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: 16, opacity: animValue }} />
          <View style={styles.footerRow}>
            <Animated.View style={{ width: 60, height: 16, backgroundColor: '#E5E7EB', borderRadius: 4, opacity: animValue }} />
            <Animated.View style={{ width: 80, height: 16, backgroundColor: '#E5E7EB', borderRadius: 4, opacity: animValue }} />
          </View>
        </View>
      </View>
    </View>
  );
};

const CampusJournalFeedScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, accessToken } = useUser();
  const { colors, isDark } = useTheme();
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadEntries = async () => {
        try {
          // Use accessToken from UserContext directly.
          // NOTE: for students, accessToken lives on the context object, NOT on user.accessToken.
          // user.accessToken is only set for faculty. Using the wrong key or wrong source
          // causes a null token → 401 → false "session expired" logout.
          const token = accessToken || await AsyncStorage.getItem('@access_token');
          if (!token) {
            // No token at all — load from local storage only, don't call API
            const stored = await AsyncStorage.getItem('@unicampus_campus_journal');
            setEntries(stored ? JSON.parse(stored) : []);
            setLoading(false);
            return;
          }
          const res = await listJournalAPI(token);
          if (res) {
            // Map backend fields to frontend fields
            const mapped = res.map(e => ({
              ...e,
              date: e.created_at,
              images: e.image_urls || [],
            }));
            setEntries(mapped);
          } else {
            // Fallback to local storage if API fails or offline
            const stored = await AsyncStorage.getItem('@unicampus_campus_journal');
            if (stored) {
              setEntries(JSON.parse(stored));
            } else {
              setEntries([]);
            }
          }
        } catch (error) {
          console.error('Failed to load journal entries', error);
          const stored = await AsyncStorage.getItem('@unicampus_campus_journal');
          if (stored) setEntries(JSON.parse(stored));
        } finally {
          setLoading(false);
        }
      };
      loadEntries();
    }, [accessToken])
  );

  const renderImages = (images) => {
    if (!images || images.length === 0) return null;

    if (images.length === 1) {
      return (
        <Image source={{ uri: images[0] }} style={styles.largeImg} />
      );
    }
    if (images.length === 2) {
      return (
        <View style={styles.masonryGrid}>
          <Image source={{ uri: images[0] }} style={styles.masonryLarge} />
          <Image source={{ uri: images[1] }} style={styles.masonrySmall} />
        </View>
      );
    }
    // 3 or more images: Bento style
    return (
      <View style={styles.bentoGrid}>
        <Image source={{ uri: images[0] }} style={styles.bentoMainImg} />
        <View style={styles.bentoRightCol}>
          <Image source={{ uri: images[1] }} style={styles.bentoSideImg} />
          {images[2] ? (
            <Image source={{ uri: images[2] }} style={[styles.bentoSideImg, { marginTop: 4 }]} />
          ) : null}
        </View>
      </View>
    );
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const textMatch = entry.text && entry.text.toLowerCase().includes(query);
    const locMatch = entry.location && entry.location.toLowerCase().includes(query);
    const moodMatch = entry.mood && entry.mood.toLowerCase().includes(query);
    const tagMatch = entry.tags && entry.tags.some(t => t.toLowerCase().includes(query));
    return textMatch || locMatch || moodMatch || tagMatch;
  });


  const renderItem = ({ item, index }) => {
    const dateLabel = formatDate(item.date);
    const showHeader = index === 0 || formatDate(filteredEntries[index - 1].date) !== dateLabel;

    return (
      <React.Fragment>
        {showHeader && (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              {new Date(item.date).toDateString() === new Date().toDateString() ? 'Today' : dateLabel}
            </Text>
            <View style={[styles.sectionLine, { backgroundColor: isDark ? colors.border : '#e6e8ea' }]} />
            <Text style={[styles.sectionDate, { color: colors.textSecondary }]}>{dateLabel}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.photoCard, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('JournalDetail', { entry: item })}
        >
          {renderImages(item.images)}
          
          <View style={styles.cardInfo}>
            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: isDark ? colors.background : '#cbceff' }]}><Text style={[styles.tagText, { color: isDark ? colors.textPrimary : '#343d96' }]}>{item.mood}</Text></View>
              {item.tags && item.tags.map((tag, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: isDark ? colors.background : '#E0F2FE' }]}>
                  <Text style={[styles.tagText, { color: isDark ? colors.textPrimary : '#0369A1' }]}>#{tag}</Text>
                </View>
              ))}
            </View>
            {item.text ? (
              <Text style={[styles.entryText, { color: colors.textPrimary }]}>{item.text}</Text>
            ) : null}
            <View style={styles.footerRow}>
              <View style={styles.footerItem}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.footerText}>{formatDate(item.date)} • {formatTime(item.date)}</Text>
              </View>
              <View style={styles.footerItem}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.footerText}>{item.location || 'Campus'}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </React.Fragment>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: isDark ? colors.card : 'rgba(255,255,255,0.8)' }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('StudentMain')} style={{ marginRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Image
            source={{ uri: getAvatarUrl(user?.avatar_url || user?.name) }}
            style={[styles.profilePic, { borderColor: colors.primary }]}
          />
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Campus Journal</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: colors.background }]} onPress={() => setIsSearching(!isSearching)}>
            <Ionicons name={isSearching ? "close" : "search"} size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {isSearching && (
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textMuted || "#9CA3AF"} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search journals, tags, or locations..."
            placeholderTextColor={colors.textMuted || "#9CA3AF"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {loading ? (
        <View style={{ marginTop: 24 }}>
          <JournalSkeleton />
          <JournalSkeleton />
          <JournalSkeleton />
        </View>
      ) : filteredEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="notebook-edit-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {searchQuery ? "No entries found." : "Your journal is empty."}
          </Text>
          <Text style={styles.emptySubText}>
            {searchQuery ? "Try a different search term." : "Tap the + button below to write your first reflection."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          ListFooterComponent={<View style={{ height: 120 }} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: 100 }]}
        onPress={() => navigation.navigate('JournalReflect')}
      >
        <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.fabGradient}>
          <MaterialIcons name="add" size={32} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fe9832',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4953ac',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    height: 48,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4953ac',
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e6e8ea',
    borderRadius: 1,
  },
  sectionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#595c5d',
  },
  bentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bentoGrid: {
    flexDirection: 'row',
    height: 300,
  },
  bentoMainImg: {
    flex: 2,
    height: '100%',
  },
  bentoRightCol: {
    flex: 1,
    paddingLeft: 4,
  },
  bentoSideImg: {
    flex: 1,
    width: '100%',
  },
  cardInfo: {
    padding: 20,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#cbceff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#343d96',
  },
  entryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c2f30',
    lineHeight: 24,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  aiCard: {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
  },
  aiIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4953ac',
    marginBottom: 4,
  },
  aiText: {
    fontSize: 13,
    color: '#595c5d',
    lineHeight: 18,
  },
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  largeImg: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  masonryGrid: {
    flexDirection: 'row',
    gap: 4,
    padding: 8,
    height: 200,
  },
  masonryLarge: {
    flex: 2,
    height: '100%',
    borderRadius: 12,
  },
  masonrySmall: {
    flex: 1,
    height: '100%',
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  bottomBarInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  navTextActive: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default CampusJournalFeedScreen;
