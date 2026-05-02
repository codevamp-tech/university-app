import React from 'react';
import { useTheme } from '../../hooks/useTheme';

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';

const { width } = Dimensions.get('window');

const attendanceData = {
  overall: 85,
  totalClasses: 320,
  attendedClasses: 272,
  subjects: [
    { code: 'CS701', name: 'Artificial Intelligence & Robotics', percentage: 92, status: 'safe' },
    { code: 'CS702', name: 'Cloud Computing Architectures', percentage: 85, status: 'safe' },
    { code: 'CS703', name: 'Network Security & Cryptography', percentage: 72, status: 'warning' },
    { code: 'CS704', name: 'Software Project Management', percentage: 88, status: 'safe' },
    { code: 'CS705', name: 'Data Mining & Warehousing', percentage: 65, status: 'danger' },
  ]
};

const ERPAttendanceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

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
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Attendance Insights</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Semester VII • {APP_CONFIG.UNIVERSITY_NAME}</Text>
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
                {attendanceData.overall}%
              </Text>
              <View style={styles.overallStats}>
                <Text style={[styles.statValue, { color: isDark ? '#A5B4FC' : '#312E81' }]}>{attendanceData.attendedClasses}</Text>
                <Text style={[styles.statLabel, { color: isDark ? 'rgba(165,180,252,0.7)' : 'rgba(49,46,129,0.7)' }]}>Attended</Text>
                
                <View style={styles.statDivider} />
                
                <Text style={[styles.statValue, { color: isDark ? '#A5B4FC' : '#312E81' }]}>{attendanceData.totalClasses}</Text>
                <Text style={[styles.statLabel, { color: isDark ? 'rgba(165,180,252,0.7)' : 'rgba(49,46,129,0.7)' }]}>Total Classes</Text>
              </View>
            </View>

            <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#C7D2FE' }]}>
              <View style={[styles.progressBarFill, { width: `${attendanceData.overall}%`, backgroundColor: isDark ? '#818CF8' : '#4338CA' }]} />
            </View>
            <Text style={[styles.progressHint, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(67,56,202,0.7)' }]}>
              You are above the 75% minimum criteria. Keep it up!
            </Text>
          </LinearGradient>
        </View>

        {/* Subject-wise Breakdown */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Subject-wise Breakdown</Text>
          
          <View style={styles.subjectsList}>
            {attendanceData.subjects.map((subject, index) => {
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
            })}
          </View>
        </View>

      </ScrollView>
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
  overallStats: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '500', marginLeft: -8 },
  statDivider: { width: 1, height: 20, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 4 },
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
