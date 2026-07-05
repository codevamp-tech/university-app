import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getFacultyAttendance } from '../../data/apiService';
import { useState, useEffect } from 'react';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const OtherTeacherProfileScreen = ({ route, navigation }) => {
  const { teacher } = route.params || {};
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  const [punches, setPunches] = useState([]);
  const [loadingPunches, setLoadingPunches] = useState(true);

  useEffect(() => {
    if (teacher?.emp_id && accessToken) {
      getFacultyAttendance(accessToken, teacher.emp_id)
        .then(data => {
          if (Array.isArray(data)) setPunches(data);
        })
        .catch(err => console.warn('Failed to load punches:', err))
        .finally(() => setLoadingPunches(false));
    } else {
      setLoadingPunches(false);
    }
  }, [teacher, accessToken]);

  if (!teacher) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary, textAlign: 'center', marginTop: 50 }}>
          Teacher not found.
        </Text>
      </SafeAreaView>
    );
  }

  const facultyName = teacher.name || teacher.emp_id || 'Unknown Faculty';
  const department = teacher.department || 'Unknown Department';
  const initials = getInitials(facultyName);
  const avatarColor = '#10B981';

  // Calculate today's attendance
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPunches = punches.filter(p => p.punch_time && p.punch_time.startsWith(todayStr));
  const todaySorted = [...todayPunches].sort((a, b) => new Date(a.punch_time) - new Date(b.punch_time));
  
  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return '—'; }
  };

  const checkInToday = todaySorted.length > 0 ? formatTime(todaySorted[0].punch_time) : '—';
  const checkOutToday = todaySorted.length > 1 ? formatTime(todaySorted[todaySorted.length - 1].punch_time) : '—';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Faculty Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatarContainer, { backgroundColor: avatarColor + '20' }]}>
            <Text style={[styles.avatarInitials, { color: avatarColor }]}>{initials}</Text>
          </View>
          <Text style={[styles.teacherName, { color: colors.textPrimary }]}>{facultyName}</Text>
          <Text style={[styles.teacherDept, { color: colors.textSecondary }]}>{department}</Text>
          {teacher.emp_id && (
            <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{teacher.emp_id}</Text>
            </View>
          )}
        </View>

        {/* Today's Attendance */}
        {teacher.emp_id && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Attendance</Text>
            
            {loadingPunches ? (
              <Text style={{ color: colors.textSecondary }}>Loading...</Text>
            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>CHECK IN</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#10B981' }}>{checkInToday}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>CHECK OUT</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444' }}>{checkOutToday}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Info Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Contact Information</Text>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconBg, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="email-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email Address</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{teacher.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: 'transparent' }]}>
            <View style={[styles.iconBg, { backgroundColor: colors.success + '20' }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={colors.success} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Active</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {teacher.last_login ? new Date(teacher.last_login).toLocaleString() : 'Never'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
  },
  teacherName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  teacherDept: {
    fontSize: 15,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default OtherTeacherProfileScreen;
