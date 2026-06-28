import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getSuperAdminAnalytics, getAllStudents } from '../../data/apiService';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../../components/SkeletonLoader';

const SuperAdminLeaderboardInsightsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      if (accessToken) {
        const [stats, list] = await Promise.all([
          getSuperAdminAnalytics(accessToken),
          getAllStudents(accessToken)
        ]);
        if (stats) setData(stats);
        if (list) {
          const mapped = list.map(s => ({
            id: s.rollno || s.username || s.id,
            name: s.full_name || s.username || 'Student',
            course: s.course,
            branch: s.branch,
            cgpa: s.cgpa || 0,
            attendance: s.attendance || 0,
            certsDone: s.certificates_done || [],
            certsInProgress: s.certificates_in_progress || [],
            leadership: [],
            extracurricular: [],
            gender: 'M',
            avatar_url: s.avatar_url,
          }));
          setStudents(mapped);
        }
      }
    } catch (err) {
      console.warn('[LeaderboardInsights] Fetch error:', err);
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (loading) {
    return renderSkeleton();
  }

  const lStats = data?.leaderboard || { top_dept: 'Medical', avg_social_credits: 0, rewards_claimed: 0 };

  // Only include Medical students
  const medicalStudents = students.filter(s => s.category === 'medical');

  // Compute leaderboard scores for medical students only
  const computedLeaderboard = medicalStudents.map(s => {
    const certCount = (s.certsDone || []).filter(c => {
      const cl = c.toLowerCase();
      return cl !== 'yes' && cl !== 'no' && cl !== 'na' && cl !== 'n/a' && cl !== 'none' && cl !== '';
    }).length;

    const leadCount = (s.leadership || []).filter(c => c && c.toLowerCase() !== 'no' && c.toLowerCase() !== 'na' && c.toLowerCase() !== 'n/a' && c.toLowerCase() !== 'none').length;
    const extraCount = (s.extracurricular || []).filter(c => c && c.toLowerCase() !== 'no' && c.toLowerCase() !== 'na' && c.toLowerCase() !== 'n/a' && c.toLowerCase() !== 'none').length;
    const cgpaVal = Math.min(s.cgpa > 10 ? s.cgpa / 10 : s.cgpa, 10.0);
    const academicScore = Math.round(cgpaVal * 200) + Math.round((s.attendance || 0) * 5);
    const hasAmbassador = (s.leadership || []).some(l => l && (l.toLowerCase().includes('ambassador') || l.toLowerCase().includes('ambassasor')));
    const ambassadorBonus = hasAmbassador ? 5000 : 0;
    const totalScore = (certCount * 500) + (extraCount * 500) + (leadCount * 1000) + academicScore + ambassadorBonus;

    let avatar = s.avatar_url || null;

    return {
      id: s.id,
      name: s.name,
      score: totalScore,
      avatar,
      course: s.course,
      branch: s.branch,
    };
  });

  // Sort by score descending
  computedLeaderboard.sort((a, b) => b.score - a.score);

  // Assign ranks
  computedLeaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  const displayLeaderboard = computedLeaderboard.slice(0, 10);

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
          colors={isDark ? ['#1E3A8A', '#0F172A'] : ['#FEF3C7', '#FFFFFF']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            {navigation && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                <Feather name="arrow-left" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
            <MaterialCommunityIcons name="trophy" size={28} color="#FBBF24" />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>The Hustle Leaderboard</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Medical students — gamification insights</Text>
            </View>
          </View>
        </LinearGradient>



        {/* Dynamic Leaderboard matching student design */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Medical Student Standings</Text>
        <View style={[styles.leaderboardCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          {displayLeaderboard.length === 0 ? (
            <Text style={{ padding: 16, textAlign: 'center', color: colors.textSecondary }}>No student leaderboard data found.</Text>
          ) : (
            displayLeaderboard.map((item, index) => (
              <View key={item.id || index.toString()} style={[
                styles.boardItem,
                index === displayLeaderboard.length - 1 && { borderBottomWidth: 0 },
                { borderBottomColor: colors.border }
              ]}>
                <View style={[styles.boardItemLeft, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.boardRank, { color: colors.textMuted }, item.rank <= 3 && { color: '#EA580C' }]}>{item.rank}</Text>
                  <Image source={{ uri: item.avatar }} style={styles.boardAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.boardName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary || '#6B7280' }} numberOfLines={1}>
                      {item.course || ''} {item.branch || ''}
                    </Text>
                  </View>
                </View>
                <View style={[styles.scorePill, { backgroundColor: colors.border }]}>
                  <Text style={[styles.scorePillText, { color: colors.textSecondary }]}>
                    {item.score.toLocaleString()} pts
                  </Text>
                </View>
              </View>
            ))
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
  leaderboardCard: {
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  boardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  boardItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boardRank: {
    width: 24,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  boardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginHorizontal: 12,
  },
  boardName: {
    fontSize: 16,
    fontWeight: '800',
  },
  scorePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scorePillText: {
    fontSize: 13,
    fontWeight: '800',
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

export default SuperAdminLeaderboardInsightsScreen;
