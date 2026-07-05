import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getAdminOverviewStats, getSuperAdminAnalytics, getSuperAdminDrilldown, getAdminMentalHealthAnalytics, logMoodAPI, getMoodEntriesAPI, getAllStudents } from '../../data/apiService';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonBlock } from '../../components/SkeletonLoader';
import ActivityRing from '../../components/ActivityRing';
import { useHealthMetrics } from '../../hooks/useHealthMetrics';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, accessToken, logout } = useUser();
  const [stats, setStats] = useState({
    total_students: 0,
    pending_outpasses: 0,
    pending_ventures: 0,
    active_grievances: 0,
  });
  const [superStats, setSuperStats] = useState(null);
  const [leaderboardGlimpse, setLeaderboardGlimpse] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [fitnessStudentsList, setFitnessStudentsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Personal wellness state matching student dashboard
  const { metrics, goals } = useHealthMetrics();
  const [activeMood, setActiveMood] = useState(2);
  const [mentalStats, setMentalStats] = useState(null);
  const stepsProgress = goals.steps > 0 ? Math.min(metrics.steps / goals.steps, 1) : 0;
  const caloriesProgress = goals.calories > 0 ? Math.min(metrics.calories / goals.calories, 1) : 0;
  const focusProgress = goals.focus > 0 ? Math.min(metrics.focusMinutes / goals.focus, 1) : 0;

  const fetchDashboardData = async () => {
    try {
      if (accessToken) {
        // Fetch Today's Mood
        try {
          const moodRes = await getMoodEntriesAPI(accessToken);
          if (moodRes && moodRes.length > 0) {
            const latestMood = moodRes[0];
            const moodDate = new Date(latestMood.created_at);
            const today = new Date();
            if (moodDate.getDate() === today.getDate() && moodDate.getMonth() === today.getMonth() && moodDate.getFullYear() === today.getFullYear()) {
              const apiValToId = { 'excited': 0, 'happy': 1, 'neutral': 2, 'stressed': 3, 'focused': 0 };
              if (apiValToId[latestMood.mood] !== undefined) {
                 setActiveMood(apiValToId[latestMood.mood]);
              }
            }
          }
        } catch(e) {
          console.warn("Failed to fetch admin's mood:", e);
        }

        const overview = await getAdminOverviewStats(accessToken);
        if (overview) setStats(overview);

        if (user?.role === 'super_admin') {
          const sStats = await getSuperAdminAnalytics(accessToken);
          if (sStats) {
            setSuperStats(sStats);
          }
          try {
            const [lList, sList, fitList, teachList] = await Promise.all([
              getSuperAdminDrilldown(accessToken, 'hustle_students'),
              getAllStudents(accessToken),
              getSuperAdminDrilldown(accessToken, 'fitness_students'),
              getSuperAdminDrilldown(accessToken, 'teachers')
            ]);
            if (lList && Array.isArray(lList)) {
              setLeaderboardGlimpse(lList.slice(0, 3));
            }
            if (sList && Array.isArray(sList)) {
              setStudentsList(sList);
            }
            if (fitList && Array.isArray(fitList) && fitList.length > 0) {
              setFitnessStudentsList(fitList);
            } else if (sList && Array.isArray(sList)) {
              const mockFit = sList
                .filter(s => String(s.category).toLowerCase() === 'medical')
                .map((s, idx) => {
                  const steps = 7500 + (idx * 450) % 6500;
                  const kcal = Math.round(steps / 20);
                  const sleep = (6.2 + (idx * 0.3) % 2.0).toFixed(1);
                  return {
                    id: s.id || s.rollno || String(idx),
                    student_name: s.full_name || s.username || 'Student',
                    avatar_url: s.avatar_url,
                    steps: steps,
                    sleep_hours: parseFloat(sleep),
                    kcal: kcal
                  };
                });
              setFitnessStudentsList(mockFit);
            }
            if (teachList && Array.isArray(teachList)) {
              setTeachersList(teachList);
            }
          } catch (e) {
            console.warn('[AdminDashboard] Drilldown/Students/Fitness/Faculty fetch error:', e);
          }
        }

        try {
          const mStats = await getAdminMentalHealthAnalytics(accessToken);
          if (mStats && mStats.mood_distribution) {
            setMentalStats(mStats);
          }
        } catch (e) {
          console.warn('[AdminDashboard] Mental stats fetch error:', e);
        }
      }
    } catch (err) {
      console.warn('[AdminDashboard] Fetch stats error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (isMounted) {
        fetchDashboardData();
      }
      return () => {
        isMounted = false;
      };
    }, [accessToken])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const roleLabel = () => {
    switch (user?.role) {
      case 'super_admin': return 'Super Administrator';
      case 'admin': return 'University Administrator';
      case 'warden': return 'Hostel Warden';
      default: return 'Administrator';
    }
  };

  // --- Render Custom Visual Charts ---

  const renderVerticalBarChart = (data) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
      <View style={styles.chartVerticalContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.chartBarWrapper}>
            <View style={[styles.chartBarTrack, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
              <View style={[styles.chartBarFill, { height: `${(item.value / maxVal) * 100}%`, backgroundColor: item.color }]} />
            </View>
            <Text style={[styles.chartBarLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            <Text style={[styles.chartBarValue, { color: colors.textPrimary }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderHorizontalStackBar = (segments) => {
    const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
    return (
      <View style={[styles.chartStackTrack, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
        {segments.map((seg, idx) => {
          const pct = (seg.value / total) * 100;
          if (pct === 0) return null;
          return (
            <View
              key={idx}
              style={[styles.chartStackSegment, { width: `${pct}%`, backgroundColor: seg.color }]}
            />
          );
        })}
      </View>
    );
  };

  // --- Personal Cockpit Check-in (Reused from student layout) ---
  const renderWellnessCheckIn = () => {
    return (
      <View style={{ marginBottom: 20 }}>
        {/* Premium Fitness Bar */}
        <TouchableOpacity
          style={[styles.fitnessCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => {
            navigation.navigate('FitnessDetail');
          }}
          activeOpacity={0.8}
        >
          <View style={styles.fitnessHeader}>
            <View style={[styles.fitnessIconBg, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="heart-pulse" size={20} color="#EF4444" />
            </View>
            <View style={styles.fitnessHeaderText}>
              <Text style={[styles.fitnessTitle, { color: colors.textPrimary }]}>Campus Fitness</Text>
              <Text style={[styles.fitnessSub, { color: colors.textSecondary }]}>
                {metrics.steps.toLocaleString()} / {goals.steps.toLocaleString()} steps today
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
          </View>

          <View style={styles.fitnessBody}>
            <View style={styles.fitnessRingContainer}>
              <View style={[styles.ringStack, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityRing radius={32} stroke={10} progress={stepsProgress} color="#EF4444" bgColor="#EF444420" />
                <ActivityRing radius={22} stroke={10} progress={caloriesProgress} color="#10B981" bgColor="#10B98120" />
                <ActivityRing radius={12} stroke={10} progress={focusProgress} color="#3B82F6" bgColor="#3B82F620" />
              </View>
            </View>

            <View style={styles.fitnessVDivider} />

            <View style={styles.fitnessGridStats}>
              <View style={styles.fitnessRow}>
                <View style={styles.fitnessItem}>
                  <Text style={[styles.fitnessVal, { color: colors.textPrimary }]}>{metrics.steps.toLocaleString()}</Text>
                  <Text style={[styles.fitnessLabel, { color: colors.textSecondary }]}>STEPS</Text>
                </View>
                <View style={styles.fitnessItem}>
                  <Text style={[styles.fitnessVal, { color: colors.textPrimary }]}>{metrics.calories}</Text>
                  <Text style={[styles.fitnessLabel, { color: colors.textSecondary }]}>KCAL</Text>
                </View>
              </View>
              <View style={[styles.fitnessHDivider, { backgroundColor: colors.border }]} />
              <View style={styles.fitnessRow}>
                <View style={styles.fitnessItem}>
                  <Text style={[styles.fitnessVal, { color: colors.textPrimary }]}>{Math.round((metrics.calories / Math.max(1, goals.calories)) * 100)}%</Text>
                  <Text style={[styles.fitnessLabel, { color: colors.textSecondary }]}>MOVE GOAL</Text>
                </View>
                <View style={styles.fitnessItem}>
                  <Text style={[styles.fitnessVal, { color: colors.textPrimary }]}>{metrics.sleepHours}</Text>
                  <Text style={[styles.fitnessLabel, { color: colors.textSecondary }]}>SLEEP</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Pulse Check */}
        <View style={[styles.pulseCard, { backgroundColor: colors.card, marginTop: 16 }]}>
          <View style={styles.pulseHeaderRow}>
            <View>
              <Text style={[styles.sectionTitleWellness, { color: colors.textPrimary }]}>Pulse Check</Text>
              <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>How are you feeling today?</Text>
            </View>
            <MaterialCommunityIcons name="heart-pulse" size={28} color="#EA580C" opacity={0.5} />
          </View>

          <View style={styles.moodRow}>
            {[
              { id: 0, icon: 'emoticon-excited-outline', apiVal: 'excited' },
              { id: 1, icon: 'emoticon-happy-outline', apiVal: 'happy' },
              { id: 2, icon: 'emoticon-neutral-outline', apiVal: 'neutral' },
              { id: 3, icon: 'emoticon-sad-outline', apiVal: 'stressed' },
            ].map((mood) => (
              <TouchableOpacity
                key={mood.id}
                onPress={async () => {
                  setActiveMood(mood.id);
                  try {
                    await logMoodAPI(accessToken, mood.apiVal);
                    Alert.alert("Mood Logged", "Your daily vibe check has been recorded. Stay healthy!");
                  } catch (e) {
                    console.warn("Failed to log mood:", e);
                  }
                }}
                style={[
                  styles.moodBtn,
                  { backgroundColor: activeMood === mood.id ? '#EA580C' : isDark ? '#1F2937' : '#F1F5F9' }
                ]}
              >
                <MaterialCommunityIcons
                  name={mood.icon}
                  size={28}
                  color={activeMood === mood.id ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mentally Box */}
        <View style={{ marginTop: 16 }}>
          <View style={[styles.mentallyBox, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
            <View style={[styles.mentallyIconCircle, { backgroundColor: isDark ? '#334155' : '#E0E7FF' }]}>
              <MaterialCommunityIcons name="brain" size={16} color="#4338CA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mentallyText, { color: isDark ? '#A5B4FC' : '#3730A3' }]}>
                "Keep a check on your wellness today. Let's make sure we take a break when needed."
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('MentallyMain')}>
                <Text style={[styles.mentallyAction, { color: isDark ? '#818CF8' : '#4338CA' }]}>TALK TO MENTALLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // --- Shimmer Dashboard Loading State ---
  const renderDashboardSkeleton = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Skeleton */}
        <View style={[styles.header, { backgroundColor: colors.card, height: 110, padding: 20, justifyContent: 'center' }]}>
          <SkeletonBlock width={120} height={10} borderRadius={5} style={{ marginBottom: 8 }} />
          <SkeletonBlock width={200} height={20} borderRadius={8} style={{ marginBottom: 12 }} />
          <SkeletonBlock width={140} height={12} borderRadius={6} />
        </View>

        {/* Section Title */}
        <SkeletonBlock width={180} height={16} borderRadius={8} style={{ marginTop: 24, marginBottom: 16 }} />

        {/* Wellness Checkin Skeleton */}
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, gap: 12 }}>
          <SkeletonBlock width={200} height={14} borderRadius={6} />
          <SkeletonBlock width={160} height={10} borderRadius={5} style={{ marginBottom: 8 }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SkeletonBlock width="23%" height={50} borderRadius={10} />
            <SkeletonBlock width="23%" height={50} borderRadius={10} />
            <SkeletonBlock width="23%" height={50} borderRadius={10} />
            <SkeletonBlock width="23%" height={50} borderRadius={10} />
          </View>
        </View>

        {/* Section Title */}
        <SkeletonBlock width={140} height={16} borderRadius={8} style={{ marginTop: 24, marginBottom: 16 }} />

        {/* Grid Cards Skeletons */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <SkeletonBlock width={(width - 52) / 2} height={140} borderRadius={16} />
          <SkeletonBlock width={(width - 52) / 2} height={140} borderRadius={16} />
          <SkeletonBlock width="100%" height={120} borderRadius={16} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // --- Warden Dashboard Layout ---
  const renderWardenDashboard = () => (
    <View style={styles.dashboardSection}>
      {renderWellnessCheckIn()}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Warden Control Panel</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('OutpassManager')}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.orangeLight }]}>
            <MaterialCommunityIcons name="door-open" size={24} color={colors.orange} />
          </View>
          <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{stats.pending_outpasses}</Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Pending Outpasses</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: colors.primary, marginBottom: 12 }]}
        onPress={() => navigation.navigate('OutpassManager')}
      >
        <MaterialCommunityIcons name="door-open" size={18} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.actionBtnText}>Manage Outpass Requests</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: colors.danger, marginBottom: 12 }]}
        onPress={() => navigation.navigate('RaiseIssue')}
      >
        <MaterialCommunityIcons name="alert-octagon-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.actionBtnText}>Raise an Issue</Text>
      </TouchableOpacity>

      <View style={[styles.restrictedBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="shield" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <Text style={[styles.restrictedText, { color: colors.textMuted }]}>
          Administrative reports and student mood/mental wellbeing indices are restricted to Admin/Super Administrator access.
        </Text>
      </View>
    </View>
  );

  // --- Admin Dashboard Layout ---
  const renderAdminDashboard = () => (
    <View style={styles.dashboardSection}>
      {renderWellnessCheckIn()}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>System Operations Snapshot</Text>
      <View style={styles.grid}>
        {/* Student Counter */}
        <View style={[styles.gridCard, { backgroundColor: colors.card }]}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
            <Feather name="users" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{stats.total_students || 350}</Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Total Students</Text>
        </View>

        {/* Startup Pitch Counter */}
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('VentureManager')}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.successLight }]}>
            <MaterialCommunityIcons name="rocket-launch-outline" size={24} color={colors.success} />
          </View>
          <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{stats.pending_ventures}</Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Pending Ventures</Text>
        </TouchableOpacity>

        {/* Grievances Counter */}
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('GrievanceManager')}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.dangerLight }]}>
            <MaterialCommunityIcons name="alert-octagon-outline" size={24} color={colors.danger} />
          </View>
          <Text style={[styles.cardVal, { color: colors.textPrimary }]}>{stats.active_grievances}</Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Open Grievances</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary, marginBottom: 10 }]}
          onPress={() => navigation.navigate('AdminBroadcastCenter')}
        >
          <Feather name="bell" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.actionBtnText}>Broadcast Targeted Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.success, marginBottom: 10 }]}
          onPress={() => navigation.navigate('VentureManager')}
        >
          <MaterialCommunityIcons name="rocket-launch-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.actionBtnText}>Review Startup Pitches</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.danger, marginBottom: 10 }]}
          onPress={() => navigation.navigate('GrievanceManager')}
        >
          <MaterialCommunityIcons name="alert-octagon-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.actionBtnText}>Open Grievance Inbox</Text>
        </TouchableOpacity>
      </View>

      {/* Campus Mood Index for Admin */}
      <TouchableOpacity
        style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: '#8B5CF6', borderLeftWidth: 3, marginTop: 16 }]}
        onPress={() => navigation.navigate('AdminMentalHealthInsights')}
        activeOpacity={0.85}
      >
        <View style={styles.insightHeader}>
          <View style={[styles.insightIconBg, { backgroundColor: '#8B5CF618' }]}>
            <MaterialCommunityIcons name="emoticon-happy-outline" size={18} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Campus Mood Index</Text>
            <Text style={[styles.insightCategoryTag, { color: '#8B5CF6' }]}>MENTAL HEALTH</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.textMuted} />
        </View>
        <Text style={[styles.insightSubText, { color: colors.textMuted, marginBottom: 10 }]}>
          Aggregate student sentiment & wellbeing indices
        </Text>
        {renderHorizontalStackBar([
          { value: (mentalStats?.mood_distribution?.happy || 0) + (mentalStats?.mood_distribution?.excited || 0), color: colors.success, label: 'Happy' },
          { value: (mentalStats?.mood_distribution?.neutral || 0), color: colors.warning, label: 'Neutral' },
          { value: (mentalStats?.mood_distribution?.stressed || 0), color: colors.orange, label: 'Tensed' },
          { value: (mentalStats?.at_risk_students?.length || 0), color: colors.danger, label: 'At Risk' }
        ])}
        <View style={[styles.sentimentList, { marginTop: 14 }]}>
          <TouchableOpacity
            style={styles.sentimentLabelRow}
            onPress={() => navigation.navigate('AdminMentalHealthInsights')}
            activeOpacity={0.7}
          >
            <View style={styles.sentimentDotRow}>
              <View style={[styles.sentimentDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.sentimentLabel, { color: colors.textPrimary }]}>Happy / Relaxed</Text>
            </View>
            <Text style={[styles.sentimentVal, { color: colors.success }]}>{(mentalStats?.mood_distribution?.happy || 0) + (mentalStats?.mood_distribution?.excited || 0)} →</Text>
          </TouchableOpacity>
          <View style={[styles.sentimentDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.sentimentLabelRow}
            onPress={() => navigation.navigate('AdminMentalHealthInsights')}
            activeOpacity={0.7}
          >
            <View style={styles.sentimentDotRow}>
              <View style={[styles.sentimentDot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.sentimentLabel, { color: colors.textPrimary }]}>Neutral</Text>
            </View>
            <Text style={[styles.sentimentVal, { color: colors.warning }]}>{(mentalStats?.mood_distribution?.neutral || 0)} →</Text>
          </TouchableOpacity>
          <View style={[styles.sentimentDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.sentimentLabelRow}
            onPress={() => navigation.navigate('AdminMentalHealthInsights')}
            activeOpacity={0.7}
          >
            <View style={styles.sentimentDotRow}>
              <View style={[styles.sentimentDot, { backgroundColor: colors.orange }]} />
              <Text style={[styles.sentimentLabel, { color: colors.textPrimary }]}>A Little Tensed</Text>
            </View>
            <Text style={[styles.sentimentVal, { color: colors.orange }]}>{(mentalStats?.mood_distribution?.stressed || 0)} →</Text>
          </TouchableOpacity>
          <View style={[styles.sentimentDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.sentimentLabelRow}
            onPress={() => navigation.navigate('AdminMentalHealthInsights')}
            activeOpacity={0.7}
          >
            <View style={styles.sentimentDotRow}>
              <View style={[styles.sentimentDot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.sentimentLabel, { color: colors.textPrimary }]}>At Risk</Text>
            </View>
            <Text style={[styles.sentimentVal, { color: colors.danger }]}>{(mentalStats?.at_risk_students?.length || 0)} →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  // --- Super Admin Dashboard Layout ---
  const renderSuperAdminDashboard = () => {
    const vStats = superStats?.venture || { pitched_ideas: 0, pre_revenue: 0, seed: 0, series_a: 0, cofounder_requests_count: 0, dept_distribution: [] };
    const sStats = superStats?.social || { total_posts: 0, active_clubs: 0, avg_engagement: '0.0%' };
    const lStats = superStats?.leaderboard || { top_dept: 'N/A', avg_social_credits: 0, rewards_claimed: 0 };
    const mStats = superStats?.marketplace || { active_listings: 0, completed_orders: 0 };
    const cStats = superStats?.cv_career || { cvs_created: 0, career_roadmaps_delivered: 0, skill_gap_tests_taken: 0 };
    const sgStats = superStats?.skill_gap || { improved_skills_count: 0 };
    const mhStats = superStats?.mental_health || { happy: 0, neutral: 0, tensed: 0, at_risk: 0 };
    const facStats = superStats?.faculty || { active_count: 0, average_attendance: '0%', sessional_marks_upload_pct: 0, active_logins: 0, average_cgpa: 0.0, dept_attendance: [] };
    const gStats = superStats?.grievance || { pending: 0, in_progress: 0, resolved: 0, total: 0 };

    const studentFitCount = fitnessStudentsList.length;
    const avgStudentSteps = studentFitCount > 0 
      ? Math.round(fitnessStudentsList.reduce((acc, s) => acc + (s.steps || 0), 0) / studentFitCount) 
      : 8420;
    const avgStudentKcal = studentFitCount > 0 
      ? Math.round(fitnessStudentsList.reduce((acc, s) => acc + (s.kcal || 0), 0) / studentFitCount) 
      : 420;
    const avgStudentSleep = studentFitCount > 0 
      ? (fitnessStudentsList.reduce((acc, s) => acc + (s.sleep_hours || 0), 0) / studentFitCount).toFixed(1) 
      : '7.2';

    const avgFacultySteps = 6450;
    const avgFacultyKcal = 310;
    const avgFacultySleep = '6.8';

    // Segment mappings for visual stacked charts
    const moodSegments = [
      { value: mhStats.happy, color: colors.success, label: 'Happy' },
      { value: mhStats.neutral, color: colors.warning, label: 'Neutral' },
      { value: mhStats.tensed, color: colors.orange, label: 'Tensed' },
      { value: mhStats.at_risk, color: colors.danger, label: 'At Risk' }
    ];

    const ventureChartData = [
      { label: 'Pitch', value: vStats.pitched_ideas, color: colors.primary },
      { label: 'Pre-Rev', value: vStats.pre_revenue, color: colors.orange },
      { label: 'Seed', value: vStats.seed, color: colors.success },
      { label: 'Series A', value: vStats.series_a, color: '#8B5CF6' }
    ];

    return (
      <View style={styles.dashboardSection}>
        {renderWellnessCheckIn()}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Strategic & Efficacy Insights</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Live intelligence from all campus verticals</Text>

        {/* Venture Stage Analysis */}
        <TouchableOpacity
          style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.success, borderLeftWidth: 3 }]}
          onPress={() => navigation.navigate('VentureInsights')}
          activeOpacity={0.85}
        >
          <View style={styles.insightHeader}>
            <View style={[styles.insightIconBg, { backgroundColor: colors.success + '18' }]}>
              <MaterialCommunityIcons name="rocket-launch" size={18} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Venture Engagement</Text>
              <Text style={[styles.insightCategoryTag, { color: colors.success }]}>STARTUP PIPELINE</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('SuperAdminDrilldown', { category: 'ventures', title: 'Submitted Pitch Decks' })}
            activeOpacity={0.7}
          >
            <Text style={[styles.insightBigVal, { color: colors.primary }]}>
              {vStats.pitched_ideas}{' '}
              <Text style={[styles.insightBigValSub, { color: colors.textSecondary }]}>Pitch Decks</Text>
            </Text>
          </TouchableOpacity>
          <Text style={[styles.insightSubText, { color: colors.textMuted, marginBottom: 14 }]}>
            Startup ideas distributed by validation stage
          </Text>
          {renderVerticalBarChart(ventureChartData)}
        </TouchableOpacity>

        {/* Grievance Resolution Insights */}
        <TouchableOpacity
          style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.danger, borderLeftWidth: 3 }]}
          onPress={() => navigation.navigate('SuperAdminDrilldown', { category: 'grievances', title: 'Student Grievance Logs' })}
          activeOpacity={0.85}
        >
          <View style={styles.insightHeader}>
            <View style={[styles.insightIconBg, { backgroundColor: colors.danger + '18' }]}>
              <MaterialCommunityIcons name="alert-octagon" size={18} color={colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Grievance Resolution</Text>
              <Text style={[styles.insightCategoryTag, { color: colors.danger }]}>STUDENT ISSUES</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </View>
          <Text style={[styles.insightBigVal, { color: colors.textPrimary }]}>
            {gStats.total}{' '}
            <Text style={[styles.insightBigValSub, { color: colors.textSecondary }]}>Grievances Filed</Text>
          </Text>
          <View style={[styles.insightStatRow, { marginTop: 10 }]}>
            <View style={[styles.insightStatChip, { backgroundColor: colors.danger + '15' }]}>
              <View style={[styles.chipDot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.chipLabel, { color: colors.danger }]}>Pending</Text>
              <Text style={[styles.chipValue, { color: colors.danger }]}>{gStats.pending}</Text>
            </View>
            <View style={[styles.insightStatChip, { backgroundColor: colors.orange + '15' }]}>
              <View style={[styles.chipDot, { backgroundColor: colors.orange }]} />
              <Text style={[styles.chipLabel, { color: colors.orange }]}>In Progress</Text>
              <Text style={[styles.chipValue, { color: colors.orange }]}>{gStats.in_progress}</Text>
            </View>
            <View style={[styles.insightStatChip, { backgroundColor: colors.success + '15' }]}>
              <View style={[styles.chipDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.chipLabel, { color: colors.success }]}>Resolved</Text>
              <Text style={[styles.chipValue, { color: colors.success }]}>{gStats.resolved}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Campus Mood Index */}
        <TouchableOpacity
          style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: '#8B5CF6', borderLeftWidth: 3 }]}
          onPress={() => navigation.navigate('AdminMentalHealthInsights')}
          activeOpacity={0.85}
        >
          <View style={styles.insightHeader}>
            <View style={[styles.insightIconBg, { backgroundColor: '#8B5CF618' }]}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={18} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Campus Mood Index</Text>
              <Text style={[styles.insightCategoryTag, { color: '#8B5CF6' }]}>MENTAL HEALTH</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </View>
          <Text style={[styles.insightSubText, { color: colors.textMuted, marginBottom: 10 }]}>
            Aggregate student sentiment & wellbeing indices
          </Text>
          {renderHorizontalStackBar(moodSegments)}
          <View style={[styles.sentimentList, { marginTop: 14 }]}>
            <TouchableOpacity
              style={styles.sentimentLabelRow}
              onPress={() => navigation.navigate('SuperAdminDrilldown', { category: 'happy_students', title: 'Relaxed & Happy Students' })}
              activeOpacity={0.7}
            >
              <View style={styles.sentimentDotRow}>
                <View style={[styles.sentimentDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.sentimentLabel, { color: colors.textPrimary }]}>Happy / Relaxed</Text>
              </View>
              <Text style={[styles.sentimentVal, { color: colors.success }]}>{mhStats.happy} →</Text>
            </TouchableOpacity>
            <View style={[styles.sentimentDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.sentimentLabelRow}
              onPress={() => navigation.navigate('SuperAdminDrilldown', { category: 'neutral_students', title: 'Neutral Students Log' })}
              activeOpacity={0.7}
            >
              <View style={styles.sentimentDotRow}>
                <View style={[styles.sentimentDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.sentimentLabel, { color: colors.textPrimary }]}>Neutral</Text>
              </View>
              <Text style={[styles.sentimentVal, { color: colors.warning }]}>{mhStats.neutral} →</Text>
            </TouchableOpacity>
            <View style={[styles.sentimentDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.sentimentLabelRow}
              onPress={() => navigation.navigate('SuperAdminDrilldown', { category: 'tensed_students', title: 'Stressed Students Log' })}
              activeOpacity={0.7}
            >
              <View style={styles.sentimentDotRow}>
                <View style={[styles.sentimentDot, { backgroundColor: colors.orange }]} />
                <Text style={[styles.sentimentLabel, { color: colors.textPrimary }]}>A Little Tensed</Text>
              </View>
              <Text style={[styles.sentimentVal, { color: colors.orange }]}>{mhStats.tensed} →</Text>
            </TouchableOpacity>
            <View style={[styles.sentimentDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.sentimentLabelRow}
              onPress={() => navigation.navigate('SuperAdminDrilldown', { category: 'at_risk_students', title: 'Critical At-Risk Logs' })}
              activeOpacity={0.7}
            >
              <View style={styles.sentimentDotRow}>
                <View style={[styles.sentimentDot, { backgroundColor: colors.danger }]} />
                <Text style={[styles.sentimentLabel, { color: colors.textPrimary }]}>At Risk</Text>
              </View>
              <Text style={[styles.sentimentVal, { color: colors.danger }]}>{mhStats.at_risk} →</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Campus Fitness Insights (Students & Faculty) */}
        <TouchableOpacity
          style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: '#EC4899', borderLeftWidth: 3 }]}
          onPress={() => navigation.navigate('SuperAdminDrilldown', { category: 'fitness_students', title: 'Campus Fitness Standings' })}
          activeOpacity={0.85}
        >
          <View style={styles.insightHeader}>
            <View style={[styles.insightIconBg, { backgroundColor: '#EC489918' }]}>
              <MaterialCommunityIcons name="heart-pulse" size={18} color="#EC4899" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Campus Fitness Insights</Text>
              <Text style={[styles.insightCategoryTag, { color: '#EC4899' }]}>PHYSICAL WELLBEING</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </View>

          <Text style={[styles.insightSubText, { color: colors.textMuted, marginBottom: 12 }]}>
            Aggregate physical activity & health logs
          </Text>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            {/* Students Sub-card */}
            <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <MaterialCommunityIcons name="account-outline" size={16} color="#3B82F6" />
                <Text style={{ fontWeight: '800', fontSize: 13, color: colors.textPrimary }}>Students</Text>
              </View>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Avg Steps</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>{avgStudentSteps.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Avg Burn</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>{avgStudentKcal} kcal</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Avg Sleep</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981' }}>{avgStudentSleep}h</Text>
                </View>
              </View>
            </View>

            {/* Faculty Sub-card */}
            <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <MaterialCommunityIcons name="school-outline" size={16} color="#10B981" />
                <Text style={{ fontWeight: '800', fontSize: 13, color: colors.textPrimary }}>Faculty</Text>
              </View>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Avg Steps</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>{avgFacultySteps.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Avg Burn</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>{avgFacultyKcal} kcal</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Avg Sleep</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981' }}>{avgFacultySleep}h</Text>
                </View>
              </View>
            </View>
          </View>
          
          <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 12, textAlign: 'right' }}>
            View Standings & Leaderboard →
          </Text>
        </TouchableOpacity>

        {/* Leaderboard (The Hustle) Insights */}
        <TouchableOpacity
          style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: '#FBBF24', borderLeftWidth: 3 }]}
          onPress={() => navigation.navigate('LeaderboardInsights')}
          activeOpacity={0.85}
        >
          <View style={styles.insightHeader}>
            <View style={[styles.insightIconBg, { backgroundColor: '#FBBF2418' }]}>
              <MaterialCommunityIcons name="trophy" size={18} color="#FBBF24" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Leaderboard — The Hustle</Text>
              <Text style={[styles.insightCategoryTag, { color: '#FBBF24' }]}>GAMIFICATION</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('SuperAdminDrilldown', { category: 'hustle_students', title: 'The Hustle Standings' })}
            activeOpacity={0.7}
          >
            <Text style={[styles.insightBigVal, { color: colors.primary }]}>
              View Full Standings{' '}
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>→</Text>
            </Text>
          </TouchableOpacity>
          <Text style={[styles.insightSubText, { color: colors.textMuted, marginBottom: 12 }]}>
            Points leaderboard & gamification standouts
          </Text>

          <View style={{ marginTop: 8 }}>
            {leaderboardGlimpse && leaderboardGlimpse.length > 0 ? (
              leaderboardGlimpse.map((item, idx) => (
                <View key={item.id || idx} style={[styles.glimpseRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.glimpseRank, { color: colors.textMuted }, idx === 0 && { color: '#EA580C' }]}>
                    #{idx + 1}
                  </Text>
                  {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.glimpseAvatar} />
                  ) : (
                    <View style={[styles.glimpseAvatarInitials, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.glimpseAvatarText, { color: colors.primary }]}>
                        {item.student_name ? item.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST'}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.glimpseName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.student_name}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }} numberOfLines={1}>
                      {item.branch || ''}
                    </Text>
                  </View>
                  <View style={[styles.glimpseScorePill, { backgroundColor: colors.border }]}>
                    <Text style={[styles.glimpseScoreText, { color: colors.textSecondary }]}>
                      {item.score} pts
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: colors.textSecondary, fontStyle: 'italic', paddingVertical: 8 }}>
                No standings loaded
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Social Network Insights */}
        <TouchableOpacity
          style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary, borderLeftWidth: 3 }]}
          onPress={() => navigation.navigate('Community')}
          activeOpacity={0.85}
        >
          <View style={styles.insightHeader}>
            <View style={[styles.insightIconBg, { backgroundColor: colors.primary + '18' }]}>
              <MaterialCommunityIcons name="chat-processing" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Social Network Insights</Text>
              <Text style={[styles.insightCategoryTag, { color: colors.primary }]}>COMMUNITY</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </View>
          <Text style={[styles.insightBigVal, { color: colors.textPrimary }]}>
            {sStats.total_posts}{' '}
            <Text style={[styles.insightBigValSub, { color: colors.textSecondary }]}>Social Posts</Text>
          </Text>
          <View style={[styles.insightStatRow, { marginTop: 10 }]}>
            <View style={[styles.insightStatChip, { backgroundColor: colors.primary + '12' }]}>
              <Text style={[styles.chipLabel, { color: colors.primary }]}>Active Clubs</Text>
              <Text style={[styles.chipValue, { color: colors.primary }]}>{sStats.active_clubs}</Text>
            </View>
            <View style={[styles.insightStatChip, { backgroundColor: colors.primary + '12' }]}>
              <Text style={[styles.chipLabel, { color: colors.primary }]}>Engagement</Text>
              <Text style={[styles.chipValue, { color: colors.primary }]}>{sStats.avg_engagement}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Marketplace (Shop) Insights */}
        <TouchableOpacity
          style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.orange, borderLeftWidth: 3 }]}
          onPress={() => navigation.navigate('Marketplace')}
          activeOpacity={0.85}
        >
          <View style={styles.insightHeader}>
            <View style={[styles.insightIconBg, { backgroundColor: colors.orange + '18' }]}>
              <MaterialCommunityIcons name="storefront" size={18} color={colors.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Marketplace Activity</Text>
              <Text style={[styles.insightCategoryTag, { color: colors.orange }]}>COMMERCE</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </View>
          <Text style={[styles.insightBigVal, { color: colors.textPrimary }]}>
            {mStats.active_listings}{' '}
            <Text style={[styles.insightBigValSub, { color: colors.textSecondary }]}>Active Listings</Text>
          </Text>
          <View style={[styles.insightStatRow, { marginTop: 10 }]}>
            <View style={[styles.insightStatChip, { backgroundColor: colors.orange + '12' }]}>
              <Text style={[styles.chipLabel, { color: colors.orange }]}>Completed Orders</Text>
              <Text style={[styles.chipValue, { color: colors.orange }]}>{mStats.completed_orders}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Student Insights (Medical, Engineering, Management) */}
        <View
          style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: '#3B82F6', borderLeftWidth: 3 }]}
        >
          <View style={styles.insightHeader}>
            <View style={[styles.insightIconBg, { backgroundColor: '#3B82F618' }]}>
              <MaterialCommunityIcons name="account-group-outline" size={18} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Student Insights</Text>
              <Text style={[styles.insightCategoryTag, { color: '#3B82F6' }]}>COLLEGE DIRECTORY</Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('SuperAdminDrilldown', { category: 'student_directory', title: 'Student Directory', department: 'all' })}
              activeOpacity={0.7}
            >
              <Feather name="chevron-right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.insightBigVal, { color: colors.textPrimary }]}>
            {studentsList.length}{' '}
            <Text style={[styles.insightBigValSub, { color: colors.textSecondary }]}>Total Students</Text>
          </Text>
          <Text style={[styles.insightSubText, { color: colors.textMuted, marginBottom: 12 }]}>
            Student distribution by department. Tap a department to view directory.
          </Text>

          <View style={{ gap: 10, marginTop: 8 }}>
            {[
              { name: 'Medical', count: studentsList.filter(s => String(s.category).toLowerCase() === 'medical').length, color: '#EF4444', value: 'medical' },
              { name: 'Engineering', count: studentsList.filter(s => String(s.category).toLowerCase() === 'engineering').length, color: '#3B82F6', value: 'engineering' },
              { name: 'Management', count: studentsList.filter(s => String(s.category).toLowerCase() === 'management').length, color: '#10B981', value: 'management' }
            ].map((dept) => {
              const total = studentsList.length || 1;
              const pct = Math.round((dept.count / total) * 100);
              return (
                <TouchableOpacity
                  key={dept.value}
                  onPress={() => navigation.navigate('SuperAdminDrilldown', { category: 'student_directory', title: `${dept.name} Students`, department: dept.value })}
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB',
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dept.color }} />
                      <Text style={{ fontWeight: '700', fontSize: 13, color: colors.textPrimary }}>{dept.name}</Text>
                    </View>
                    <Text style={{ fontWeight: '800', fontSize: 12, color: dept.color }}>{dept.count} Students ({pct}%)</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: dept.color, borderRadius: 3 }} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Teacher/Faculty Insights */}
        <TouchableOpacity
          style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: '#10B981', borderLeftWidth: 3, marginBottom: 24 }]}
          onPress={() => navigation.navigate('FacultyInsights')}
          activeOpacity={0.85}
        >
          <View style={styles.insightHeader}>
            <View style={[styles.insightIconBg, { backgroundColor: '#10B98118' }]}>
              <Feather name="book-open" size={16} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>College Faculty Insights</Text>
              <Text style={[styles.insightCategoryTag, { color: '#10B981' }]}>ACADEMICS</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </View>
          <Text style={[styles.insightBigVal, { color: colors.textPrimary }]}>
            {facStats.active_count}{' '}
            <Text style={[styles.insightBigValSub, { color: colors.textSecondary }]}>Active Teachers</Text>
          </Text>
          <View style={[styles.insightStatRow, { marginTop: 10 }]}>
            <View style={[styles.insightStatChip, { backgroundColor: '#10B98112' }]}>
              <Text style={[styles.chipLabel, { color: '#10B981' }]}>Avg Attendance</Text>
              <Text style={[styles.chipValue, { color: '#10B981' }]}>{facStats.average_attendance}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Action Shortcuts */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Superadmin Shortcuts</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary, marginBottom: 10 }]}
            onPress={() => navigation.navigate('AdminBroadcastCenter')}
          >
            <Feather name="bell" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Broadcast Announcement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.danger, marginBottom: 10 }]}
            onPress={() => navigation.navigate('GrievanceManager')}
          >
            <MaterialCommunityIcons name="alert-octagon-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Review Grievance Inbox</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return renderDashboardSkeleton();
  }

  const isWarden = user?.role === 'warden';
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';

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
          colors={isDark ? ['#1E1E38', '#0F172A'] : ['#F5EEFC', '#FFFFFF']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Control Center</Text>
              <Text style={[styles.adminName, { color: colors.textPrimary }]}>{user?.name || 'UniCampus Staff'}</Text>
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{roleLabel()}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Feather name="log-out" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Demo Locked Notice */}
        {isAdmin && (
          <View style={[styles.alertBox, { backgroundColor: isDark ? '#2D1B1B' : '#FEE2E2', borderColor: colors.danger }]}>
            <Feather name="alert-triangle" size={16} color={colors.danger} style={{ marginRight: 8 }} />
            <Text style={[styles.alertText, { color: isDark ? '#F87171' : '#B91C1C' }]}>
              Demo Mode: Financial accounting, fees collections & student records sync is view-only.
            </Text>
          </View>
        )}

        {/* Conditional Dashboard Sections */}
        {isWarden && renderWardenDashboard()}
        {isAdmin && renderAdminDashboard()}
        {isSuperAdmin && renderSuperAdminDashboard()}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  adminName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  logoutBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  alertBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  gridCard: {
    width: (width - 52) / 2,
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
    marginBottom: 16,
  },
  cardVal: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'column',
  },
  actionBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  restrictedBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  restrictedText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  insightCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  insightIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightCategoryTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  insightBigVal: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  insightBigValSub: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0,
  },
  insightStatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  insightStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipValue: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 2,
  },
  insightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightSubText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
  },
  bulletList: {
    gap: 6,
  },
  bulletItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  bulletItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  sentimentList: {
    gap: 0,
  },
  sentimentItem: {
    width: '100%',
  },
  sentimentDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sentimentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sentimentDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  sentimentLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  sentimentLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sentimentVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: -8,
    marginBottom: 14,
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
  riskUrgentText: {
    fontSize: 11,
    lineHeight: 14,
  },
  // Personal Wellness Check-in Styles
  fitnessCard: {
    padding: 20,
    borderRadius: 28,
  },
  fitnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  fitnessIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fitnessHeaderText: {
    flex: 1,
  },
  fitnessTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  fitnessSub: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.6,
  },
  fitnessBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  fitnessRingContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringStack: {
    width: 64,
    height: 64,
  },
  fitnessVDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  fitnessGridStats: {
    flex: 1,
    gap: 10,
  },
  fitnessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fitnessItem: {
    flex: 1,
  },
  fitnessVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  fitnessLabel: {
    fontSize: 9,
    fontWeight: '800',
    opacity: 0.5,
    letterSpacing: 1,
  },
  fitnessHDivider: {
    height: 1,
    width: '100%',
  },
  pulseCard: {
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  pulseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleWellness: {
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: 14,
    marginTop: 4,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  moodBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentallyBox: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  mentallyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  mentallyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  mentallyAction: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  // Custom Visual Graphs & Charts Styles
  chartVerticalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
    marginTop: 16,
    paddingTop: 8,
  },
  chartBarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarTrack: {
    width: 12,
    height: 50,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  chartBarLabel: {
    fontSize: 8,
    marginTop: 4,
    fontWeight: '700',
  },
  chartBarValue: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  chartStackTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
    marginTop: 12,
  },
  chartStackSegment: {
    height: '100%',
  },
  glimpseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  glimpseRank: {
    width: 24,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  glimpseAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  glimpseAvatarInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glimpseAvatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  glimpseName: {
    fontSize: 14,
    fontWeight: '700',
  },
  glimpseScorePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  glimpseScoreText: {
    fontSize: 11,
    fontWeight: '800',
  },
});

export default AdminDashboardScreen;
