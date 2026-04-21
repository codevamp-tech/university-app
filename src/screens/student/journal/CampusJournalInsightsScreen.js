import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CampusJournalInsightsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const chartData = [
    { month: 'JAN', height: '40%' },
    { month: 'FEB', height: '65%' },
    { month: 'MAR', height: '85%', active: true },
    { month: 'APR', height: '55%' },
    { month: 'MAY', height: '95%' },
    { month: 'JUN', height: '75%' },
    { month: 'JUL', height: '45%' },
  ];

  const summary = [
    { icon: 'image-outline', label: 'Photos', value: '128', color: '#EA580C' },
    { icon: 'location-outline', label: 'Places', value: '14', color: '#3b82f6' },
    { icon: 'pencil-outline', label: 'Entries', value: '86', color: '#10b981' },
    { icon: 'heart-outline', label: 'Mind State', value: 'Zen', color: '#f43f5e' },
  ];

  const gridStats = [
    { label: 'JOURNALED DAYS', value: '248', sub: 'Total academic year', bg: '#ffedd5', color: '#9a3412' },
    { label: 'VISITED PLACES', value: '32', sub: 'Campus hotspots', bg: '#ccfbf1', color: '#0f766e' },
    { label: 'WRITTEN WORDS', value: '12.4k', sub: 'Insightful thoughts', bg: '#e0e7ff', color: '#3730a3' },
  ];

  // Simple mock calendar
  const calendarDays = [25, 26, 27, 28, 29, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#EA580C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Journal</Text>
        <TouchableOpacity>
          <MaterialIcons name="local-fire-department" size={28} color="#EA580C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Journal Insights</Text>
          <Text style={styles.screenSub}>Your academic and personal growth journey, visualized.</Text>
        </View>

        {/* Current Streak */}
        <LinearGradient colors={['#EA580C', '#FE9832']} style={styles.streakCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.streakLabel}>CURRENT STREAK</Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakValue}>15</Text>
            <Text style={styles.streakUnit}>Weeks</Text>
          </View>
          <Text style={styles.streakDesc}>You've consistently journaled every week since the semester began. Keep the momentum going!</Text>
          <MaterialIcons name="local-fire-department" size={100} color="rgba(255,255,255,0.2)" style={styles.streakBgIcon} />
        </LinearGradient>

        {/* Longest Streaks */}
        <View style={styles.streakPillsRow}>
          <View style={[styles.streakPill, { borderLeftColor: '#006666' }]}>
            <Text style={styles.pillLabel}>LONGEST DAILY</Text>
            <Text style={styles.pillValue}>42 Days</Text>
          </View>
          <View style={[styles.streakPill, { borderLeftColor: '#4953ac' }]}>
            <Text style={styles.pillLabel}>LONGEST WEEKLY</Text>
            <Text style={styles.pillValue}>18 Weeks</Text>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Journal Entries Over Time</Text>
            <View style={styles.chartToggle}>
              <View style={styles.toggleBtnActive}><Text style={styles.toggleTextActive}>Years</Text></View>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            {chartData.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.barBase, { height: d.height }, d.active && styles.barActive]} />
                <Text style={styles.barLabel}>{d.month}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryGrid}>
            {summary.map((s, i) => (
              <View key={i} style={styles.summaryItem}>
                <Ionicons name={s.icon} size={24} color={s.color} />
                <Text style={styles.summaryValue}>{s.value}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Grid Stats */}
        <View style={styles.gridStats}>
          {gridStats.map((s, i) => (
            <View key={i} style={[styles.gridCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.gridLabel, { color: s.color }]}>{s.label}</Text>
              <Text style={[styles.gridValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.gridSub, { color: s.color }]}>{s.sub}</Text>
            </View>
          ))}
        </View>

        {/* Calendar */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>March 2024</Text>
            <View style={styles.calendarNav}>
              <Ionicons name="chevron-back" size={20} color="#6B7280" />
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </View>
          </View>
          <View style={styles.calendarGrid}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
            {calendarDays.map((d, i) => (
              <View key={i} style={styles.dayCell}>
                <View style={[styles.dayCircle, d === 10 && styles.activeDayCircle]}>
                  <Text style={[styles.dayText, d === 10 && styles.activeDayText, i < 5 && styles.prevMonthText]}>{d}</Text>
                </View>
                {[2, 3, 5, 6, 9].includes(d) && ! (i < 5) && <View style={styles.dot} />}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2c2f30',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleSection: {
    marginBottom: 32,
  },
  screenTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#4953ac',
    letterSpacing: -1,
  },
  screenSub: {
    fontSize: 16,
    color: '#595c5d',
    fontWeight: '600',
    marginTop: 8,
  },
  streakCard: {
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    opacity: 0.8,
    letterSpacing: 2,
    marginBottom: 12,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  streakValue: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  streakUnit: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  streakDesc: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 16,
    lineHeight: 24,
  },
  streakBgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
  },
  streakPillsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  streakPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
  },
  pillValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2c2f30',
    marginTop: 4,
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4953ac',
  },
  chartToggle: {
    backgroundColor: '#f5f6f7',
    padding: 2,
    borderRadius: 20,
  },
  toggleBtnActive: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingHorizontal: 10,
    marginBottom: 32,
  },
  barCol: {
    alignItems: 'center',
    width: 30,
  },
  barBase: {
    width: 20,
    backgroundColor: '#f5f6f7',
    borderRadius: 10,
  },
  barActive: {
    backgroundColor: '#EA580C',
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    marginTop: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f5f6f7',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2c2f30',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  gridStats: {
    gap: 16,
    marginBottom: 32,
  },
  gridCard: {
    padding: 24,
    borderRadius: 24,
    justifyContent: 'center',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    opacity: 0.8,
  },
  gridValue: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8,
  },
  gridSub: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.9,
  },
  calendarSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  calendarTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4953ac',
  },
  calendarNav: {
    flexDirection: 'row',
    gap: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayHeader: {
    width: (width - 100) / 7,
    fontSize: 10,
    fontWeight: '900',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  dayCell: {
    width: (width - 100) / 7,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDayCircle: {
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c2f30',
  },
  activeDayText: {
    color: '#EA580C',
  },
  prevMonthText: {
    color: '#D1D5DB',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EA580C',
    marginTop: 2,
  },
});

export default CampusJournalInsightsScreen;
