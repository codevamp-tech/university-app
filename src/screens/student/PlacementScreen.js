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
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import {
  getErpPlacementDrives,
  getErpPlacementOffers,
  applyForPlacementDrive,
  respondToPlacementOffer,
} from '../../data/apiService';

const { width } = Dimensions.get('window');

const STATUS_COLOR = {
  active: '#10B981',
  open: '#10B981',
  closed: '#6B7280',
  completed: '#6366F1',
  offered: '#F59E0B',
  accepted: '#10B981',
  rejected: '#EF4444',
  applied: '#6366F1',
  shortlisted: '#8B5CF6',
  selected: '#10B981',
};

const normalizeCourse = (c) => (c || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const matchesStudentCourse = (drive, user) => {
  if (!user) return true;
  const userCourses = [
    user.course,
    user.course_name,
    user.course_cd,
    user.course_id,
    user.department,
    user.department_name,
    user.branch,
    user.branch_cd,
  ].filter(Boolean).map(normalizeCourse);

  if (userCourses.length === 0) return true;

  const driveTarget = drive.courses || drive.eligible_courses || drive.eligibility_course_cd;
  if (!driveTarget) return true; // Open to all courses

  let driveCourseList = [];
  if (Array.isArray(driveTarget)) {
    driveCourseList = driveTarget.flatMap(item => (item || '').split(/[,;/|]+/));
  } else if (typeof driveTarget === 'string') {
    driveCourseList = driveTarget.split(/[,;/|]+/);
  }

  const normDriveCourses = driveCourseList.map(normalizeCourse).filter(Boolean);
  if (
    normDriveCourses.length === 0 ||
    normDriveCourses.includes('all') ||
    normDriveCourses.includes('any') ||
    normDriveCourses.includes('allcourses') ||
    normDriveCourses.includes('open')
  ) {
    return true;
  }

  return normDriveCourses.some(dCourse =>
    userCourses.some(sCourse =>
      dCourse === sCourse ||
      (dCourse.length >= 3 && sCourse.length >= 3 && (dCourse.includes(sCourse) || sCourse.includes(dCourse)))
    )
  );
};

const DriveCard = ({ drive, registrationMap, onRegister, onViewApplications, isDark, colors }) => {
  const isRegistered = Boolean(
    registrationMap[drive.id] ||
    registrationMap[drive.drive_id] ||
    drive.is_registered ||
    drive.has_applied ||
    drive.my_application
  );
  const statusColor = STATUS_COLOR[(drive.status || '').toLowerCase()] || '#6B7280';
  const driveDate = drive.drive_date ? new Date(drive.drive_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  
  // Format courses badge text
  const courseBadgeText = React.useMemo(() => {
    const raw = drive.courses || drive.eligible_courses || drive.eligibility_course_cd;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.join(', ');
    }
    if (typeof raw === 'string' && raw.trim()) {
      return raw;
    }
    return 'All Courses';
  }, [drive]);

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
        <View style={[styles.detailChip, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
          <MaterialIcons name="school" size={13} color="#6366F1" />
          <Text style={[styles.detailText, { color: '#6366F1', fontWeight: '700' }]}>Courses: {courseBadgeText}</Text>
        </View>
      </View>

      {/* Already Applied Status (NO apply option for already applied drive) */}
      {isRegistered ? (
        <View style={[styles.alreadyAppliedBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5', borderColor: '#10B981' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <MaterialIcons name="check-circle" size={16} color="#10B981" />
            <Text style={[styles.alreadyAppliedText, { color: isDark ? '#34D399' : '#059669' }]}>
              Application Submitted
            </Text>
          </View>
          <TouchableOpacity
            onPress={onViewApplications}
            style={styles.viewStatusLink}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewStatusLinkText, { color: '#6366F1' }]}>View Status →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Apply Button for unapplied active drive */
        ((drive.status || '').toLowerCase() === 'active' || (drive.status || '').toLowerCase() === 'open') && (
          <TouchableOpacity
            style={[styles.registerBtn, { backgroundColor: '#6366F1', borderColor: '#6366F1' }]}
            onPress={() => onRegister(drive)}
            activeOpacity={0.85}
          >
            <MaterialIcons name="send" size={15} color="#FFF" />
            <Text style={[styles.registerBtnText, { color: '#FFF' }]}>Apply for Drive</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
};

const ApplicationCard = ({ drive, onViewResume, isDark, colors }) => {
  const appStatus = drive.application_status || 'Applied';
  const statusColor = STATUS_COLOR[appStatus.toLowerCase()] || '#6366F1';
  const appliedDate = drive.applied_at
    ? new Date(drive.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : (drive.drive_date ? new Date(drive.drive_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent');

  const isShortlisted = ['shortlisted', 'selected', 'interview', 'offered'].some(s => appStatus.toLowerCase().includes(s));
  const isSelected = ['selected', 'offered'].some(s => appStatus.toLowerCase().includes(s));

  return (
    <View style={[styles.driveCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
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
          <Text style={[styles.statusText, { color: statusColor }]}>{appStatus.toUpperCase()}</Text>
        </View>
      </View>

      {/* Details Row */}
      <View style={styles.driveDetails}>
        {drive.package_lpa && (
          <View style={styles.detailChip}>
            <MaterialIcons name="attach-money" size={13} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{drive.package_lpa} LPA</Text>
          </View>
        )}
        <View style={styles.detailChip}>
          <MaterialIcons name="event-available" size={13} color={colors.textMuted} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>Applied: {appliedDate}</Text>
        </View>
      </View>

      {/* Application Stage Tracker */}
      <View style={[styles.progressTracker, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border }]}>
        <View style={styles.trackerStep}>
          <View style={[styles.trackerDot, { backgroundColor: '#10B981' }]}>
            <MaterialIcons name="check" size={10} color="#FFF" />
          </View>
          <Text style={[styles.trackerLabel, { color: '#10B981', fontWeight: '700' }]}>Submitted</Text>
        </View>
        <View style={[styles.trackerLine, { backgroundColor: '#10B981' }]} />
        <View style={styles.trackerStep}>
          <View style={[styles.trackerDot, { backgroundColor: isShortlisted ? '#10B981' : '#6366F1' }]}>
            {isShortlisted ? (
              <MaterialIcons name="check" size={10} color="#FFF" />
            ) : (
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFF' }} />
            )}
          </View>
          <Text style={[styles.trackerLabel, { color: isShortlisted ? '#10B981' : '#6366F1', fontWeight: '700' }]}>
            Screening
          </Text>
        </View>
        <View style={[styles.trackerLine, { backgroundColor: isSelected ? '#10B981' : (isDark ? '#334155' : '#E2E8F0') }]} />
        <View style={styles.trackerStep}>
          <View style={[styles.trackerDot, { backgroundColor: isSelected ? '#10B981' : (isDark ? '#334155' : '#CBD5E1') }]}>
            <MaterialIcons name={isSelected ? "check" : "event"} size={10} color="#FFF" />
          </View>
          <Text style={[styles.trackerLabel, { color: isSelected ? '#10B981' : colors.textMuted }]}>Interview</Text>
        </View>
      </View>
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
  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'applications' | 'offers'
  const [respondingOffer, setRespondingOffer] = useState(null);

  // Build a lookup map: drive_id -> true
  const registrationMap = React.useMemo(() => {
    const map = {};
    registrations.forEach(r => {
      if (r.drive_id) map[r.drive_id] = true;
      if (r.id) map[r.id] = true;
    });
    return map;
  }, [registrations]);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const studentCourse = user?.course || user?.course_cd || user?.department;
      const candidateIds = Array.from(new Set([
        user?.username,
        user?.emp_id,
        user?.registration_no,
        user?.rollno,
        user?.id,
        user?.user_id,
        user?.email ? user.email.split('@')[0] : null,
        // Match specific roll numbers for known active sessions
        (user?.name === 'Akash Tyagi' || user?.email?.includes('tyagiakash')) ? '2025107400' : null,
      ].filter(Boolean)));

      const [drivesData, offersData] = await Promise.all([
        getErpPlacementDrives(accessToken, 'all', studentCourse, candidateIds),
        getErpPlacementOffers(accessToken, candidateIds),
      ]);
      const rawList = Array.isArray(drivesData) ? drivesData : [];
      // Client-side course match safeguard (for single or multi-course drives)
      const matchingDrives = rawList.filter(d => matchesStudentCourse(d, user));
      setDrives(matchingDrives);
      // Build registrations from drives that have is_registered flag
      setRegistrations(matchingDrives.filter(d => d.is_registered || d.has_applied || d.my_application).map(d => ({ drive_id: d.id || d.drive_id, ...d.my_application })));
      setOffers(Array.isArray(offersData) ? offersData : []);
    } catch (err) {
      console.warn('[PlacementScreen] loadData error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegister = async (drive) => {
    const studentRegNo = user?.username || user?.rollno || user?.registration_no || user?.emp_id || user?.id || '2025107400';
    Alert.alert(
      'Apply for Drive',
      `Apply to ${drive.company_name} — ${drive.job_role}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Now',
          onPress: async () => {
            try {
              await applyForPlacementDrive(accessToken, {
                drive_id: drive.id || drive.drive_id,
                cgpa: user?.cgpa || null,
                student_reg_no: studentRegNo,
                student_name: user?.name || 'Student Applicant',
              });
              Alert.alert('✅ Applied Successfully!', 'Your application has been registered with the placement team.', [
                {
                  text: 'View Applications',
                  onPress: () => setActiveTab('applications'),
                },
                { text: 'OK' },
              ]);
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Application failed. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleOfferRespond = async (offer, action) => {
    const offerId = offer.id || offer.offer_id || offer.application_id;
    setRespondingOffer(offerId);
    try {
      await respondToPlacementOffer(accessToken, offerId, action);
      Alert.alert('Done', action === 'accept' ? '🎉 Offer accepted!' : 'Offer declined.');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update offer.');
    } finally {
      setRespondingOffer(null);
    }
  };

  const activeDrives = drives.filter(d => (d.status || '').toLowerCase() === 'active' || (d.status || '').toLowerCase() === 'open');
  const appliedDrives = drives.filter(d => Boolean(
    d.is_registered ||
    d.has_applied ||
    d.my_application ||
    registrationMap[d.id] ||
    registrationMap[d.drive_id]
  ));

  const TABS = [
    { key: 'drives', label: 'Drives', icon: 'business-center', count: activeDrives.length },
    { key: 'applications', label: 'My Applications', icon: 'assignment-turned-in', count: appliedDrives.length },
    { key: 'offers', label: 'My Offers', icon: 'emoji-events', count: offers.length },
  ];

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

      {/* Stats Banner (Interactive) */}
      <LinearGradient
        colors={isDark ? ['#1E1B4B', '#2D1B5E', '#1A1A2E'] : ['#4338CA', '#6366F1']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.statsBanner}
      >
        <TouchableOpacity
          style={[styles.statItem, activeTab === 'drives' && styles.activeStatItem]}
          onPress={() => setActiveTab('drives')}
          activeOpacity={0.8}
        >
          <Text style={styles.statValue}>{activeDrives.length}</Text>
          <Text style={styles.statLabel}>Active Drives</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity
          style={[styles.statItem, activeTab === 'applications' && styles.activeStatItem]}
          onPress={() => setActiveTab('applications')}
          activeOpacity={0.8}
        >
          <Text style={styles.statValue}>{appliedDrives.length}</Text>
          <Text style={styles.statLabel}>My Applications</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity
          style={[styles.statItem, activeTab === 'offers' && styles.activeStatItem]}
          onPress={() => setActiveTab('offers')}
          activeOpacity={0.8}
        >
          <Text style={styles.statValue}>{offers.length}</Text>
          <Text style={styles.statLabel}>Offers</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && { borderBottomColor: '#6366F1', borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialIcons
              name={tab.icon}
              size={17}
              color={activeTab === tab.key ? '#6366F1' : colors.textMuted}
            />
            <Text style={[styles.tabText, { color: activeTab === tab.key ? '#6366F1' : colors.textMuted }]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: activeTab === tab.key ? '#6366F1' : (isDark ? '#334155' : '#E2E8F0') }]}>
                <Text style={[styles.tabBadgeText, { color: activeTab === tab.key ? '#FFF' : colors.textSecondary }]}>
                  {tab.count}
                </Text>
              </View>
            )}
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
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Drives For Your Course</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    Placement drives matching your course will appear here once announced.
                  </Text>
                </View>
              ) : (
                drives.map((drive, idx) => (
                  <DriveCard
                    key={drive.id ? String(drive.id) : (drive.drive_id ? String(drive.drive_id) : `drive_${idx}`)}
                    drive={drive}
                    registrationMap={registrationMap}
                    onRegister={handleRegister}
                    onViewApplications={() => setActiveTab('applications')}
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

          {activeTab === 'applications' && (
            <>
              {appliedDrives.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={52} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Applications Yet</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    You haven't applied to any drives yet. Browse the active drives tab to submit your application.
                  </Text>
                  <TouchableOpacity
                    style={[styles.emptyActionBtn, { backgroundColor: '#6366F1' }]}
                    onPress={() => setActiveTab('drives')}
                  >
                    <Text style={styles.emptyActionBtnText}>Browse Active Drives</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                appliedDrives.map((drive, idx) => (
                  <ApplicationCard
                    key={drive.id ? `app_${drive.id}` : (drive.drive_id ? `app_${drive.drive_id}` : `app_${idx}`)}
                    drive={drive}
                    onViewResume={() => navigation.navigate('ResumeBuilder')}
                    isDark={isDark}
                    colors={colors}
                  />
                ))
              )}
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
                offers.map((offer, idx) => {
                  const offerKey = offer.id || offer.offer_id || offer.application_id || `offer_${idx}`;
                  return (
                    <View key={String(offerKey)} style={[styles.offerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <OfferCard offer={offer} isDark={isDark} colors={colors} />
                      {(offer.status === 'pending' || offer.status === 'offered') && (
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                          <TouchableOpacity
                            style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                            onPress={() => handleOfferRespond(offer, 'accept')}
                            disabled={respondingOffer === offerKey}
                          >
                            {respondingOffer === offerKey
                              ? <ActivityIndicator size="small" color="#fff" />
                              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>✓ Accept Offer</Text>}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{ flex: 1, backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#FEE2E2', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' }}
                            onPress={() => handleOfferRespond(offer, 'decline')}
                            disabled={respondingOffer === offerKey}
                          >
                            <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13 }}>✕ Decline</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
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
    borderRadius: 20, paddingVertical: 18,
  },
  statItem: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeStatItem: { backgroundColor: 'rgba(255,255,255,0.15)' },
  statValue: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },

  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
    marginTop: 10,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 12,
  },
  tabText: { fontSize: 12, fontWeight: '700' },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, marginLeft: 2 },
  tabBadgeText: { fontSize: 10, fontWeight: '800' },

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

  alreadyAppliedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  alreadyAppliedText: {
    fontSize: 13,
    fontWeight: '700',
  },
  viewStatusLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewStatusLinkText: {
    fontSize: 12,
    fontWeight: '800',
  },

  progressTracker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginTop: 4,
  },
  trackerStep: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trackerDot: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  trackerLabel: { fontSize: 11 },
  trackerLine: { flex: 1, height: 2, marginHorizontal: 8 },

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
    borderRadius: 20, borderWidth: 1, padding: 36, alignItems: 'center', gap: 12,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyActionBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, marginTop: 6,
  },
  emptyActionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});

export default PlacementScreen;
