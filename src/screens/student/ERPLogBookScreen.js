import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  TextInput, Dimensions, Animated, Platform, ActivityIndicator
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getLogbook } from '../../data/apiService';

const { width } = Dimensions.get('window');

// ─── Attempt Badge ─────────────────────────────────────────────────────────────
const AttemptBadge = ({ val }) => {
  let bg = '#F3F4F6';
  let color = '#9CA3AF';
  if (val === 'C') {
    bg = '#D1FAE5';
    color = '#059669';
  } else if (val === 'M') {
    bg = '#FEF3C7';
    color = '#D97706';
  } else if (val === 'F') {
    bg = '#FEE2E2';
    color = '#DC2626';
  } else if (val === 'B') {
    bg = '#FCE7F3';
    color = '#DB2777';
  } else if (val === 'Re') {
    bg = '#F3E8FF';
    color = '#7C3AED';
  } else if (val === 'P') {
    bg = '#D1FAE5';
    color = '#059669';
  } else if (val === 'A') {
    bg = '#E2E8F0';
    color = '#475569';
  }
  return (
    <View style={{ paddingHorizontal: 6, height: 28, minWidth: 28, borderRadius: 8, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color }}>{val}</Text>
    </View>
  );
};

// ─── Skeleton Loader ────────────────────────────────────────────────────────────
const SkeletonBlock = ({ width, height, borderRadius, style }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#E2E8F0', opacity: pulseAnim }, style]} />
  );
};

const LogBookSkeleton = ({ colors }) => (
  <View style={{ gap: 16, padding: 16 }}>
    {/* Summary Card Skeleton */}
    <View style={[styles.summaryCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]} />
    {/* Filter Row Skeleton */}
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <SkeletonBlock width={80} height={32} borderRadius={16} />
      <SkeletonBlock width={100} height={32} borderRadius={16} />
      <SkeletonBlock width={100} height={32} borderRadius={16} />
    </View>
    {/* List Cards Skeleton */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={[styles.logbookCardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBlock width="80%" height={16} borderRadius={4} />
            <SkeletonBlock width={80} height={12} borderRadius={4} />
          </View>
          <SkeletonBlock width={60} height={20} borderRadius={10} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <SkeletonBlock width={30} height={30} borderRadius={6} />
          <SkeletonBlock width={30} height={30} borderRadius={6} />
          <SkeletonBlock width={30} height={30} borderRadius={6} />
          <View style={{ flex: 1, gap: 4, marginLeft: 12 }}>
            <SkeletonBlock width="40%" height={10} borderRadius={3} />
            <SkeletonBlock width="70%" height={14} borderRadius={4} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

const ERPLogBookScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();

  const [logbook, setLogbook] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, VERIFIED, PENDING

  const loadLogbook = async (showLoading = true) => {
    if (!accessToken) return;
    if (showLoading) setLoading(true);
    try {
      const data = await getLogbook(accessToken);
      if (data) {
        setLogbook(data);
      }
    } catch (err) {
      console.warn('[LogBookScreen] Error loading logbook:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogbook();
  }, [accessToken]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLogbook(false);
  };

  const filteredLogbook = logbook.filter(entry => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      (entry.activity && entry.activity.toLowerCase().includes(q)) ||
      (entry.competency && entry.competency.toLowerCase().includes(q)) ||
      (entry.faculty && entry.faculty.toLowerCase().includes(q))
    );

    if (activeFilter === 'VERIFIED') {
      return matchesSearch && entry.verified;
    }
    if (activeFilter === 'PENDING') {
      return matchesSearch && !entry.verified;
    }
    return matchesSearch;
  });

  const verifiedCount = logbook.filter(e => e.verified).length;
  const totalCount = logbook.length;
  const progressPct = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('ERPHome')} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>UG Log book</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Clinical Rotations & Competencies</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => loadLogbook(true)} style={[styles.syncBtn, { backgroundColor: colors.card }]}>
          <Feather name="refresh-cw" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <LogBookSkeleton colors={colors} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
        >
          {/* Progress Card */}
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={isDark ? ['#0F766E', '#115E59'] : ['#14B8A6', '#0F766E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.statsCard}
            >
              <View style={styles.statsTop}>
                <View style={styles.statsSummary}>
                  <Text style={styles.statsVal}>{verifiedCount}/{totalCount}</Text>
                  <Text style={styles.statsLabel}>Verified Competencies</Text>
                </View>
                <View style={styles.progressCircleContainer}>
                  <Text style={styles.progressCircleText}>{progressPct}%</Text>
                </View>
              </View>

              <View style={styles.progressBarWrapper}>
                <View style={[styles.progressBarTrack, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <View style={[styles.progressBarFill, { width: `${progressPct}%`, backgroundColor: '#FFF' }]} />
                </View>
                <View style={styles.progressFooter}>
                  <Text style={styles.progressLimitText}>NMC Criteria: 75% for exam eligibility</Text>
                  <Text style={styles.progressTargetText}>Target: {progressPct >= 75 ? 'Achieved ✓' : 'Short'}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Search bar & Filters */}
          <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 12 }}>
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
              <TextInput
                placeholder="Search activity, competency or faculty..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter pills */}
            <View style={styles.filtersContainer}>
              {[
                ['ALL', 'All Activities'],
                ['VERIFIED', 'Verified Only'],
                ['PENDING', 'Pending Only']
              ].map(([key, label]) => {
                const isActive = activeFilter === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setActiveFilter(key)}
                    style={[
                      styles.filterPill,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                  >
                    <Text style={[styles.filterText, { color: colors.textSecondary }, isActive && { color: '#FFF', fontWeight: '800' }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Logbook entries list */}
          <View style={{ padding: 16, gap: 12 }}>
            {filteredLogbook.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="hospital-box-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No entries found</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Your clinical postings and logbook entries will sync once verified by the faculty desk.
                </Text>
              </View>
            ) : (
              filteredLogbook.map((entry, i) => (
                <View key={i} style={[styles.logbookCard, { backgroundColor: colors.card, borderColor: entry.verified ? '#86EFAC' : colors.border }]}>
                  <View style={styles.logbookTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.logbookActivity, { color: colors.textPrimary }]}>{entry.activity}</Text>
                      <View style={[styles.logCompBadge, { backgroundColor: isDark ? 'rgba(20,184,166,0.1)' : '#CCFBF1' }]}>
                        <Text style={[styles.logCompText, { color: '#14B8A6' }]}>{entry.competency}</Text>
                      </View>
                    </View>
                    <View style={[styles.verifiedBadge, { backgroundColor: entry.verified ? '#D1FAE5' : isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                      <MaterialIcons name={entry.verified ? 'verified' : 'pending'} size={14} color={entry.verified ? '#059669' : '#9CA3AF'} />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: entry.verified ? '#059669' : '#9CA3AF', marginLeft: 4 }}>
                        {entry.verified ? 'Verified' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.logbookAttempts}>
                    {['a1', 'a2', 'a3'].map((a, ai) => (
                      <View key={ai} style={{ alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>A{ai + 1}</Text>
                        <AttemptBadge val={entry[a] || '-'} />
                      </View>
                    ))}
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>Faculty Sign-off</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 2 }}>{entry.faculty}</Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>Date: {entry.date}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  statsContainer: { paddingHorizontal: 16, marginTop: 16 },
  statsCard: {
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  statsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsSummary: { gap: 4 },
  statsVal: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  statsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  progressCircleContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleText: { fontSize: 14, fontWeight: '900', color: '#FFF' },
  progressBarWrapper: { marginTop: 18 },
  progressBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLimitText: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  progressTargetText: { fontSize: 10, color: '#FFF', fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterText: { fontSize: 11, fontWeight: '600' },
  emptyCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 20,
  },
  emptyText: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  logbookCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  logbookTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logbookActivity: { fontSize: 14, fontWeight: '800', lineHeight: 20, marginBottom: 6 },
  logCompBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  logCompText: { fontSize: 10, fontWeight: '800' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logbookAttempts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156,163,175,0.1)',
    paddingTop: 12,
  },
  summaryCardSkeleton: {
    height: 120,
    borderRadius: 24,
    borderWidth: 1,
  },
  logbookCardSkeleton: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  }
});

export default ERPLogBookScreen;
