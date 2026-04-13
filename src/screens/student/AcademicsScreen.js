import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Circle } from 'react-native-svg';
import { ATTENDANCE_SUBJECTS, RECENT_RECORDS } from '../../constants/data';
import { LinearGradient } from 'expo-linear-gradient';

const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DonutChart = ({ percent }) => {
  const strokeDash = (percent / 100) * CIRCUMFERENCE;
  return (
    <View style={styles.donutWrap}>
      <Svg width={150} height={150} viewBox="0 0 150 150">
        <Circle
          cx="75"
          cy="75"
          r={RADIUS}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth="10"
        />
        <Circle
          cx="75"
          cy="75"
          r={RADIUS}
          fill="none"
          stroke="#8b2fc9"
          strokeWidth="10"
          strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * 0.25}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutPercent}>{percent}%</Text>
        <Text style={styles.donutLabel}>ATTENDANCE</Text>
      </View>
    </View>
  );
};

const AcademicsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Academics</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Alerts')} style={styles.bellButton} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color="#111827" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroBadge}>OVERALL PERFORMANCE</Text>
          <Text style={styles.heroTitle}>
            Your Academic{' '}
            <Text style={styles.heroHighlight}>Presence.</Text>
          </Text>
          <Text style={styles.heroDesc}>
            You've maintained consistent attendance this semester. Keep it above 75% to stay eligible for final examinations.
          </Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.heroPrimaryBtn} activeOpacity={0.85}>
              <Text style={styles.heroPrimaryBtnText}>View History</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroSecondaryBtn} activeOpacity={0.85}>
              <Ionicons name="download-outline" size={16} color="#111827" />
              <Text style={styles.heroSecondaryBtnText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Donut Chart Card */}
        <View style={styles.chartCard}>
          <DonutChart percent={82} />
          <View style={styles.chartStats}>
            <View style={styles.chartStat}>
              <Text style={styles.chartStatValue}>164</Text>
              <Text style={styles.chartStatLabel}>ATTENDED</Text>
            </View>
            <View style={styles.chartDivider} />
            <View style={styles.chartStat}>
              <Text style={styles.chartStatValue}>200</Text>
              <Text style={styles.chartStatLabel}>TOTAL</Text>
            </View>
          </View>
          <View style={styles.chartTrend}>
            <Ionicons name="trending-up" size={14} color="#10B981" />
            <Text style={styles.chartTrendText}>
              <Text style={styles.trendHighlight}>+5%</Text> from last month
            </Text>
          </View>
        </View>

        {/* Subject Analysis Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subject Analysis</Text>
          <View style={styles.warningBadge}>
            <View style={styles.warningDot} />
            <Text style={styles.warningText}>2 Subjects Need Attention</Text>
          </View>
        </View>

        {/* Subject Cards */}
        {ATTENDANCE_SUBJECTS.map((subj, index) => (
          <TouchableOpacity
            key={subj.id}
            style={styles.subjectCard}
            activeOpacity={0.8}
          >
            <View style={styles.subjectHeader}>
              <View style={styles.subjectLeft}>
                <View style={[styles.subjectCodeBox, { backgroundColor: subj.color + '15' }]}>
                  <Text style={[styles.subjectCode, { color: subj.color }]}>{subj.code}</Text>
                </View>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>{subj.name}</Text>
                  <Text style={styles.subjectProfessor}>{subj.professor}</Text>
                </View>
              </View>
              <Text style={[styles.subjectNumber, { color: subj.color + '30' }]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>ATTENDANCE</Text>
                <Text style={[styles.progressValue, { color: subj.color }]}>{subj.attendance}%</Text>
              </View>

              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${subj.attendance}%`,
                      backgroundColor: subj.color,
                      opacity: subj.attendance < 75 ? 1 : 0.9
                    }
                  ]}
                />
              </View>

              {subj.status && (
                <View style={styles.statusAlert}>
                  <Ionicons name="alert-circle" size={12} color={subj.color} />
                  <Text style={[styles.statusText, { color: subj.color }]}>{subj.status}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Achievement Banner */}
        <LinearGradient
          colors={['#9ba9ff', '#eccaff', '#c4baff', '#e0e5ff', '#d2d9ff']}
          locations={[0, 0.3, 0.55, 0.8, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.achievementCard}
        >
          <View style={styles.achievementContent}>
            <View style={styles.achievementLeft}>
              <Text style={styles.achievementBadge}>🏆 ACHIEVEMENT UNLOCKED</Text>
              <Text style={styles.achievementTitle}>Consistency is the key to mastery.</Text>
              <Text style={styles.achievementDesc}>
                You're ranked in the top 15% of your class for attendance.
              </Text>
            </View>
            <View style={styles.achievementIcon}>
              <Ionicons name="star" size={24} color="#8B2FC9" />
            </View>
          </View>
        </LinearGradient>

        {/* Recent Records */}
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Records</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {RECENT_RECORDS.map((rec) => (
          <View key={rec.id} style={styles.recordCard}>
            <View style={[styles.recordDot, { backgroundColor: rec.isPresent ? '#10B981' : '#EF4444' }]}>
              <Ionicons
                name={rec.isPresent ? 'checkmark' : 'close'}
                size={14}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.recordInfo}>
              <Text style={styles.recordSubject}>{rec.subject}</Text>
              <Text style={styles.recordTime}>{rec.time}</Text>
            </View>
            <View style={[styles.recordStatusBadge, { backgroundColor: rec.isPresent ? '#10B98115' : '#EF444415' }]}>
              <Text style={[styles.recordStatus, { color: rec.isPresent ? '#10B981' : '#EF4444' }]}>
                {rec.status}
              </Text>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  hero: {
    marginBottom: 20,
  },
  heroBadge: {
    fontSize: 11,
    color: '#8b2fc9',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 34,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroHighlight: {
    color: '#8b2fc9',
  },
  heroDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 18,
    fontWeight: '400',
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPrimaryBtn: {
    backgroundColor: '#8b2fc9',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#8b2fc9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  heroPrimaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  heroSecondaryBtnText: {
    color: '#111827',
    fontWeight: '500',
    fontSize: 13,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutPercent: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  donutLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  chartStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    marginBottom: 12,
  },
  chartStat: {
    alignItems: 'center',
  },
  chartStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  chartStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  chartDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  chartTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chartTrendText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  trendHighlight: {
    color: '#10B981',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  warningDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
  },
  warningText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  subjectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subjectCodeBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectCode: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  subjectProfessor: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  subjectNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  progressSection: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  achievementCard: {
    borderRadius: 20,
    marginBottom: 24,
    marginTop: 8,
    shadowColor: '#8b2fc9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  achievementContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementLeft: {
    flex: 1,
    paddingRight: 12,
  },
  achievementBadge: {
    fontSize: 10,
    color: '#000',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  achievementDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    fontWeight: '500',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontSize: 13,
    color: '#8b2fc9',
    fontWeight: '600',
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  recordDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  recordSubject: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  recordTime: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  recordStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  recordStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default AcademicsScreen;