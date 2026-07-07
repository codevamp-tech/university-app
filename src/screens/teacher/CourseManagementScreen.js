import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { getFacultyTimetable } from '../../data/apiService';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

const CourseManagementScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, accessToken } = useUser();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get current day of the week to set as default
  const getCurrentDay = () => {
    const now = new Date();
    const dayIndex = now.getDay(); // 0 is Sunday, 1 is Monday ...
    const mapped = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return mapped[dayIndex];
  };

  const [selectedDay, setSelectedDay] = useState(getCurrentDay());

  const loadData = useCallback(async () => {
    if (!accessToken) { setLoading(false); return; }
    setLoading(true);
    try {
      const ttData = await getFacultyTimetable(accessToken, user?.emp_id);
      setTimetable(Array.isArray(ttData) ? ttData : []);
    } catch (e) {
      console.warn('[CourseManagementScreen] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [accessToken, user?.emp_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDayFromISO = (isoStr) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return DAYS[date.getDay()];
    }
    return '';
  };

  // Filter slots for the selected day of the week
  const daySlots = timetable.filter(slot => {
    return getDayFromISO(slot.raw_date) === selectedDay;
  });

  const getLectureIcon = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('practical')) return 'flask-outline';
    if (t.includes('clinical')) return 'stethoscope';
    return 'book-open-outline';
  };

  const getLectureColor = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('practical')) return '#7C3AED'; // Purple
    if (t.includes('clinical')) return '#10B981'; // Green
    return '#EA580C'; // Orange
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <LinearGradient
            colors={['#FFF7ED', '#FFEDD5']}
            style={styles.backButtonBg}
          >
            <Ionicons name="arrow-back" size={20} color="#EA580C" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Schedule</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Days Tabs bar */}
      <View style={styles.daysTabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
          {DAYS_OF_WEEK.map((day) => {
            const isActive = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayTab,
                  isActive ? { backgroundColor: '#EA580C' } : { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 }
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayLabel, { color: isActive ? '#FFFFFF' : '#4B5563' }]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>Fetching your weekly schedule...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {daySlots.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="calendar-blank" size={56} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No Classes Scheduled</Text>
              <Text style={styles.emptySub}>You have no lectures or clinical postings scheduled for {selectedDay}.</Text>
            </View>
          ) : (
            daySlots.map((slot, index) => {
              const themeColor = getLectureColor(slot.lecture_type);
              const iconName = getLectureIcon(slot.lecture_type);
              return (
                <LinearGradient
                  key={slot.tt_cd || index}
                  colors={['#FFFFFF', '#F9FAFB']}
                  style={styles.currCard}
                >
                  <View style={styles.currHeader}>
                    <LinearGradient
                      colors={[themeColor + '12', themeColor + '08']}
                      style={styles.currIcon}
                    >
                      <MaterialCommunityIcons name={iconName} size={22} color={themeColor} />
                    </LinearGradient>
                    <LinearGradient
                      colors={[themeColor + '12', themeColor + '08']}
                      style={styles.currTypeBadge}
                    >
                      <Text style={[styles.currTypeText, { color: themeColor }]}>
                        {slot.lecture_type || 'Lecture'}
                      </Text>
                    </LinearGradient>
                  </View>

                  <Text style={styles.currName}>{slot.subject_name}</Text>
                  
                  {slot.topic_name ? (
                    <Text style={styles.currDesc}>{slot.topic_name}</Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.metaText}>
                      {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                    </Text>
                  </View>

                  <View style={styles.facultySection}>
                    <Text style={styles.facultyLabel}>INSTRUCTOR</Text>
                    <View style={styles.facultyInfo}>
                      <LinearGradient
                        colors={['#EA580C', '#9A3412']}
                        style={styles.facultyAvatar}
                      >
                        <Text style={styles.facultyAvatarText}>
                          {slot.faculty_name ? slot.faculty_name.charAt(0) : 'F'}
                        </Text>
                      </LinearGradient>
                      <View>
                        <Text style={styles.facultyName}>{slot.faculty_name || 'Faculty Member'}</Text>
                        <Text style={styles.facultyRole}>{user?.department || 'Physiology Department'}</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  daysTabContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  daysScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4B5563',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  currCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  currHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  currIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  currTypeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  currName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  currDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 16,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '700',
  },
  facultySection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 14,
  },
  facultyLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  facultyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  facultyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facultyAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  facultyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  facultyRole: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default CourseManagementScreen;
