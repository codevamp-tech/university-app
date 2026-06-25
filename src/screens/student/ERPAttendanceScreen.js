import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getAcademicSubjects } from '../../data/aiEngine';

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';

import { getAttendance } from '../../data/apiService';

const { width } = Dimensions.get('window');

const ERPAttendanceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();
  const [apiAttendance, setApiAttendance] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const semNum = parseInt(user?.semester) || 7;
  const isMedical = user?.course?.replace(/\./g, '').toUpperCase().includes('MBBS') || user?.category?.toLowerCase() === 'medical';
  const getPhaseRomanLocal = (sem) => {
    const s = parseInt(sem);
    if (s <= 2) return 'I';
    if (s <= 4) return 'II';
    if (s <= 6) return 'III';
    return 'IV';
  };
  const displaySem = isMedical ? getPhaseRomanLocal(semNum) : (roman[semNum - 1] || 'VII');
  const termLabel = isMedical ? 'Phase' : 'Semester';

  React.useEffect(() => {
    async function loadAttendance() {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const data = await getAttendance(accessToken);
        if (data && data.length > 0) {
          const subjects = data.map(item => {
            const percentage = Math.round(item.attendance_pct || 0);
            const status = percentage >= 75 ? 'safe' : percentage >= 60 ? 'warning' : 'danger';
            return {
              code: item.subject_code,
              name: item.subject_name || item.subject_code,
              percentage,
              status
            };
          });

          const overall = subjects.length > 0 
            ? Math.round(subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length)
            : 0;

          setApiAttendance({
            overall: user?.attendance || overall,
            totalClasses: subjects.length * 30, // estimate for display
            attendedClasses: Math.round((user?.attendance || overall) * 0.01 * (subjects.length * 30)),
            subjects
          });
        }
      } catch (err) {
        console.warn('[AttendanceScreen] Error fetching from API:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, [accessToken, user?.attendance]);

  const attendanceData = apiAttendance || {
    overall: '-',
    totalClasses: 0,
    attendedClasses: 0,
    subjects: []
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return isDark ? '#34D399' : '#059669'; // Green
      case 'warning': return isDark ? '#FBBF24' : '#D97706'; // Yellow/Orange
      case 'danger': return isDark ? '#F87171' : '#DC2626'; // Red
      default: return colors.primary;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('ERPHome')} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Attendance</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Attendance Insights</Text>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>{termLabel} {displaySem} • {APP_CONFIG.UNIVERSITY_NAME}</Text>
          </View>

          {/* Overall Attendance Card */}
          <View style={styles.sectionContainer}>
            <LinearGradient
              colors={isDark ? ['#1E1B4B', '#312E81'] : ['#EEF2FF', '#E0E7FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.overallCard, { borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}
            >
              <View style={styles.overallHeader}>
                <Text style={[styles.overallLabel, { color: isDark ? '#818CF8' : '#4338CA' }]}>OVERALL ATTENDANCE</Text>
                <MaterialCommunityIcons name="shield-check" size={24} color={isDark ? '#818CF8' : '#4338CA'} />
              </View>
              
              <View style={styles.overallMain}>
                <Text style={[styles.overallPercentage, { color: isDark ? '#A5B4FC' : '#312E81' }]}>
                  {attendanceData.overall}{attendanceData.overall !== '-' ? '%' : ''}
                </Text>
                <View style={styles.overallStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: isDark ? '#A5B4FC' : '#312E81' }]}>{attendanceData.attendedClasses}</Text>
                    <Text style={[styles.statLabel, { color: isDark ? 'rgba(165,180,252,0.7)' : 'rgba(49,46,129,0.7)' }]}>Attended</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: isDark ? '#A5B4FC' : '#312E81' }]}>{attendanceData.totalClasses}</Text>
                    <Text style={[styles.statLabel, { color: isDark ? 'rgba(165,180,252,0.7)' : 'rgba(49,46,129,0.7)' }]}>Total</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#C7D2FE' }]}>
                <View style={[styles.progressBarFill, { width: attendanceData.overall === '-' ? '0%' : `${attendanceData.overall}%`, backgroundColor: isDark ? '#818CF8' : '#4338CA' }]} />
              </View>
              <Text style={[styles.progressHint, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(67,56,202,0.7)' }]}>
                {attendanceData.overall === '-' ? 'No attendance records available.' : (attendanceData.overall >= 75 ? 'You are above the 75% minimum criteria. Keep it up!' : 'Warning: Your attendance is below the 75% minimum criteria.')}
              </Text>
            </LinearGradient>
          </View>

          {/* Subject-wise Breakdown */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Subject-wise Breakdown</Text>
            
            <View style={styles.subjectsList}>
              {attendanceData.subjects.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderColor: colors.border, borderWidth: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>No attendance data available</Text>
                </View>
              ) : (
                attendanceData.subjects.map((subject, index) => {
                  const statusColor = getStatusColor(subject.status);
                  
                  return (
                    <View key={index} style={[styles.subjectCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                      <View style={styles.subjectHeader}>
                        <View>
                          <Text style={[styles.subjectCode, { color: colors.textSecondary }]}>{subject.code}</Text>
                          <Text style={[styles.subjectName, { color: colors.textPrimary }]} numberOfLines={1}>{subject.name}</Text>
                        </View>
                        <View style={[styles.percentageBadge, { backgroundColor: statusColor + '20' }]}>
                          <Text style={[styles.percentageText, { color: statusColor }]}>{subject.percentage}%</Text>
                        </View>
                      </View>
                      
                      <View style={[styles.subjectProgressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                        <View style={[styles.subjectProgressFill, { width: `${subject.percentage}%`, backgroundColor: statusColor }]} />
                      </View>
                      
                      {subject.status === 'danger' && (
                        <Text style={[styles.warningText, { color: statusColor }]}>
                          <MaterialIcons name="error-outline" size={12} color={statusColor} /> Short attendance warning!
                        </Text>
                      )}
                      {subject.status === 'warning' && (
                        <Text style={[styles.warningText, { color: statusColor }]}>
                          <MaterialIcons name="warning-amber" size={12} color={statusColor} /> Nearing minimum criteria.
                        </Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </View>

        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  notifBtn: { padding: 8 },
  scroll: { paddingBottom: 40 },
  sectionContainer: { paddingHorizontal: 20, marginTop: 24 },
  heroTitle: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  heroSub: { fontSize: 14, fontWeight: '500' },
  
  overallCard: {
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  overallHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  overallLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  overallMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  overallPercentage: { fontSize: 48, fontWeight: '800', lineHeight: 56 },
  overallStats: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 4 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 6 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressHint: { fontSize: 12, fontWeight: '500' },

  sectionHeading: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  subjectsList: { gap: 16 },
  subjectCard: { padding: 16, borderRadius: 16 },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  subjectCode: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  subjectName: { fontSize: 15, fontWeight: '600', maxWidth: width * 0.55 },
  percentageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  percentageText: { fontSize: 14, fontWeight: '700' },
  subjectProgressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  subjectProgressFill: { height: '100%', borderRadius: 3 },
  warningText: { fontSize: 12, fontWeight: '500', marginTop: 12, flexDirection: 'row', alignItems: 'center' },
});

export default ERPAttendanceScreen;
