import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getSuperAdminAnalytics } from '../../data/apiService';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');

const SuperAdminVentureInsightsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      if (accessToken) {
        const stats = await getSuperAdminAnalytics(accessToken);
        if (stats) setData(stats);
      }
    } catch (err) {
      console.warn('[VentureInsights] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderSkeleton = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: colors.card, height: 130, justifyContent: 'center' }]}>
          <SkeletonBlock width={120} height={12} borderRadius={6} style={{ marginBottom: 8 }} />
          <SkeletonBlock width={180} height={18} borderRadius={9} />
        </View>

        <SkeletonBlock width={150} height={16} borderRadius={8} style={{ marginTop: 24, marginBottom: 16 }} />
        <View style={{ padding: 16, borderRadius: 20, backgroundColor: colors.card, gap: 16 }}>
          <SkeletonBlock width="100%" height={40} borderRadius={10} />
          <SkeletonBlock width="100%" height={40} borderRadius={10} />
          <SkeletonBlock width="100%" height={40} borderRadius={10} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (loading) {
    return renderSkeleton();
  }

  const vStats = data?.venture || { pitched_ideas: 0, pre_revenue: 0, seed: 0, series_a: 0, cofounder_requests_count: 0, dept_distribution: [] };
  const totalPitches = vStats.pitched_ideas + vStats.pre_revenue + vStats.seed + vStats.series_a;
  
  // Funnel logic
  const maxBarWidth = 75;
  const ideationPct = maxBarWidth;
  const preRevPct = Math.max(Math.round((vStats.pre_revenue / Math.max(vStats.pitched_ideas, 1)) * maxBarWidth), 55);
  const seedPct = Math.max(Math.round((vStats.seed / Math.max(vStats.pitched_ideas, 1)) * maxBarWidth), 40);
  const seriesAPct = Math.max(Math.round((vStats.series_a / Math.max(vStats.pitched_ideas, 1)) * maxBarWidth), 25);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header Block */}
        <LinearGradient
          colors={isDark ? ['#1e1b4b', '#312e81', '#1e3a8a'] : ['#f0f9ff', '#e0f2fe', '#bae6fd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { shadowColor: isDark ? '#000' : '#3B82F6' }]}
        >
          <View style={styles.headerTop}>
            {navigation && (
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)' }]}
              >
                <Feather name="arrow-left" size={20} color={isDark ? '#fff' : '#1e3a8a'} />
              </TouchableOpacity>
            )}
            <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#fff' }]}>
              <MaterialCommunityIcons name="rocket-launch" size={26} color={isDark ? '#60a5fa' : '#3B82F6'} />
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.title, { color: isDark ? '#fff' : '#1e3a8a' }]}>Venture & Innovation</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#93c5fd' : '#3b82f6' }]}>Strategic entrepreneurship insights & funnel</Text>
          </View>
        </LinearGradient>

        {/* Funnel Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Startup Stage Funnel</Text>
          <Feather name="bar-chart-2" size={18} color={colors.textSecondary} />
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          {/* Series A */}
          <View style={styles.funnelRow}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.funnelBar, { width: `${seriesAPct}%` }]}
            >
              <Text style={styles.funnelBarText}>Series A</Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{vStats.series_a}</Text>
              </View>
            </LinearGradient>
            <Text style={[styles.funnelDesc, { color: colors.textSecondary }]}>Scale stage</Text>
          </View>

          {/* Seed Stage */}
          <View style={styles.funnelRow}>
            <LinearGradient
               colors={['#3B82F6', '#2563EB']}
               start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
               style={[styles.funnelBar, { width: `${seedPct}%` }]}
            >
              <Text style={styles.funnelBarText}>Seed Stage</Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{vStats.seed}</Text>
              </View>
            </LinearGradient>
            <Text style={[styles.funnelDesc, { color: colors.textSecondary }]}>Validating fit</Text>
          </View>

          {/* Pre-revenue */}
          <View style={styles.funnelRow}>
            <LinearGradient
               colors={['#8B5CF6', '#7C3AED']}
               start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
               style={[styles.funnelBar, { width: `${preRevPct}%` }]}
            >
              <Text style={styles.funnelBarText}>Pre-Revenue</Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{vStats.pre_revenue}</Text>
              </View>
            </LinearGradient>
            <Text style={[styles.funnelDesc, { color: colors.textSecondary }]}>Prototyping</Text>
          </View>

          {/* Ideation */}
          <View style={[styles.funnelRow, { marginBottom: 0 }]}>
            <LinearGradient
               colors={['#F59E0B', '#D97706']}
               start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
               style={[styles.funnelBar, { width: `${ideationPct}%` }]}
            >
              <Text style={styles.funnelBarText}>Ideation / Pitches</Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{vStats.pitched_ideas}</Text>
              </View>
            </LinearGradient>
            <Text style={[styles.funnelDesc, { color: colors.textSecondary }]}>Early concepts</Text>
          </View>
        </View>

        {/* Engagement Stats Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Engagement Metrics</Text>
          <Feather name="activity" size={18} color={colors.textSecondary} />
        </View>
        <View style={styles.grid}>
          <View style={[styles.gridCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <LinearGradient colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']} style={styles.iconBox}>
              <MaterialCommunityIcons name="account-group" size={26} color="#3B82F6" />
            </LinearGradient>
            <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{vStats.cofounder_requests_count}</Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Active Cofounder Match Requests</Text>
          </View>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => navigation.navigate('SuperAdminDrilldown', { category: 'ventures', title: 'Submitted Pitch Decks' })}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']} style={styles.iconBox}>
              <MaterialCommunityIcons name="file-document-outline" size={26} color="#10B981" />
            </LinearGradient>
            <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{vStats.pitched_ideas}</Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Total Pitch Decks Uploaded</Text>
          </TouchableOpacity>
        </View>

        {/* Department Distribution */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Ideas by Department</Text>
          <Feather name="pie-chart" size={18} color={colors.textSecondary} />
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow, marginBottom: 30 }]}>
          {vStats.dept_distribution && vStats.dept_distribution.length > 0 ? (
            vStats.dept_distribution.map((item, idx) => {
              const total = vStats.dept_distribution.reduce((acc, curr) => acc + curr.count, 0) || 1;
              const pct = Math.round((item.count / total) * 100);
              const gradients = [
                ['#60A5FA', '#2563EB'],
                ['#A78BFA', '#7C3AED'],
                ['#34D399', '#059669'],
                ['#FBBF24', '#D97706'],
                ['#F472B6', '#DB2777']
              ];
              const barGradient = gradients[idx % gradients.length];
              
              return (
                <View key={idx} style={idx > 0 ? { marginTop: 20 } : {}}>
                  <View style={styles.distRow}>
                    <Text style={[styles.distLabel, { color: colors.textPrimary }]}>{item.name}</Text>
                    <View style={styles.distBadge}>
                      <Text style={[styles.distVal, { color: barGradient[0] }]}>{item.count} Startups ({pct}%)</Text>
                    </View>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                    <LinearGradient
                      colors={barGradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.progressBar, { width: `${pct}%` }]} 
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="folder-open-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: 12 }}>
                No startups records in database
              </Text>
            </View>
          )}
        </View>

        {/* Padding for absolute bottom tab bar */}
        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
    opacity: 0.9,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  funnelBar: {
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 6,
  },
  funnelBarText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  funnelDesc: {
    fontSize: 12,
    fontWeight: '600',
    width: 80,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  gridCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardVal: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  cardLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  distLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  distBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  distVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  }
});

export default SuperAdminVentureInsightsScreen;
