import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { SafeStudentAvatar } from '../../components/SafeStudentAvatar';
import { getAvatarUrl } from '../../utils/avatar';

const SectionLabel = ({ title, icon, colors }) => (
  <View style={styles.sectionLabelRow}>
    <MaterialCommunityIcons name={icon} size={15} color={colors.primary} />
    <Text style={[styles.sectionLabelText, { color: colors.primary }]}>{title}</Text>
  </View>
);

const InfoRow = ({ label, value, icon, isDark, colors, isLast }) => (
  <>
    <View style={styles.infoRow}>
      <View style={[styles.iconBubble, { backgroundColor: isDark ? 'rgba(91,75,255,0.18)' : '#EEF0FF' }]}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value || '—'}</Text>
      </View>
    </View>
    {!isLast && <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />}
  </>
);

const PersonalInfoScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useUser();

  const fullName = user?.name || user?.full_name || 'Student';
  const regNo = user?.registration_no || user?.username || '—';
  const rollNo = user?.rollno || '—';
  const dob = user?.dob || '—';
  const gender = user?.gender || '—';
  const email = user?.email_address || user?.email || (regNo !== '—' ? `${regNo}@srms.ac.in` : '—');
  const fatherName = user?.fatherName || user?.father_name || '—';
  const motherName = user?.motherName || user?.mother_name || '—';
  const city = user?.permanentCity || user?.permanent_city || '';
  const state = user?.permanentState || user?.permanent_state || '';
  const address = [city, state].filter(Boolean).join(', ') || '—';
  const residency = user?.residency_type || '—';
  const college = user?.college_name || 'SRMS CET, Bareilly';
  const course = user?.course || '—';
  const branch = user?.branch || '—';
  const semester = user?.semester ? `Sem ${user.semester}` : '—';
  const avatarUrl = getAvatarUrl(user?.avatar_url || user?.name, user?.rollno || user?.username);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F0F1A' : '#F4F6FF' }]}>
      <StatusBar barStyle="light-content" />

      {/* Gradient Header Bar */}
      <LinearGradient
        colors={['#2D2575', '#5B4BFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerBar, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Personal Info</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Hero Profile Card */}
      <LinearGradient
        colors={['#2D2575', '#5B4BFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroRow}>
          <View style={styles.avatarContainer}>
            <SafeStudentAvatar
              uri={avatarUrl}
              rollno={user?.rollno || user?.username}
              name={fullName}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
            </View>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName} numberOfLines={1}>{fullName}</Text>
            <Text style={styles.heroSub} numberOfLines={1}>{course} • {branch}</Text>
            <View style={styles.rollBadge}>
              <MaterialCommunityIcons name="identifier" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.rollBadgeText}>{rollNo}</Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{semester}</Text>
            <Text style={styles.statLabel}>Term</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{user?.cgpa ? Number(user.cgpa).toFixed(2) : '—'}</Text>
            <Text style={styles.statLabel}>CGPA</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statCell}>
            <Text style={styles.statValue} numberOfLines={1}>{residency}</Text>
            <Text style={styles.statLabel}>Residency</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Basic Info */}
        <SectionLabel title="BASIC INFORMATION" icon="account-details" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InfoRow label="Full Name" value={fullName} icon="account" isDark={isDark} colors={colors} />
          <InfoRow label="Registration Number" value={regNo} icon="badge-account" isDark={isDark} colors={colors} />
          <InfoRow label="University Roll No." value={rollNo} icon="school" isDark={isDark} colors={colors} />
          <InfoRow label="Program & Branch" value={`${course} • ${branch}`} icon="book-open-variant" isDark={isDark} colors={colors} />
          <InfoRow label="Date of Birth" value={dob} icon="calendar" isDark={isDark} colors={colors} />
          <InfoRow label="Gender" value={gender} icon="gender-male-female" isDark={isDark} colors={colors} isLast />
        </View>

        {/* Contact & Address */}
        <SectionLabel title="CONTACT & ADDRESS" icon="card-account-mail" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InfoRow label="Official Email" value={email} icon="email" isDark={isDark} colors={colors} />
          <InfoRow label="College Campus" value={college} icon="domain" isDark={isDark} colors={colors} />
          <InfoRow label="Permanent Address" value={address} icon="map-marker" isDark={isDark} colors={colors} />
          <InfoRow label="Residency Status" value={residency} icon="home-city" isDark={isDark} colors={colors} isLast />
        </View>

        {/* Family & Guardian */}
        <SectionLabel title="FAMILY & GUARDIAN" icon="account-group" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InfoRow label="Father's Name" value={fatherName} icon="account-tie" isDark={isDark} colors={colors} />
          <InfoRow label="Mother's Name" value={motherName} icon="account-heart" isDark={isDark} colors={colors} isLast />
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  heroBanner: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 1,
  },
  heroInfo: { flex: 1 },
  heroName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
    fontWeight: '500',
  },
  rollBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.13)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  rollBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 8,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  statSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 2 },
  scroll: { padding: 20, paddingTop: 14 },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 14,
  },
  sectionLabelText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '700' },
  rowDivider: { height: 1, marginLeft: 66 },
});

export default PersonalInfoScreen;
