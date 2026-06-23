import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getSuperAdminAnalytics } from '../../data/apiService';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../../components/SkeletonLoader';

const SuperAdminFacultyInsightsScreen = () => {
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
      console.warn('[FacultyInsights] Fetch error:', err);
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

  const fStats = data?.faculty || { active_count: 0, average_attendance: '0%', sessional_marks_upload_pct: 0, active_logins: 0, average_cgpa: 0.0, dept_attendance: [] };

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
          colors={isDark ? ['#065F46', '#0F172A'] : ['#E8F5E9', '#FFFFFF']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <Feather name="book-open" size={28} color="#10B981" />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Faculty & Academics</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Faculty portal & academic insights</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Faculty Metrics Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Faculty Portal Usage</Text>
        <View style={styles.grid}>
          <View style={[styles.gridCard, { backgroundColor: colors.card }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Feather name="users" size={24} color="#10B981" />
            </View>
            <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{fStats.active_count}</Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Active Faculty Members</Text>
          </View>

          <View style={[styles.gridCard, { backgroundColor: colors.card }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <MaterialCommunityIcons name="timeline-clock-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{fStats.average_attendance}</Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Avg Lecture Attendance</Text>
          </View>
        </View>

        {/* Portal Activity Snapshot */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Academic Operations</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Sessional Marks Upload Rate</Text>
            <Text style={[styles.metricVal, { color: '#10B981', fontWeight: '700' }]}>{fStats.sessional_marks_upload_pct}% Completed</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Daily Active Faculty Logins</Text>
            <Text style={[styles.metricVal, { color: colors.textPrimary }]}>{fStats.active_logins} / {fStats.active_count} Teachers</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Average Student CGPA</Text>
            <Text style={[styles.metricVal, { color: colors.textPrimary }]}>{fStats.average_cgpa.toFixed(2)} / 10.0</Text>
          </View>
        </View>

        {/* Attendance by Semester/Phase */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Participation by Department</Text>
        <View style={[styles.card, { backgroundColor: colors.card, marginBottom: 24 }]}>
          {fStats.dept_attendance && fStats.dept_attendance.length > 0 ? (
            fStats.dept_attendance.map((item, idx) => {
              const colorsList = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
              const barColor = colorsList[idx % colorsList.length];
              return (
                <View key={idx} style={idx > 0 ? { marginTop: 16 } : {}}>
                  <View style={styles.distRow}>
                    <Text style={[styles.distLabel, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.distVal, { color: colors.textSecondary }]}>{item.attendance}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${item.value}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={{ color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 }}>
              No department attendance logs found
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
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '500',
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

export default SuperAdminFacultyInsightsScreen;
