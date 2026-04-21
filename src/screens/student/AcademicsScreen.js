import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Circle } from 'react-native-svg';
import { ATTENDANCE_SUBJECTS, RECENT_RECORDS } from '../../constants/data';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';


const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DonutChart = ({ percent }) => {
  const { colors, isDark } = useTheme();
  const strokeDash = (percent / 100) * CIRCUMFERENCE;

  return (
    <View style={styles.donutWrap}>
      <Svg width={150} height={150} viewBox="0 0 150 150">
        <Circle
          cx="75"
          cy="75"
          r={RADIUS}
          fill="none"
          stroke={colors.border}
          strokeWidth="10"
        />

        <Circle
          cx="75"
          cy="75"
          r={RADIUS}
          fill="none"
          stroke={colors.primary}
          strokeWidth="10"
          strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * 0.25}
          strokeLinecap="round"
        />

      </Svg>
      <View style={styles.donutCenter}>
        <Text style={[styles.donutPercent, { color: colors.textPrimary }]}>{percent}%</Text>
        <Text style={[styles.donutLabel, { color: colors.textSecondary }]}>ATTENDANCE</Text>
      </View>

    </View>
  );
};

const AcademicsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();


  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Academics</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Alerts')} style={[styles.bellButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          <View style={[styles.notificationBadge, { borderColor: colors.card }]} />
        </TouchableOpacity>
      </View>



      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={[styles.heroBadge, { color: colors.primary }]}>OVERALL PERFORMANCE</Text>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Your Academic{' '}
            <Text style={[styles.heroHighlight, { color: colors.primary }]}>Presence.</Text>
          </Text>
          <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
            You've maintained consistent attendance this semester. Keep it above 75% to stay eligible for final examinations.
          </Text>

          <View style={styles.heroButtons}>
            <TouchableOpacity style={[styles.heroPrimaryBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} activeOpacity={0.85}>
              <Text style={styles.heroPrimaryBtnText}>View History</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.heroSecondaryBtn, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }]} activeOpacity={0.85}>
              <Ionicons name="download-outline" size={16} color={colors.textPrimary} />
              <Text style={[styles.heroSecondaryBtnText, { color: colors.textPrimary }]}>Report</Text>
            </TouchableOpacity>
          </View>


        </View>

        {/* Donut Chart Card */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <DonutChart percent={82} />
          <View style={styles.chartStats}>
            <View style={styles.chartStat}>
              <Text style={[styles.chartStatValue, { color: colors.textPrimary }]}>164</Text>
              <Text style={[styles.chartStatLabel, { color: colors.textSecondary }]}>ATTENDED</Text>
            </View>
            <View style={[styles.chartDivider, { backgroundColor: colors.border }]} />
            <View style={styles.chartStat}>
              <Text style={[styles.chartStatValue, { color: colors.textPrimary }]}>200</Text>
              <Text style={[styles.chartStatLabel, { color: colors.textSecondary }]}>TOTAL</Text>
            </View>
          </View>


          <View style={[styles.chartTrend, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#F1F5F9' }]}>
            <Ionicons name="trending-up" size={14} color="#10B981" />
            <Text style={[styles.chartTrendText, { color: colors.textSecondary }]}>
              <Text style={[styles.trendHighlight, { color: '#10B981' }]}>+5%</Text> from last month
            </Text>
          </View>


        </View>


        {/* Subject Analysis Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Subject Analysis</Text>
          <View style={[styles.warningBadge, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2' }]}>
            <View style={styles.warningDot} />
            <Text style={styles.warningText}>2 Subjects Need Attention</Text>
          </View>
        </View>


        {/* Subject Cards */}
        {ATTENDANCE_SUBJECTS.map((subj, index) => (
          <TouchableOpacity
            key={subj.id}
            style={[styles.subjectCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
          >

            <View style={styles.subjectHeader}>
              <View style={styles.subjectLeft}>
                <View style={[styles.subjectCodeBox, { backgroundColor: isDark ? subj.color + '25' : subj.color + '15' }]}>
                  <Text style={[styles.subjectCode, { color: subj.color }]}>{subj.code}</Text>
                </View>
                <View style={styles.subjectInfo}>
                  <Text style={[styles.subjectName, { color: colors.textPrimary }]}>{subj.name}</Text>
                  <Text style={[styles.subjectProfessor, { color: colors.textSecondary }]}>{subj.professor}</Text>
                </View>
              </View>

              <Text style={[styles.subjectNumber, { color: subj.color, opacity: 0.15 }]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>ATTENDANCE</Text>
                <Text style={[styles.progressValue, { color: subj.color }]}>{subj.attendance}%</Text>
              </View>

              <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
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
          colors={isDark ? ['#1E1B4B', '#111827'] : ['#F97316', '#EA580C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.achievementCard, { borderColor: isDark ? colors.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}
        >

          <View style={styles.achievementContent}>
            <View style={styles.achievementLeft}>
              <Text style={[styles.achievementBadge, { color: 'rgba(255,255,255,0.7)' }]}>🏆 ACHIEVEMENT UNLOCKED</Text>
              <Text style={[styles.achievementTitle, { color: '#FFFFFF' }]}>Consistency is the key to mastery.</Text>
              <Text style={[styles.achievementDesc, { color: 'rgba(255,255,255,0.85)' }]}>
                You're ranked in the top 15% of your class for attendance.
              </Text>
            </View>


            <View style={[styles.achievementIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' }]}>
              <Ionicons name="star" size={24} color={isDark ? '#FACC15' : '#EA580C'} />
            </View>
          </View>

        </LinearGradient>


        {/* Recent Records */}
        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: colors.textPrimary }]}>Recent Records</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All →</Text>
          </TouchableOpacity>
        </View>


        {RECENT_RECORDS.map((rec) => (
          <View key={rec.id} style={[styles.recordCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.recordDot, { backgroundColor: rec.isPresent ? '#10B981' : '#EF4444' }]}>
              <Ionicons
                name={rec.isPresent ? 'checkmark' : 'close'}
                size={14}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.recordInfo}>
              <Text style={[styles.recordSubject, { color: colors.textPrimary }]}>{rec.subject}</Text>
              <Text style={[styles.recordTime, { color: colors.textSecondary }]}>{rec.time}</Text>
            </View>
            <View style={[styles.recordStatusBadge, { backgroundColor: rec.isPresent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
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
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },


  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 8,
    letterSpacing: -0.3,
  },


  heroHighlight: {
  },

  heroDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
    fontWeight: '400',
  },

  heroButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPrimaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 40,
    borderWidth: 1.5,
  },

  heroSecondaryBtnText: {
    fontWeight: '500',
    fontSize: 13,
  },

  chartCard: {
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
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
    letterSpacing: -0.5,
  },

  donutLabel: {
    fontSize: 10,
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
    letterSpacing: -0.3,
  },

  chartStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  chartDivider: {
    width: 1,
    height: 36,
  },

  chartTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  chartTrendText: {
    fontSize: 11,
    fontWeight: '500',
  },

  trendHighlight: {
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
    letterSpacing: -0.2,
  },

  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
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
    marginBottom: 2,
    letterSpacing: -0.1,
  },

  subjectProfessor: {
    fontSize: 11,
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
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  progressValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
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
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  achievementContent: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementLeft: {
    flex: 1,
    paddingRight: 12,
  },
  achievementBadge: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.2,
    lineHeight: 24,
  },

  achievementDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },

  achievementIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    letterSpacing: -0.2,
  },

  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },

  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
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
    marginBottom: 2,
    letterSpacing: -0.1,
  },

  recordTime: {
    fontSize: 11,
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