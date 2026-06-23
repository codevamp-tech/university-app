import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getSuperAdminAnalytics } from '../../data/apiService';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../../components/SkeletonLoader';

const SuperAdminVentureInsightsScreen = () => {
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
        <View style={[styles.header, { backgroundColor: colors.card, height: 110, justifyContent: 'center' }]}>
          <SkeletonBlock width={120} height={12} borderRadius={6} style={{ marginBottom: 8 }} />
          <SkeletonBlock width={180} height={18} borderRadius={9} />
        </View>

        <SkeletonBlock width={150} height={16} borderRadius={8} style={{ marginTop: 24, marginBottom: 16 }} />
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.card, gap: 12 }}>
          <SkeletonBlock width="100%" height={30} borderRadius={8} />
          <SkeletonBlock width="100%" height={30} borderRadius={8} />
          <SkeletonBlock width="100%" height={30} borderRadius={8} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (loading) {
    return renderSkeleton();
  }

  const vStats = data?.venture || { pitched_ideas: 0, pre_revenue: 0, seed: 0, series_a: 0, cofounder_requests_count: 0, dept_distribution: [] };
  const totalPitches = vStats.pitched_ideas + vStats.pre_revenue + vStats.seed + vStats.series_a;
  
  // Calculate relative percentages for funnel, capped at max 70% to leave room for descriptions
  const ideationPct = 70;
  const preRevPct = Math.max(Math.round((vStats.pre_revenue / Math.max(vStats.pitched_ideas, 1)) * 70), 45);
  const seedPct = Math.max(Math.round((vStats.seed / Math.max(vStats.pitched_ideas, 1)) * 70), 30);
  const seriesAPct = Math.max(Math.round((vStats.series_a / Math.max(vStats.pitched_ideas, 1)) * 70), 20);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header Block */}
        <LinearGradient
          colors={isDark ? ['#1E3A8A', '#0F172A'] : ['#EFF6FF', '#FFFFFF']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <MaterialCommunityIcons name="rocket-launch" size={28} color="#3B82F6" />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Venture & Innovation</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Strategic entrepreneurship insights</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Funnel Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Startup Stage Funnel</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Series A */}
          <View style={styles.funnelRow}>
            <View style={[styles.funnelBar, { width: `${seriesAPct}%`, backgroundColor: '#10B981' }]}>
              <Text style={styles.funnelBarText}>Series A: {vStats.series_a}</Text>
            </View>
            <Text style={[styles.funnelDesc, { color: colors.textSecondary }]}>Scale stage</Text>
          </View>

          {/* Seed Stage */}
          <View style={styles.funnelRow}>
            <View style={[styles.funnelBar, { width: `${seedPct}%`, backgroundColor: '#3B82F6' }]}>
              <Text style={styles.funnelBarText}>Seed Stage: {vStats.seed}</Text>
            </View>
            <Text style={[styles.funnelDesc, { color: colors.textSecondary }]}>Validating fit</Text>
          </View>

          {/* Pre-revenue */}
          <View style={styles.funnelRow}>
            <View style={[styles.funnelBar, { width: `${preRevPct}%`, backgroundColor: '#8B5CF6' }]}>
              <Text style={styles.funnelBarText}>Pre-Revenue: {vStats.pre_revenue}</Text>
            </View>
            <Text style={[styles.funnelDesc, { color: colors.textSecondary }]}>Prototyping</Text>
          </View>

          {/* Ideation */}
          <View style={styles.funnelRow}>
            <View style={[styles.funnelBar, { width: `${ideationPct}%`, backgroundColor: '#F59E0B' }]}>
              <Text style={styles.funnelBarText}>Ideation / Pitches: {vStats.pitched_ideas}</Text>
            </View>
            <Text style={[styles.funnelDesc, { color: colors.textSecondary }]}>Early concepts</Text>
          </View>
        </View>

        {/* Engagement Stats Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Engagement Metrics</Text>
        <View style={styles.grid}>
          <View style={[styles.gridCard, { backgroundColor: colors.card }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <MaterialCommunityIcons name="account-group" size={24} color="#3B82F6" />
            </View>
            <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{vStats.cofounder_requests_count}</Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Active Cofounder Match Requests</Text>
          </View>

          <View style={[styles.gridCard, { backgroundColor: colors.card }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color="#10B981" />
            </View>
            <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{vStats.pitched_ideas}</Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Pitch Decks Uploaded</Text>
          </View>
        </View>

        {/* Department Distribution */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Ideas by Department</Text>
        <View style={[styles.card, { backgroundColor: colors.card, marginBottom: 24 }]}>
          {vStats.dept_distribution && vStats.dept_distribution.length > 0 ? (
            vStats.dept_distribution.map((item, idx) => {
              const total = vStats.dept_distribution.reduce((acc, curr) => acc + curr.count, 0) || 1;
              const pct = Math.round((item.count / total) * 100);
              const colorsList = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];
              const barColor = colorsList[idx % colorsList.length];
              return (
                <View key={idx} style={idx > 0 ? { marginTop: 16 } : {}}>
                  <View style={styles.distRow}>
                    <Text style={[styles.distLabel, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.distVal, { color: colors.textSecondary }]}>{item.count} Startups ({pct}%)</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={{ color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 }}>
              No startups records in database
            </Text>
          )}
        </View>

        {/* Padding for absolute bottom tab bar */}
        <View style={{ height: 80 }} />
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
    paddingTop: 10,
  },
  header: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  funnelBar: {
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  funnelBarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  funnelDesc: {
    fontSize: 12,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardVal: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  distLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  distVal: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});

export default SuperAdminVentureInsightsScreen;
