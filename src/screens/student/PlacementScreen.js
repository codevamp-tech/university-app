/**
 * PlacementScreen.js
 * ─────────────────────────────────────────────────────────────────
 * Student-facing placement portal for non-medical students.
 * Shows: active drives, my registrations, offers, and resume builder link.
 *
 * APIs:
 *   GET /api/v1/placement/drives
 *   GET /api/v1/placement/registrations
 *   GET /api/v1/placement/offers
 *   POST /api/v1/placement/registrations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import {
  getPlacementDrives,
  getMyPlacementRegistrations,
  getPlacementOffers,
  registerForDrive,
} from '../../data/apiService';

const { width } = Dimensions.get('window');

const STATUS_COLOR = {
  active: '#10B981',
  closed: '#6B7280',
  completed: '#6366F1',
  offered: '#F59E0B',
  accepted: '#10B981',
  rejected: '#EF4444',
};

const DriveCard = ({ drive, registrationMap, onRegister, isDark, colors }) => {
  const isRegistered = registrationMap[drive.id];
  const statusColor = STATUS_COLOR[drive.status] || '#6B7280';
  const driveDate = drive.drive_date ? new Date(drive.drive_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <View style={[styles.driveCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Company header */}
      <View style={styles.driveHeader}>
        <LinearGradient
          colors={isDark ? ['#1E1B4B', '#312E81'] : ['#EEF2FF', '#E0E7FF']}
          style={styles.driveIconBg}
        >
          <MaterialIcons name="business" size={22} color={isDark ? '#818CF8' : '#4338CA'} />
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.companyName, { color: colors.textPrimary }]}>{drive.company_name}</Text>
          <Text style={[styles.jobRole, { color: colors.textSecondary }]}>{drive.job_role}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{drive.status?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Details row */}
      <View style={styles.driveDetails}>
        {drive.package_lpa && (
          <View style={styles.detailChip}>
            <MaterialIcons name="attach-money" size={13} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{drive.package_lpa} LPA</Text>
          </View>
        )}
        <View style={styles.detailChip}>
          <MaterialIcons name="event" size={13} color={colors.textMuted} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{driveDate}</Text>
        </View>
        {drive.min_cgpa && (
          <View style={styles.detailChip}>
            <MaterialIcons name="school" size={13} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>CGPA ≥ {drive.min_cgpa}</Text>
          </View>
        )}
      </View>

      {/* Register button */}
      {drive.status === 'active' && (
        <TouchableOpacity
          style={[
            styles.registerBtn,
            isRegistered
              ? { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#DCFCE7', borderColor: '#10B981' }
              : { backgroundColor: '#6366F1', borderColor: '#6366F1' },
          ]}
          onPress={() => !isRegistered && onRegister(drive)}
          activeOpacity={isRegistered ? 1 : 0.85}
        >
          <MaterialIcons
            name={isRegistered ? 'check-circle' : 'add-circle-outline'}
            size={16}
            color={isRegistered ? '#10B981' : '#FFF'}
          />
          <Text style={[styles.registerBtnText, { color: isRegistered ? '#10B981' : '#FFF' }]}>
            {isRegistered ? 'Registered' : 'Register'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const OfferCard = ({ offer, isDark, colors }) => {
  const statusColor = STATUS_COLOR[offer.status] || '#6B7280';
  return (
    <View style={[styles.offerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient
        colors={isDark ? ['#064E3B', '#065F46'] : ['#ECFDF5', '#D1FAE5']}
        style={styles.offerIconBg}
      >
        <MaterialCommunityIcons name="trophy" size={24} color={isDark ? '#34D399' : '#059669'} />
      </LinearGradient>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[styles.companyName, { color: colors.textPrimary }]}>{offer.company_name}</Text>
        <Text style={[styles.jobRole, { color: colors.textSecondary }]}>{offer.job_role}</Text>
        <Text style={[styles.packageText, { color: isDark ? '#34D399' : '#059669' }]}>
          {offer.package_lpa} LPA
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>{offer.status?.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const PlacementScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken, user } = useUser();

  const [drives, setDrives] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'offers'

  // Build a lookup map: drive_id -> true
  const registrationMap = React.useMemo(() => {
    const map = {};
    registrations.forEach(r => { map[r.drive_id] = true; });
    return map;
  }, [registrations]);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [drivesData, regsData, offersData] = await Promise.all([
        getPlacementDrives(accessToken),
        getMyPlacementRegistrations(accessToken),
        getPlacementOffers(accessToken),
      ]);
      setDrives(Array.isArray(drivesData) ? drivesData : []);
      setRegistrations(Array.isArray(regsData) ? regsData : []);
      setOffers(Array.isArray(offersData) ? offersData : []);
    } catch (err) {
      console.warn('[PlacementScreen] loadData error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegister = async (drive) => {
    Alert.alert(
      'Register for Drive',
      `Register for ${drive.company_name} — ${drive.job_role}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register',
          onPress: async () => {
            const result = await registerForDrive(accessToken, {
              drive_id: drive.id,
              cgpa: user?.cgpa || null,
            });
            if (result?.success) {
              Alert.alert('✅ Success', 'You have been registered for this drive!');
              loadData();
            } else {
              Alert.alert('Error', result?.error || 'Registration failed. Please try again.');
            }
          },
        },
      ]
    );
  };

  const activeDrives = drives.filter(d => d.status === 'active');
  const myRegisteredCount = registrations.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Placement Portal</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Campus Recruitment & Offers</Text>
        </View>
        <TouchableOpacity
          style={[styles.resumeBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}
          onPress={() => navigation.navigate('ResumeBuilder')}
        >
          <MaterialCommunityIcons name="file-account" size={16} color="#6366F1" />
          <Text style={[styles.resumeBtnText, { color: '#6366F1' }]}>Resume</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Banner */}
      <LinearGradient
        colors={isDark ? ['#1E1B4B', '#2D1B5E', '#1A1A2E'] : ['#4338CA', '#6366F1']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.statsBanner}
      >
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeDrives.length}</Text>
          <Text style={styles.statLabel}>Active Drives</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{myRegisteredCount}</Text>
          <Text style={styles.statLabel}>Registered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{offers.length}</Text>
          <Text style={styles.statLabel}>Offers</Text>
        </View>
      </LinearGradient>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {[
          { key: 'drives', label: 'Drives', icon: 'business-center' },
          { key: 'offers', label: 'My Offers', icon: 'emoji-events' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && { borderBottomColor: '#6366F1', borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialIcons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? '#6366F1' : colors.textMuted}
            />
            <Text style={[styles.tabText, { color: activeTab === tab.key ? '#6366F1' : colors.textMuted }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading placement data…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(); }}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
        >
          {activeTab === 'drives' && (
            <>
              {drives.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="briefcase-off" size={52} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Drives Yet</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    Placement drives will appear here once the placement team announces them.
                  </Text>
                </View>
              ) : (
                drives.map(drive => (
                  <DriveCard
                    key={drive.id}
                    drive={drive}
                    registrationMap={registrationMap}
                    onRegister={handleRegister}
                    isDark={isDark}
                    colors={colors}
                  />
                ))
              )}

              {/* Resume Builder CTA */}
              <TouchableOpacity
                style={[styles.resumeCTA, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('ResumeBuilder')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isDark ? ['#1E1B4B', '#312E81'] : ['#EEF2FF', '#E0E7FF']}
                  style={styles.resumeCTAIcon}
                >
                  <MaterialCommunityIcons name="file-account" size={24} color={isDark ? '#818CF8' : '#4338CA'} />
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.resumeCTATitle, { color: colors.textPrimary }]}>AI Resume Builder</Text>
                  <Text style={[styles.resumeCTASub, { color: colors.textSecondary }]}>
                    Build a placement-ready resume with AI
                  </Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'offers' && (
            <>
              {offers.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="trophy-outline" size={52} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Offers Yet</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    Your placement offers will appear here once a company extends one.
                  </Text>
                </View>
              ) : (
                offers.map(offer => (
                  <OfferCard key={offer.id} offer={offer} isDark={isDark} colors={colors} />
                ))
              )}
            </>
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
  resumeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  resumeBtnText: { fontSize: 12, fontWeight: '700' },

  statsBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    borderRadius: 20, paddingVertical: 20,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },

  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
    marginTop: 10,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
  },
  tabText: { fontSize: 13, fontWeight: '700' },

  scroll: { padding: 16, gap: 14, paddingBottom: 100 },

  centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 13, fontWeight: '500' },

  driveCard: {
    borderRadius: 20, borderWidth: 1, padding: 16, gap: 12,
  },
  driveHeader: { flexDirection: 'row', alignItems: 'center' },
  driveIconBg: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  companyName: { fontSize: 16, fontWeight: '800' },
  jobRole: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '800' },

  driveDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  detailText: { fontSize: 12, fontWeight: '600' },

  registerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, marginTop: 4,
  },
  registerBtnText: { fontSize: 14, fontWeight: '700' },

  offerCard: {
    borderRadius: 20, borderWidth: 1, padding: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  offerIconBg: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  packageText: { fontSize: 16, fontWeight: '900', marginTop: 4 },

  resumeCTA: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, borderWidth: 1, padding: 16,
  },
  resumeCTAIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  resumeCTATitle: { fontSize: 15, fontWeight: '800' },
  resumeCTASub: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  emptyState: {
    borderRadius: 20, borderWidth: 1, padding: 40, alignItems: 'center', gap: 12,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

export default PlacementScreen;
