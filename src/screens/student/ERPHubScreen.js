import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, Animated, Modal, StatusBar, TextInput, Platform, Alert, RefreshControl,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getAvatarUrl } from "../../utils/avatar";
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { createOutpass, getAlerts, getStudentOutpasses, getResults } from '../../data/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../config/appConfig';
import { getDisplayCourse, getMBBSProfLabel } from '../../utils/courseDisplay';

import { calculateExactMedicalPerformance } from '../../utils/academicPerformance';

const { width } = Dimensions.get('window');

const ERPHubScreen = ({ navigation, route }) => {
  const { user, accessToken } = useUser();
  const student = route?.params?.student || route?.params?.params?.student || user;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const isMedical = student?.course?.replace(/\./g, '').toUpperCase().includes('MBBS') || student?.category?.toLowerCase() === 'medical';
  const isLibraryLocked = true;
  const isStaffOrAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'teacher' || user?.role === 'warden' || !!route?.params?.student || !!route?.params?.params?.student;

  const formatCgpa = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '8.42' : num.toFixed(2);
  };

  const [alerts, setAlerts] = useState([]);
  const [medMarksPct, setMedMarksPct] = useState(46);

  React.useEffect(() => {
    async function loadStoredPct() {
      const stId = student?.id || student?.username || student?.rollno || 'default';
      try {
        if (accessToken) {
          const records = await getResults(accessToken, stId);
          if (records && Array.isArray(records) && records.length > 0) {
            const computed = calculateExactMedicalPerformance(records, student);
            if (computed && computed > 0) {
              setMedMarksPct(computed);
              await AsyncStorage.setItem(`@erp_overall_pct_${stId}`, String(computed));
              return;
            }
          }
        }

        const directPct = await AsyncStorage.getItem(`@erp_overall_pct_${stId}`);
        if (directPct !== null) {
          const val = parseInt(directPct, 10);
          if (!isNaN(val) && val > 0) {
            setMedMarksPct(val);
            return;
          }
        }
        const cacheStr = await AsyncStorage.getItem(`@erp_results_cache_${stId}`);
        if (cacheStr) {
          const parsed = JSON.parse(cacheStr);
          if (parsed?.overallPct) {
            setMedMarksPct(Math.round(parsed.overallPct));
            return;
          }
          if (parsed?.phases && Array.isArray(parsed.phases)) {
            const taken = parsed.phases.filter(p => p.combinedPct !== null);
            if (taken.length > 0) {
              setMedMarksPct(Math.round(taken.reduce((s, p) => s + p.combinedPct, 0) / taken.length));
              return;
            }
          }
        }
      } catch (_) {}
    }
    loadStoredPct();
  }, [accessToken, student?.id, student?.username, student?.rollno]);

  React.useEffect(() => {
    async function loadAlerts() {
      if (!accessToken) return;
      try {
        const res = await getAlerts(accessToken);
        if (res && res.data) {
          setAlerts(res.data);
        }
      } catch (err) {
        console.warn('[ERPHubScreen] Error loading alerts:', err);
      }
    }
    loadAlerts();
  }, [accessToken]);

  const borrowedBooks = React.useMemo(() => {
    return [];
  }, []);


  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Added states for Outpass
  const [gatePassStatus, setGatePassStatus] = useState('idle'); // idle, pending, approved, rejected
  const [activeOutpass, setActiveOutpass] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBusPassModal, setShowBusPassModal] = useState(false);
  const [showLibraryQRModal, setShowLibraryQRModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [outpassForm, setOutpassForm] = useState({ 
    reason: '', 
    duration: 'Single Day',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '18:00',
    hours: '2'
  });
  const [myOutpasses, setMyOutpasses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  // Track image load errors for avatar fallback (Android 13 / MIUI 14 TLS compatibility fix)
  const [studentImgErr, setStudentImgErr] = useState(false);
  const [userImgErr, setUserImgErr] = useState(false);

  const loadOutpassStatus = async () => {
    if (!accessToken) return;
    try {
      const res = await getStudentOutpasses(accessToken);
      if (res && res.length > 0) {
        setMyOutpasses(res);
        const latest = res[0];
        setActiveOutpass(latest);
        const status = latest.status?.toLowerCase();
        if (status === 'pending') {
          setGatePassStatus('pending');
        } else if (status === 'approved') {
          setGatePassStatus('approved');
        } else if (status === 'rejected') {
          setGatePassStatus('rejected');
        } else {
          setGatePassStatus('idle');
        }
      } else {
        setGatePassStatus('idle');
        setActiveOutpass(null);
        setMyOutpasses([]);
      }
    } catch (err) {
      console.warn('[ERPHubScreen] Error loading outpasses:', err);
    }
  };

  React.useEffect(() => {
    loadOutpassStatus();
  }, [accessToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const resAlerts = await getAlerts(accessToken);
      if (resAlerts && resAlerts.data) {
        setAlerts(resAlerts.data);
      }
    } catch (err) { }
    await loadOutpassStatus();
    setRefreshing(false);
  };

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setDrawerVisible(false));
  };

  const drawerItems = [
    { icon: 'person-outline', label: 'My Profile', action: () => { } },
    { icon: 'settings', label: 'Settings', action: () => { closeDrawer(); navigation.navigate('Settings'); } },
    { icon: 'help-outline', label: 'Help Center', action: () => { closeDrawer(); navigation.navigate('HelpCenter'); } },
    { icon: 'shield', label: 'Privacy', action: () => { closeDrawer(); navigation.navigate('Privacy'); } },
    { icon: 'home', label: 'Back to Home', action: () => { closeDrawer(); navigation.navigate('StudentMain'); } },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />


      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.logoIconBg}>
            <MaterialIcons name="account-balance-wallet" size={18} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>ERP Hub</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
          </View>
        </View>
        <View style={styles.headerRight} />
      </View>



      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >

        {/* Hero Banner */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={isDark ? ['#1A1A2E', '#2D1B5E', '#1A1A2E'] : ['#1E1B4B', '#312E81']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroBg1} />
            <View style={styles.heroBg2} />
            <View style={styles.heroContent}>
              <View style={[styles.heroBadge, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.25)' : 'rgba(255,255,255,0.95)' }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={10} color="#EA580C" />
                <Text style={[styles.heroBadgeText, { color: '#EA580C' }]}>SMART ERP</Text>
              </View>
              <Text style={styles.heroTitle}>Digital Campus{'\n'}Management</Text>
              <Text style={[styles.heroDesc, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.7)' }]}>
                Transit · Library · Fees · Documents — all in one place.
              </Text>
            </View>
            {(() => {
              const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
              const displaySem = student?.semester ? (roman[student.semester - 1] || student.semester) : 'VII';
              const displayCgpa = formatCgpa(student?.cgpa);
              const displayBranch = student?.branch && student.branch !== '-'
                ? student.branch.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 4)
                : student?.course && student.course.replace(/\./g, '').toUpperCase().includes('MBBS')
                  ? 'MBBS'
                  : student?.course
                    ? student.course.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 4)
                    : 'CSE';

              // For MBBS: compute year from semester and show Prof label
              const medYear = student?.year || student?.current_year || (student?.semester ? Math.ceil(parseInt(student.semester) / 2) : 1);
              const profLabel = getMBBSProfLabel(medYear);

              return (
                <View style={[styles.heroStats, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)' }]}>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>{isMedical ? profLabel : displaySem}</Text>
                    <Text style={styles.heroStatLabel}>{isMedical ? 'PROF YEAR' : 'SEMESTER'}</Text>
                  </View>
                  <View style={[styles.heroStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' }]} />
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>
                      {isMedical ? `${medMarksPct}%` : displayCgpa}
                    </Text>
                    <Text style={styles.heroStatLabel}>{isMedical ? 'MARKS %' : 'CGPA'}</Text>
                  </View>
                  <View style={[styles.heroStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' }]} />
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>{displayBranch}</Text>
                    <Text style={styles.heroStatLabel}>{isMedical ? 'COURSE' : 'BRANCH'}</Text>
                  </View>
                </View>
              );
            })()}
          </LinearGradient>
        </View>



        {/* Smart Bus Pass */}
        {!isMedical && !isStaffOrAdmin && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Transit & Access</Text>
            <LinearGradient
              colors={isDark ? ['#1E1B4B', '#111827'] : ['#EEF2FF', '#E0E7FF']}
              style={[styles.busPassCard, { borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}
            >

              <View style={styles.busPassTop}>
                <View style={[styles.busPassBadge, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(67,56,202,0.1)' }]}>
                  <View style={styles.liveDot} />
                  <Text style={[styles.busPassBadgeText, { color: isDark ? '#818CF8' : '#4338CA' }]}>LIVE TRANSIT</Text>
                </View>

                <MaterialCommunityIcons name="bus-side" size={28} color={isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(67,56,202,0.3)'} />
              </View>
              <Text style={[styles.busPassTitle, { color: isDark ? '#818CF8' : '#4338CA' }]}>Smart Bus Pass</Text>
              <Text style={[styles.busPassDesc, { color: colors.textSecondary }]}>
                Route 14: City Center → SRMS Campus
              </Text>


              <TouchableOpacity
                style={[styles.showPassBtn, { backgroundColor: isDark ? colors.card : '#FFFFFF', opacity: 0.85 }]}
                onPress={() => Alert.alert('🔒 Demo Lock', 'Bus Pass module is locked in this demo. Contact admin to unlock.')}
              >
                <MaterialIcons name="lock" size={18} color={isDark ? '#818CF8' : '#4338CA'} style={{ marginRight: 6 }} />
                <Text style={[styles.showPassText, { color: isDark ? '#818CF8' : '#4338CA' }]}>Show Pass</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}



        {/* Digital Outpass */}
        {!isStaffOrAdmin && (
          <View style={styles.sectionContainer}>
            <LinearGradient
              colors={isDark ? ['#064E3B', '#065F46'] : ['#F0FDF4', '#DCFCE7']}
              style={[styles.outpassCard, { borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}
            >

              <View style={styles.outpassLeft}>
                <View style={[styles.outpassIconBox, { backgroundColor: isDark ? 'rgba(5,150,105,0.2)' : '#FFFFFF' }]}>
                  <MaterialIcons name="confirmation-number" size={26} color={isDark ? '#34D399' : '#059669'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.outpassTitle, { color: isDark ? '#34D399' : '#059669' }]}>Digital Outpass</Text>
                  <Text style={[styles.outpassDesc, { color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }]}>Request a temporary exit permit for campus gates.</Text>
                </View>

              </View>
              <TouchableOpacity
                style={[
                  styles.outpassBtn,
                  { backgroundColor: gatePassStatus === 'pending' ? '#FEF3C7' : gatePassStatus === 'approved' ? '#ECFDF5' : (isDark ? '#059669' : '#059669') }
                ]}
                onPress={() => {
                  if (gatePassStatus === 'idle') {
                    setShowRequestModal(true);
                  } else if (gatePassStatus === 'approved') {
                    setShowQRModal(true);
                  }
                }}
              >
                <Text style={[styles.outpassBtnText, { color: gatePassStatus === 'pending' ? '#D97706' : gatePassStatus === 'approved' ? '#10B981' : '#FFFFFF' }]}>
                  {gatePassStatus === 'pending' ? 'WAITING...' : gatePassStatus === 'approved' ? 'VIEW PASS' : 'Request New'}
                </Text>
                {gatePassStatus === 'idle' && <MaterialIcons name="arrow-forward" size={14} color="#FFFFFF" />}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* My Outpasses List */}
        {!isStaffOrAdmin && myOutpasses.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>My Outpasses</Text>
            </View>
            {myOutpasses.map((op, idx) => {
              const opStatus = op.status?.toLowerCase() || 'pending';
              const statusColor = opStatus === 'approved' ? colors.success : opStatus === 'rejected' ? colors.danger : colors.warning;
              const statusBg = opStatus === 'approved' ? colors.successLight : opStatus === 'rejected' ? colors.dangerLight : colors.warningLight;
              
              return (
                <View key={op.id || idx} style={[styles.essentialCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 8 }]}>
                  <View style={styles.essentialContent}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.essentialCardTitle, { color: colors.textPrimary, flex: 1 }]}>
                        {op.reason ? op.reason.split(';')[0] : 'Exit Request'}
                      </Text>
                      <View style={[styles.dueBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.dueText, { color: statusColor, textTransform: 'capitalize' }]}>{opStatus}</Text>
                      </View>
                    </View>
                    <Text style={[styles.essentialCardDesc, { color: colors.textSecondary, marginTop: 4 }]}>
                      From: {op.from || 'N/A'}{'\n'}To: {op.to || 'N/A'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}


        {/* Academic Essentials Grid */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Academic Essentials</Text>
          </View>

          <View style={styles.essentialsGrid}>
            {/* Card 1: Attendance */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ERPAttendanceTab', { student })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={isDark ? ['#064E3B', '#047857'] : ['#ECFDF5', '#D1FAE5']} style={styles.gridIconBg}>
                <MaterialCommunityIcons name="shield-check" size={24} color={isDark ? '#34D399' : '#059669'} />
              </LinearGradient>
              <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>Attendance</Text>
              <Text style={[styles.gridCardDesc, { color: colors.textSecondary }]}>
                {student ? student.attendance : 85}% Overall
              </Text>
            </TouchableOpacity>

            {/* Card 1b: Schedule */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ERPScheduleTab', { student })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={isDark ? ['#312E81', '#4338CA'] : ['#EEF2FF', '#C7D2FE']} style={styles.gridIconBg}>
                <MaterialCommunityIcons name="calendar-clock" size={24} color={isDark ? '#818CF8' : '#4F46E5'} />
              </LinearGradient>
              <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>Schedule</Text>
              <Text style={[styles.gridCardDesc, { color: colors.textSecondary }]}>
                Timetable & Classes
              </Text>
            </TouchableOpacity>

            {/* Card 2: Results */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ERPResultsTab', { student })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={isDark ? ['#1E1B4B', '#312E81'] : ['#EEF2FF', '#E0E7FF']} style={styles.gridIconBg}>
                <MaterialIcons name="grade" size={24} color={isDark ? '#818CF8' : '#4338CA'} />
              </LinearGradient>
              <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>Results</Text>
              <Text style={[styles.gridCardDesc, { color: colors.textSecondary }]}>
                {isMedical 
                  ? `Marks: ${medMarksPct}%` 
                  : `CGPA: ${formatCgpa(student?.cgpa)}`}
              </Text>
            </TouchableOpacity>

            {/* Card 3: Fee */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ERPFees', { student })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={isDark ? ['#7C2D12', '#9A3412'] : ['#FFF7ED', '#FFEDD5']} style={styles.gridIconBg}>
                <MaterialIcons name="payment" size={24} color={isDark ? '#FB923C' : '#EA580C'} />
              </LinearGradient>
              <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>Fee</Text>
              <Text style={[styles.gridCardDesc, { color: colors.textSecondary }]}>
                Dues & Ledger
              </Text>
            </TouchableOpacity>

            {/* Card 4: Logbook */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ERPLogBookTab', { student })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={isDark ? ['#0F766E', '#115E59'] : ['#E6FDF9', '#CCFBF1']} style={styles.gridIconBg}>
                <MaterialIcons name="local-hospital" size={24} color={isDark ? '#2DD4BF' : '#0D9488'} />
              </LinearGradient>
              <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>Logbook</Text>
              <Text style={[styles.gridCardDesc, { color: colors.textSecondary }]}>
                Clinical Record
              </Text>
            </TouchableOpacity>

            {/* Card 4b: Foundation Logbook */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('FoundationLogbook', { student })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={isDark ? ['#4C1D95', '#5B21B6'] : ['#F5F3FF', '#EDE9FE']} style={styles.gridIconBg}>
                <MaterialIcons name="auto-stories" size={24} color={isDark ? '#A78BFA' : '#7C3AED'} />
              </LinearGradient>
              <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>Foundation{'\n'}Logbook</Text>
              <Text style={[styles.gridCardDesc, { color: colors.textSecondary }]}>
                Foundation Course
              </Text>
            </TouchableOpacity>

            {/* Card 5: Group Chats */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Chat')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={isDark ? ['#1E3A8A', '#3B82F6'] : ['#E0F2FE', '#BAE6FD']} style={styles.gridIconBg}>
                <MaterialCommunityIcons name="forum-outline" size={24} color={isDark ? '#60A5FA' : '#2563EB'} />
              </LinearGradient>
              <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>Group Chats</Text>
              <Text style={[styles.gridCardDesc, { color: colors.textSecondary }]}>
                Faculty & Peers
              </Text>
            </TouchableOpacity>



            {/* Card 6: Documents */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.85 }]}
              onPress={() => Alert.alert('🔒 Premium Feature', 'Document Vault is locked in this demo. Contact admin to unlock.')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={isDark ? ['#312E81', '#4338CA'] : ['#F5F3FF', '#EDE9FE']} style={styles.gridIconBg}>
                <MaterialIcons name="folder-shared" size={24} color={isDark ? '#A78BFA' : '#7C3AED'} />
              </LinearGradient>
              <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>Documents</Text>
              <Text style={[styles.gridCardDesc, { color: '#EF4444', fontWeight: '700' }]}>
                LOCKED
              </Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Smart Library */}
        {!isStaffOrAdmin && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Smart Library</Text>
            <View style={[styles.libraryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.libraryHeader}>
                <View>
                  <Text style={[styles.libraryTitle, { color: colors.textPrimary }]}>Borrowed Books</Text>
                  <Text style={[styles.librarySubtitle, { color: colors.textSecondary }]}>0 books currently checked out</Text>
                </View>
                <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.libraryIconBg}>
                  <MaterialIcons name="local-library" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>

              {borrowedBooks.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>No books currently checked out</Text>
                </View>
              ) : (
                borrowedBooks.map((book) => (
                  <View key={book.id} style={[styles.bookItem, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border }]}>
                    <LinearGradient colors={isDark ? book.darkColors : book.colors} style={styles.bookCover}>
                      <MaterialCommunityIcons name="book-open-variant" size={22} color={isDark ? book.color : book.color} />
                    </LinearGradient>
                    <View style={styles.bookInfo}>
                      <Text style={[styles.bookTitle, { color: colors.textPrimary }]}>{book.title}</Text>
                      <Text style={[styles.bookAuthor, { color: colors.textSecondary }]}>{book.author}</Text>
                      <View style={styles.bookDueBadge}>
                        <View style={[styles.urgentDot, { backgroundColor: book.urgent ? '#EF4444' : '#22C55E' }]} />
                        <Text style={[styles.bookDueText, { color: book.urgent ? '#EF4444' : '#22C55E' }]}>Due in {book.dueDays} days</Text>
                      </View>
                    </View>
                    {book.urgent ? (
                      <TouchableOpacity style={styles.renewBtn}>
                        <Text style={styles.renewBtnText}>Renew</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.onTimeBadge, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]}>
                        <Text style={[styles.onTimeText, { color: isDark ? '#4ADE80' : '#15803D' }]}>On Time</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Student Library Card */}
        {!isStaffOrAdmin && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Student Library Card</Text>
            <View style={{ borderRadius: 24, overflow: 'hidden' }}>
              <LinearGradient
                colors={['#1A1A2E', '#2D1B5E', '#EA580C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.libraryCardWrapper, isLibraryLocked && { opacity: 0.6 }]}
              >
                <View style={styles.cardCircle1} />
                <View style={styles.cardCircle2} />

                <View style={styles.lcHeader}>
                  <View style={styles.lcUniversityRow}>
                    <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.lcLogoBox}>
                      <MaterialIcons name="school" size={14} color="#FFFFFF" />
                    </LinearGradient>
                    <View>
                      <Text style={styles.lcUniversityName}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
                      <Text style={styles.lcLocation}>{APP_CONFIG.CAMPUS_LOCATION}</Text>
                    </View>
                  </View>
                  <View style={styles.lcCardTypeBadge}>
                    <Text style={styles.lcCardTypeText}>LIBRARY CARD</Text>
                  </View>
                </View>

                <View style={styles.lcStudentRow}>
                  {!studentImgErr ? (
                    <Image
                      source={{ uri: getAvatarUrl(student?.avatar_url || student?.name || student?.id || 'me', student?.rollno) }}
                      style={styles.lcAvatar}
                      onError={() => setStudentImgErr(true)}
                    />
                  ) : (
                    <View style={[styles.lcAvatar, { backgroundColor: '#EA580C', alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 20 }}>
                        {(student?.name || 'S').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.lcStudentInfo}>
                    <Text style={styles.lcStudentName}>{student?.name || 'Aryan Kumar'}</Text>
                    <Text style={styles.lcStudentDept}>
                      {student?.course
                        ? (isMedical ? student.course : `${student.course} ${student.branch ? '- ' + student.branch : ''}`)
                        : 'B.Tech Computer Science & Engineering'}
                    </Text>
                    {(() => {
                      const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
                      const displaySem = student?.semester ? (roman[student.semester - 1] || student.semester) : 'VII';
                      // For MBBS: show current Prof label (e.g. "3rd Prof")
                      const medYear = student?.year || student?.current_year || (student?.semester ? Math.ceil(parseInt(student.semester) / 2) : 1);
                      return (
                        <Text style={styles.lcStudentSem}>
                          {isMedical ? getMBBSProfLabel(medYear) : `Semester ${displaySem}`}  •  Section A
                        </Text>
                      );
                    })()}
                    <View style={styles.lcIdRow}>
                      <Text style={styles.lcIdLabel}>ID: </Text>
                      <Text style={styles.lcIdValue}>{student?.id || `${APP_CONFIG.UNIVERSITY_ID_PREFIX}2024001`}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.lcStatsRow}>
                  <View style={styles.lcStatItem}>
                    <Text style={styles.lcStatValue}>0</Text>
                    <Text style={styles.lcStatLabel}>BORROWED</Text>
                  </View>
                  <View style={styles.lcStatDivider} />
                  <View style={styles.lcStatItem}>
                    <Text style={styles.lcStatValue}>-</Text>
                    <Text style={styles.lcStatLabel}>BOOKS READ</Text>
                  </View>
                  <View style={styles.lcStatDivider} />
                  <View style={styles.lcStatItem}>
                    <Text style={styles.lcStatValue}>₹0</Text>
                    <Text style={[styles.lcStatLabel, { color: '#FCA5A5' }]}>FINE DUE</Text>
                  </View>
                </View>

                <View style={styles.lcBarcodeRow}>
                  <View style={styles.lcBarcode}>
                    {Array.from({ length: 28 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.lcBarcodeBar,
                          {
                            height: i % 4 === 0 ? 28 : i % 3 === 0 ? 22 : 18,
                            backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                            width: i % 5 === 0 ? 3 : 2,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.lcBarcodeText}>{student?.id ? `${APP_CONFIG.UNIVERSITY_ID_PREFIX}-LIB-${student.id}` : `${APP_CONFIG.UNIVERSITY_ID_PREFIX}-LIB-2024-001`}</Text>
                </View>

                <View style={styles.lcFooterRow}>
                  <View style={styles.lcValidRow}>
                    <MaterialIcons name="event" size={12} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.lcValidText}>Valid until: 31 May 2027</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.lcQRBtn}
                    onPress={() => {
                      if (isLibraryLocked) {
                        Alert.alert('🔒 Access Locked', 'Your library card is locked due to outstanding administrative clearance.');
                      } else {
                        setShowLibraryQRModal(true);
                      }
                    }}
                  >
                    <MaterialIcons name="qr-code-2" size={16} color="#EA580C" />
                    <Text style={styles.lcQRBtnText}>Show QR</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {isLibraryLocked && (
                <View style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  zIndex: 20
                }}>
                  <MaterialCommunityIcons name="card-bulleted-off-outline" size={48} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 12 }}>Library Card Locked</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                    Your library clearance status is locked. Please contact the administrative desk to resolve outstanding updates.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Recent Alerts */}
        {!isStaffOrAdmin && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Recent Alerts</Text>
            <View style={[styles.alertsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

              {alerts.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>No recent alerts</Text>
                </View>
              ) : (
                alerts.slice(0, 3).map((alert, idx) => (
                  <View key={alert.id || idx}>
                    <View style={styles.alertItem}>
                      <View style={[styles.alertIconBox, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : '#FFF7ED' }]}>
                        <MaterialIcons name={alert.type === 'urgent' ? 'error-outline' : 'notifications-none'} size={16} color={colors.primary} />
                      </View>
                      <View style={styles.alertContent}>
                        <View style={styles.alertTitleRow}>
                          <Text style={[styles.alertItemTitle, { color: colors.textPrimary }]}>{alert.title || 'Notification'}</Text>
                          {alert.type && (
                            <Text style={[styles.alertTag, { color: colors.primary, backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : '#FFF7ED' }]}>
                              {alert.type.toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <Text style={[styles.alertItemDesc, { color: colors.textSecondary }]}>
                          {alert.message || alert.content || ''}
                        </Text>
                      </View>
                    </View>
                    {idx < alerts.length - 1 && <View style={[styles.alertDivider, { backgroundColor: colors.border }]} />}
                  </View>
                ))
              )}

              {alerts.length > 0 && (
                <TouchableOpacity style={[styles.clearAllBtn, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderTopColor: colors.border }]}>
                  <Text style={[styles.clearAllText, { color: colors.textMuted }]}>Clear All Notifications</Text>
                </TouchableOpacity>
              )}

            </View>
          </View>
        )}


        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bus Pass Modal */}
      <Modal
        visible={showBusPassModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBusPassModal(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={[styles.qrContainer, { backgroundColor: colors.card }]}>
            <View style={styles.qrHeader}>
              <Text style={[styles.qrTitle, { color: colors.textPrimary }]}>Smart Bus Pass</Text>
              <TouchableOpacity onPress={() => setShowBusPassModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrWrapper}>
              <MaterialCommunityIcons name="qrcode" size={200} color={isDark ? '#FFF' : '#111827'} />
              <View style={[styles.qrStatusBadge, { backgroundColor: '#4338CA' }]}>
                <Text style={styles.qrStatusText}>ROUTE 14: CAMPUS EXPRESS</Text>
              </View>
            </View>

            <View style={styles.qrInfo}>
              <Text style={[styles.qrInfoName, { color: colors.textPrimary }]}>Aryan Kumar</Text>
              <Text style={[styles.qrInfoSub, { color: colors.textSecondary }]}>Valid until End of Semester</Text>
            </View>

            <TouchableOpacity
              style={[styles.qrDownloadBtn, { backgroundColor: '#4338CA' }]}
              onPress={() => setShowBusPassModal(false)}
            >
              <Text style={styles.qrDownloadText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Gate Pass QR Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={[styles.qrContainer, { backgroundColor: colors.card }]}>
            <View style={styles.qrHeader}>
              <Text style={[styles.qrTitle, { color: colors.textPrimary }]}>Exit Gate Pass</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrWrapper}>
              <MaterialCommunityIcons name="qrcode" size={200} color={isDark ? '#FFF' : '#111827'} />
              <View style={styles.qrStatusBadge}>
                <Text style={styles.qrStatusText}>VALID UNTIL {activeOutpass ? (activeOutpass.to || '10:30 PM') : '10:30 PM'}</Text>
              </View>
            </View>

            <View style={styles.qrInfo}>
              <Text style={[styles.qrInfoName, { color: colors.textPrimary }]}>{user?.name || 'Student'}</Text>
              {/* <Text style={[styles.qrInfoSub, { color: colors.textSecondary }]}>Room 402 • Main Hostel</Text> */}
            </View>

            <TouchableOpacity
              style={[styles.qrDownloadBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowQRModal(false)}
            >
              <Text style={styles.qrDownloadText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Library QR Modal */}
      <Modal
        visible={showLibraryQRModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLibraryQRModal(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={[styles.qrContainer, { backgroundColor: colors.card }]}>
            <View style={styles.qrHeader}>
              <Text style={[styles.qrTitle, { color: colors.textPrimary }]}>Library Card QR</Text>
              <TouchableOpacity onPress={() => setShowLibraryQRModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrWrapper}>
              <MaterialCommunityIcons name="qrcode" size={200} color={isDark ? '#FFF' : '#111827'} />
              <View style={[styles.qrStatusBadge, { backgroundColor: '#EA580C' }]}>
                <Text style={styles.qrStatusText}>
                  {user?.id ? `LIB-${user.id}` : `LIB-2024-001`}
                </Text>
              </View>
            </View>

            <View style={styles.qrInfo}>
              <Text style={[styles.qrInfoName, { color: colors.textPrimary }]}>{user?.name || 'Student'}</Text>
              <Text style={[styles.qrInfoSub, { color: colors.textSecondary }]}>
                {user?.course ? (isMedical ? user.course : `${user.course} ${user.branch ? '- ' + user.branch : ''}`) : 'B.Tech CSE'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.qrDownloadBtn, { backgroundColor: '#EA580C' }]}
              onPress={() => setShowLibraryQRModal(false)}
            >
              <Text style={styles.qrDownloadText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Outpass Request Form Modal */}
      <Modal
        visible={showRequestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.requestModalOverlay}>
          <View style={[styles.requestContainer, { backgroundColor: colors.card }]}>
            <View style={styles.qrHeader}>
              <Text style={[styles.qrTitle, { color: colors.textPrimary }]}>Apply for Outpass</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>REASON FOR EXIT</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g., Grocery shopping, Visiting family..."
                placeholderTextColor={colors.textMuted}
                value={outpassForm.reason}
                onChangeText={(text) => setOutpassForm({ ...outpassForm, reason: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>DURATION</Text>
              <View style={styles.durationRow}>
                {['Few Hours', 'Single Day', 'Multi-Day'].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.durationBtn,
                      { backgroundColor: outpassForm.duration === d ? colors.primary : isDark ? '#1F2937' : '#F1F5F9' }
                    ]}
                    onPress={() => setOutpassForm({ ...outpassForm, duration: d })}
                  >
                    <Text style={[styles.durationBtnText, { color: outpassForm.duration === d ? '#FFF' : colors.textPrimary }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {outpassForm.duration === 'Few Hours' && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>NUMBER OF HOURS</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary, marginBottom: 12 }]}
                    value={outpassForm.hours}
                    onChangeText={(text) => setOutpassForm({ ...outpassForm, hours: text })}
                    placeholder="2"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              )}

              {outpassForm.duration === 'Single Day' && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>DATE (YYYY-MM-DD)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary, marginBottom: 12 }]}
                    value={outpassForm.startDate}
                    onChangeText={(text) => setOutpassForm({ ...outpassForm, startDate: text })}
                    placeholder="2026-12-31"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>START TIME (HH:MM)</Text>
                      <TextInput
                        style={[styles.formInput, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary }]}
                        value={outpassForm.startTime}
                        onChangeText={(text) => setOutpassForm({ ...outpassForm, startTime: text })}
                        placeholder="09:00"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>END TIME (HH:MM)</Text>
                      <TextInput
                        style={[styles.formInput, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary }]}
                        value={outpassForm.endTime}
                        onChangeText={(text) => setOutpassForm({ ...outpassForm, endTime: text })}
                        placeholder="18:00"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>
                </View>
              )}

              {outpassForm.duration === 'Multi-Day' && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>START DATE (YYYY-MM-DD)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary, marginBottom: 12 }]}
                    value={outpassForm.startDate}
                    onChangeText={(text) => setOutpassForm({ ...outpassForm, startDate: text })}
                    placeholder="2026-12-31"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>START TIME (HH:MM)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary, marginBottom: 12 }]}
                    value={outpassForm.startTime}
                    onChangeText={(text) => setOutpassForm({ ...outpassForm, startTime: text })}
                    placeholder="09:00"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>END DATE (YYYY-MM-DD)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary, marginBottom: 12 }]}
                    value={outpassForm.endDate}
                    onChangeText={(text) => setOutpassForm({ ...outpassForm, endDate: text })}
                    placeholder="2026-12-31"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>END TIME (HH:MM)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: colors.border, color: colors.textPrimary }]}
                    value={outpassForm.endTime}
                    onChangeText={(text) => setOutpassForm({ ...outpassForm, endTime: text })}
                    placeholder="18:00"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={async () => {
                if (!outpassForm.reason) return;
                setGatePassStatus('pending');
                try {
                  if (accessToken) {
                    const now = new Date();
                    let exitDate = new Date(now.getTime());
                    let returnDate = new Date(now.getTime());
                    
                    try {
                      if (outpassForm.duration === 'Few Hours') {
                        const hrs = parseInt(outpassForm.hours) || 2;
                        returnDate.setHours(returnDate.getHours() + hrs);
                      } else if (outpassForm.duration === 'Single Day') {
                        const [yyyy, mm, dd] = outpassForm.startDate.split('-');
                        const [sH, sM] = outpassForm.startTime.split(':');
                        const [eH, eM] = outpassForm.endTime.split(':');
                        exitDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), parseInt(sH), parseInt(sM), 0, 0);
                        returnDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), parseInt(eH), parseInt(eM), 0, 0);
                      } else if (outpassForm.duration === 'Multi-Day') {
                        const [sy, sm, sd] = outpassForm.startDate.split('-');
                        const [ey, em, ed] = outpassForm.endDate.split('-');
                        const [sH, sM] = outpassForm.startTime.split(':');
                        const [eH, eM] = outpassForm.endTime.split(':');
                        exitDate = new Date(parseInt(sy), parseInt(sm) - 1, parseInt(sd), parseInt(sH), parseInt(sM), 0, 0);
                        returnDate = new Date(parseInt(ey), parseInt(em) - 1, parseInt(ed), parseInt(eH), parseInt(eM), 0, 0);
                      }
                      
                      if (isNaN(exitDate.getTime())) exitDate = new Date(now.getTime());
                      if (isNaN(returnDate.getTime())) returnDate = new Date(exitDate.getTime() + 2 * 60 * 60 * 1000);
                    } catch (e) {
                      console.warn('Date parsing error', e);
                    }

                    const exit_time = exitDate.toISOString();
                    const return_time = returnDate.toISOString();

                    await createOutpass(accessToken, {
                      reason: `${outpassForm.reason};Out of Campus`,
                      destination: 'Out of Campus',
                      exit_time,
                      return_time
                    });
                    await loadOutpassStatus();
                    setShowRequestModal(false);
                  }
                } catch (err) {
                  console.warn('[ERPHub] Error creating outpass:', err);
                } finally {
                  setShowRequestModal(false);
                }
              }}
            >
              <Text style={styles.submitBtnText}>SEND TO WARDEN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profile Drawer Modal */}
      <Modal visible={drawerVisible} transparent animationType="none" onRequestClose={closeDrawer}>
        <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={closeDrawer}>
          <Animated.View
            style={[styles.drawerContainer, { backgroundColor: colors.card, transform: [{ translateX: slideAnim }] }]}
          >

            <TouchableOpacity activeOpacity={1}>
              <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.drawerHeader}>
{!userImgErr ? (
                  <Image
                    source={{ uri: getAvatarUrl(user?.avatar_url || user?.name || user?.id || 'me', user?.rollno) }}
                    style={styles.drawerAvatar}
                    onError={() => setUserImgErr(true)}
                  />
                ) : (
                  <View style={[styles.drawerAvatar, { backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 28 }}>
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.drawerName}>{user?.name || 'Aryan Kumar'}</Text>
                <Text style={styles.drawerRole}>{getDisplayCourse(user)}</Text>
                <Text style={styles.drawerId}>ID: {user?.id || `${APP_CONFIG.UNIVERSITY_ID_PREFIX}2024001`}</Text>
              </LinearGradient>

              <View style={styles.drawerItems}>
                {drawerItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.drawerItem,
                      item.label === 'Back to Home' && [styles.drawerItemHighlight, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.1)' : '#FFF7ED' }],
                    ]}
                    onPress={item.action}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={22}
                      color={item.label === 'Back to Home' ? '#EA580C' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.drawerItemText,
                        { color: colors.textPrimary },
                        item.label === 'Back to Home' && [styles.drawerItemTextHighlight, { color: '#EA580C' }],
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.label === 'Back to Home' && (
                      <MaterialIcons name="arrow-forward" size={18} color="#EA580C" style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>

                ))}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  essentialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  gridCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  gridIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  gridCardDesc: {
    fontSize: 12,
  },


  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
  },


  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
  },



  scroll: { paddingBottom: 20 },
  sectionContainer: { paddingHorizontal: 16, paddingVertical: 10 },

  sectionHeading: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 14,
    letterSpacing: -0.3,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },


  // Hero Banner
  heroBanner: {
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },

  heroBg1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -60,
  },
  heroBg2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: -20,
  },
  heroContent: {
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  heroStats: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },

  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginTop: 3,
  },
  heroStatDivider: {
    width: 1,
    marginVertical: 4,
  },


  // Bus Pass
  busPassCard: {
    borderRadius: 24,
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  busPassTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  busPassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  busPassBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#4338CA',
    letterSpacing: 1.5,
  },
  busPassTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },

  busPassDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },

  busInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  busInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  busInfoChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  showPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },

  showPassText: {
    fontWeight: '800',
    fontSize: 14,
  },


  // Outpass
  outpassCard: {
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  outpassLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  outpassIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  outpassTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  outpassDesc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },


  outpassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },

  outpassBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // Essential Cards
  essentialCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },

  essentialIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  essentialContent: { flex: 1 },
  essentialCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  essentialCardDesc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },


  essentialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  dueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  dueText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },


  // Library
  libraryCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
  },


  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  libraryTitle: {
    fontSize: 17,
    fontWeight: '900',
  },

  librarySubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  libraryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
  },

  bookCover: {
    width: 46,
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: { flex: 1 },
  bookAuthor: {
    fontSize: 11,
    marginTop: 2,
  },


  bookDueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  urgentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  bookDueText: {
    fontSize: 10,
    fontWeight: '700',
  },
  renewBtn: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  renewBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  onTimeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  onTimeText: {
    fontSize: 10,
    fontWeight: '800',
  },


  // Student Library Card
  libraryCardWrapper: {
    borderRadius: 24,
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  cardCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60,
    right: -60,
  },
  cardCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -40,
    left: -30,
  },
  lcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  lcUniversityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lcLogoBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lcUniversityName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  lcLocation: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  lcCardTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  lcCardTypeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  lcStudentRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  lcAvatar: {
    width: 72,
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  lcStudentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  lcStudentName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  lcStudentDept: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
    lineHeight: 16,
    fontWeight: '600',
  },
  lcStudentSem: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    fontWeight: '500',
  },
  lcIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  lcIdLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  lcIdValue: {
    fontSize: 11,
    color: '#F97316',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lcStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  lcStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  lcStatValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  lcStatLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.8,
    marginTop: 3,
  },
  lcStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 4,
  },
  lcBarcodeRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  lcBarcode: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 36,
    marginBottom: 6,
  },
  lcBarcodeBar: {
    borderRadius: 1,
  },
  lcBarcodeText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  lcFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  lcValidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  lcValidText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
  },
  lcQRBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  lcQRBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },

  // Alerts
  alertsCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
  },

  alertItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  alertIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: { flex: 1 },
  alertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertItemTitle: {
    fontSize: 13,
    fontWeight: '800',
  },

  alertTag: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alertItemDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  alertDivider: {
    height: 1,
    marginVertical: 4,
  },

  clearAllBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '700',
  },


  // Drawer
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  drawerContainer: {
    width: width * 0.78,
    height: '100%',
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    overflow: 'hidden',
  },


  drawerHeader: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  drawerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 14,
  },
  drawerName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  drawerRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    fontWeight: '600',
  },
  drawerId: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    fontWeight: '700',
    letterSpacing: 1,
  },
  drawerItems: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 4,
  },
  drawerItemHighlight: {
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },

  drawerItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  drawerItemTextHighlight: {
    color: '#EA580C',
    fontWeight: '800',
  },

  // QR Modal Styles
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrContainer: {
    width: '100%',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrStatusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginTop: 16,
  },
  qrStatusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  qrInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrInfoName: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  qrInfoSub: {
    fontSize: 14,
    fontWeight: '500',
  },
  qrDownloadBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  qrDownloadText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },

  // Request Modal Styles
  requestModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  requestContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  formInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  durationBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

export default ERPHubScreen;