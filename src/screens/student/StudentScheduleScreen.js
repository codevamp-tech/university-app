/**
 * StudentScheduleScreen.js
 * ─────────────────────────────────────────────────────────────────
 * Student weekly class schedule from ERP timetable API.
 * Shows: day tabs, class cards with time, subject, faculty, type,
 * and competency topics being covered.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { APP_CONFIG } from '../../config/appConfig';
import { getStudentSchedule } from '../../data/apiService';

const { width } = Dimensions.get('window');

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TYPE_CONFIG = {
  'Lecture': { color: '#6366F1', bg: '#EEF2FF', darkBg: 'rgba(99,102,241,0.15)', icon: 'book' },
  'Practical': { color: '#10B981', bg: '#ECFDF5', darkBg: 'rgba(16,185,129,0.15)', icon: 'science' },
  'Tutorial': { color: '#F59E0B', bg: '#FFFBEB', darkBg: 'rgba(245,158,11,0.15)', icon: 'groups' },
  'AETCOM': { color: '#EC4899', bg: '#FDF2F8', darkBg: 'rgba(236,72,153,0.15)', icon: 'favorite' },
  'SDL': { color: '#8B5CF6', bg: '#F5F3FF', darkBg: 'rgba(139,92,246,0.15)', icon: 'self-improvement' },
  'default': { color: '#6B7280', bg: '#F3F4F6', darkBg: 'rgba(107,114,128,0.15)', icon: 'school' },
};

// No mock schedule allowed. Data is loaded dynamically via ERP schedule API.

const ClassCard = ({ item, index, isDark, colors }) => {
  const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG.default;
  if (item.type === 'break') {
    return (
      <View style={[styles.breakRow]}>
        <View style={[styles.breakLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.breakLabel, { color: colors.textMuted }]}>{item.subject} · {item.time}</Text>
        <View style={[styles.breakLine, { backgroundColor: colors.border }]} />
      </View>
    );
  }

  return (
    <View style={[styles.classCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.classTypeStrip, { backgroundColor: isDark ? typeConf.darkBg : typeConf.bg }]}>
        <MaterialIcons name={typeConf.icon} size={16} color={typeConf.color} />
        <Text style={[styles.classType, { color: typeConf.color }]}>{item.type}</Text>
      </View>

      <View style={styles.classBody}>
        <View style={styles.classTimeRow}>
          <MaterialIcons name="schedule" size={13} color={colors.textMuted} />
          <Text style={[styles.classTime, { color: colors.textMuted }]}>{item.time}</Text>
          {item.room ? (
            <>
              <Text style={[styles.classTimeDot, { color: colors.textMuted }]}>·</Text>
              <MaterialIcons name="room" size={13} color={colors.textMuted} />
              <Text style={[styles.classTime, { color: colors.textMuted }]}>{item.room}</Text>
            </>
          ) : null}
        </View>

        <Text style={[styles.classSubject, { color: colors.textPrimary }]}>{item.subject}</Text>

        {item.topic ? (
          <View style={styles.classTopicRow}>
            <View style={[styles.topicDot, { backgroundColor: typeConf.color }]} />
            <Text style={[styles.classTopic, { color: colors.textSecondary }]} numberOfLines={2}>{item.topic}</Text>
          </View>
        ) : null}

        {item.faculty ? (
          <View style={styles.classFacultyRow}>
            <MaterialIcons name="person" size={13} color={colors.textMuted} />
            <Text style={[styles.classFaculty, { color: colors.textMuted }]}>{item.faculty}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const StudentScheduleScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();

  const today = new Date().getDay(); // 0=Sun, 1=Mon, …
  const defaultDay = today === 0 || today === 7 ? 'Mon' : DAYS[today - 1];

  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);

  const dayClasses = schedule[selectedDay] || [];
  const lectureCount = dayClasses.filter(c => c.type === 'Lecture').length;
  const practicalCount = dayClasses.filter(c => c.type === 'Practical').length;

  useEffect(() => {
    loadSchedule();
  }, [accessToken]);

  const loadSchedule = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await getStudentSchedule(accessToken);
      if (data && Array.isArray(data) && data.length > 0) {
        // Transform ERP timetable format into our display format
        const mapped = {};
        DAYS.forEach(d => { mapped[d] = []; });
        data.forEach(item => {
          const dayIndex = parseInt(item.day_no || item.DayNo) - 1;
          if (dayIndex >= 0 && dayIndex < DAYS.length) {
            mapped[DAYS[dayIndex]].push({
              time: `${item.from_time || item.FromTime} – ${item.to_time || item.ToTime}`,
              subject: item.subject || item.SubjectName || item.subject_name || 'Class',
              topic: item.topic || item.LectureTopic || item.competency_code || '',
              faculty: item.faculty_name || item.FacultyName || item.emp_name || '',
              type: item.lecture_type || item.LectureType || 'Lecture',
              room: item.room || item.RoomNo || '',
            });
          }
        });
        setSchedule(mapped);
      } else {
        setSchedule({});
      }
    } catch (e) {
      setSchedule({});
    } finally {
      setLoading(false);
    }
  };

  const isMedical = user?.course?.replace(/\./g, '').toUpperCase().includes('MBBS')
    || user?.category?.toLowerCase() === 'medical';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Class Schedule</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>
      </View>

      {/* Hero Summary Card */}
      <View style={styles.heroWrapper}>
        <LinearGradient
          colors={isDark ? ['#064E3B', '#065F46'] : ['#ECFDF5', '#D1FAE5']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroRow}>
            <View>
              <Text style={[styles.heroDate, { color: isDark ? '#34D399' : '#059669' }]}>
                {FULL_DAYS[DAYS.indexOf(selectedDay)]}, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Text>
              <Text style={[styles.heroSub, { color: isDark ? 'rgba(52,211,153,0.7)' : 'rgba(5,150,105,0.7)' }]}>
                {dayClasses.filter(c => c.type !== 'break').length} classes scheduled
              </Text>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStatChip}>
                <MaterialIcons name="book" size={13} color={isDark ? '#818CF8' : '#4338CA'} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#818CF8' : '#4338CA' }}>{lectureCount} Lectures</Text>
              </View>
              <View style={[styles.heroStatChip, { marginTop: 6 }]}>
                <MaterialIcons name="science" size={13} color={isDark ? '#34D399' : '#059669'} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#34D399' : '#059669' }}>{practicalCount} Practicals</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Day Selector */}
      <View style={[styles.daySelector, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {DAYS.map((day) => {
            const isActive = selectedDay === day;
            const isToday = day === defaultDay;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayBtn, {
                  backgroundColor: isActive
                    ? colors.primary
                    : (isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6'),
                  borderColor: isToday && !isActive ? colors.primary : 'transparent',
                  borderWidth: isToday && !isActive ? 1.5 : 0,
                }]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayBtnText, { color: isActive ? '#FFF' : colors.textSecondary }]}>{day}</Text>
                {isToday && <View style={[styles.todayDot, { backgroundColor: isActive ? '#FFF' : colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Class List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}>
          {dayClasses.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="calendar-remove" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No classes today</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Enjoy your free day or catch up on SDL!</Text>
            </View>
          ) : (
            dayClasses.map((item, i) => (
              <ClassCard key={i} item={item} index={i} isDark={isDark} colors={colors} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  heroWrapper: { paddingHorizontal: 16, paddingTop: 16 },
  heroBanner: { borderRadius: 20, padding: 18 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroDate: { fontSize: 18, fontWeight: '800' },
  heroSub: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  heroStats: { alignItems: 'flex-end' },
  heroStatChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },

  daySelector: { paddingVertical: 12, borderBottomWidth: 1 },
  dayBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  dayBtnText: { fontSize: 13, fontWeight: '700' },
  todayDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 4 },

  breakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  breakLine: { flex: 1, height: 1 },
  breakLabel: { fontSize: 11, fontWeight: '600' },

  classCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  classTypeStrip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7 },
  classType: { fontSize: 11, fontWeight: '800' },
  classBody: { padding: 14 },
  classTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  classTime: { fontSize: 12, fontWeight: '500' },
  classTimeDot: { fontSize: 12, marginHorizontal: 2 },
  classSubject: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  classTopicRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  topicDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  classTopic: { flex: 1, fontSize: 13, lineHeight: 19 },
  classFacultyRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  classFaculty: { fontSize: 12, fontWeight: '600' },

  emptyState: { borderRadius: 20, borderWidth: 1, padding: 40, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center' },
});

export default StudentScheduleScreen;
