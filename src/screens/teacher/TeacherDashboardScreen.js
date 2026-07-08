import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Modal, Image, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../context/UserContext';
import { getFacultyTimetable, getFacultyTopics, uploadAvatarAPI, listGrievancesAPI } from '../../data/apiService';
import ActivityRing from '../../components/ActivityRing';
import { getAvatarUrl } from '../../utils/avatar';
import { useHealthMetrics } from '../../hooks/useHealthMetrics';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { icon: 'document-text-outline', label: 'Post Assignment', color: '#EA580C', bgColor: '#FFF7ED' },
  { icon: 'star-outline', label: 'Internal Marks', color: '#F59E0B', bgColor: '#FFFBEB' },
  { icon: 'mail-outline', label: 'Broadcast', color: '#10B981', bgColor: '#F0FDF4' },
];

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

function formatDay(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { weekday: 'short' });
  } catch { return ''; }
}

function formatDayDate(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const dayName = d.toLocaleDateString('en-IN', { weekday: 'long' });
    const dateNum = String(d.getDate()).padStart(2, '0');
    const monthName = d.toLocaleDateString('en-IN', { month: 'short' });
    return `${dayName}, ${dateNum} ${monthName}`;
  } catch { return ''; }
}

const TeacherDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, accessToken, logout, updateAvatarUrl } = useUser();

  const [timetable, setTimetable] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ─── First-time Profile Image Setup Modal State ──────────────────────────────
  const [showAvatarSetup, setShowAvatarSetup] = useState(false);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [raisedIssues, setRaisedIssues] = useState([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  const fetchRaisedIssues = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingIssues(true);
    try {
      const data = await listGrievancesAPI(accessToken);
      if (data) {
        setRaisedIssues(data);
      }
    } catch (error) {
      console.warn('[TeacherDashboard] Failed to fetch issues:', error);
    } finally {
      setIsLoadingIssues(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchRaisedIssues();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRaisedIssues();
    });
    return unsubscribe;
  }, [navigation, fetchRaisedIssues]);

  useEffect(() => {
    if (!user || user.role !== 'teacher') return;

    // Check if the user does not have an avatar
    if (!user.avatar_url) {
      const checkPrompted = async () => {
        try {
          const key = `@teacher_avatar_setup_prompted_${user.emp_id || 'default'}`;
          const prompted = await AsyncStorage.getItem(key);
          if (!prompted) {
            setShowAvatarSetup(true);
          }
        } catch (e) {
          console.warn('[TeacherDashboard] Error checking avatar setup flag:', e);
        }
      };
      checkPrompted();
    }
  }, [user]);

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Permission to access camera roll is required!');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
        setSelectedAvatarUri(pickerResult.assets[0].uri);
      }
    } catch (e) {
      console.warn("Error picking avatar image:", e);
      Alert.alert('Error', 'An error occurred while picking the image.');
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatarUri) {
      Alert.alert('No Image selected', 'Please choose an image to upload.');
      return;
    }
    if (!accessToken) {
      Alert.alert('Auth Error', 'No access token available. Please log in again.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadAvatarAPI(accessToken, selectedAvatarUri);
      if (res.ok && res.json?.success) {
        const secureUrl = res.json.data.avatar_url;
        await updateAvatarUrl(secureUrl);
        
        // Mark prompted
        const key = `@teacher_avatar_setup_prompted_${user?.emp_id || 'default'}`;
        await AsyncStorage.setItem(key, 'true');
        
        setShowAvatarSetup(false);
        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        Alert.alert('Upload Failed', 'Could not upload profile picture. Please try again.');
      }
    } catch (e) {
      console.warn("Error uploading avatar:", e);
      Alert.alert('Error', 'An error occurred while saving your photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSkipAvatar = async () => {
    if (user?.emp_id) {
      try {
        const key = `@teacher_avatar_setup_prompted_${user.emp_id}`;
        await AsyncStorage.setItem(key, 'true');
      } catch (e) {
        console.warn('[TeacherDashboard] Failed to store skip flag:', e);
      }
    }
    setShowAvatarSetup(false);
  };

  // Fitness stats (same values and goals structure as student dashboard)
  const { metrics, goals } = useHealthMetrics();
  const stepsProgress = goals.steps > 0 ? Math.min(metrics.steps / goals.steps, 1) : 0;
  const caloriesProgress = goals.calories > 0 ? Math.min(metrics.calories / goals.calories, 1) : 0;
  const focusProgress = goals.focus > 0 ? Math.min(metrics.focusMinutes / goals.focus, 1) : 0.65;

  const facultyName = user?.name || 'Faculty Member';
  const empId = user?.emp_id || '';
  const department = user?.department || 'Medical Faculty';
  const initials = getInitials(facultyName);

  const loadData = useCallback(async () => {
    if (!accessToken) { setLoading(false); return; }
    setLoading(true);
    try {
      const [ttData, topicsData] = await Promise.all([
        getFacultyTimetable(accessToken, user?.emp_id),
        getFacultyTopics(accessToken),
      ]);
      setTimetable(Array.isArray(ttData) ? ttData : []);
      setTopics(Array.isArray(topicsData) ? topicsData : []);
    } catch (e) {
      console.warn('[TeacherDashboard] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [accessToken, user?.emp_id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Next 4 upcoming timetable slots
  const now = new Date();
  const upcoming = timetable
    .filter(tt => tt.start_time && new Date(tt.start_time) >= now)
    .slice(0, 4);

  // Today's schedule (same day as today)
  const formatLocalDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const todayStr = formatLocalDate(now);
  const todaySlots = timetable.filter(tt => {
    if (!tt.start_time) return false;
    return tt.start_time.split('T')[0] === todayStr;
  });

  let scheduleToShow = todaySlots.length > 0 ? todaySlots : upcoming;
  let isShowingRecent = false;

  if (scheduleToShow.length === 0 && timetable.length > 0) {
    scheduleToShow = [...timetable].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).slice(0, 5);
    isShowingRecent = true;
  }

  // Calculate activeSlot for the top "Next Class" card (actual first future starting class)
  const nextClassSlot = timetable
    .filter(tt => tt.start_time && new Date(tt.start_time) >= now)[0] || null;

  let activeSlot = nextClassSlot;
  let isShowingRecentCard = false;

  if (!activeSlot && timetable.length > 0) {
    const sortedPast = [...timetable]
      .filter(tt => tt.start_time && new Date(tt.start_time) < now)
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    activeSlot = sortedPast[0] || null;
    isShowingRecentCard = true;
  }

  const handleSelectAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access gallery is required to upload profile picture.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (pickerResult.canceled) return;
    const uri = pickerResult.assets[0].uri;
    
    try {
      Alert.alert('Uploading...', 'Uploading profile photo, please wait.');
      const res = await uploadAvatarAPI(accessToken, uri);
      if (res.ok && res.json?.success) {
        const secureUrl = res.json.data.avatar_url;
        await updateAvatarUrl(secureUrl);
        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        Alert.alert('Upload Failed', 'Could not upload profile picture. Please try again.');
      }
    } catch (e) {
      console.warn("Error uploading avatar:", e);
      Alert.alert('Error', 'An error occurred while saving your photo.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: async () => {
            setShowProfileMenu(false);
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }
      ]
    );
  };

  const topicCount = topics.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#1E1B4B', '#312E81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setShowProfileMenu(true)} activeOpacity={0.85}>
              {user?.avatar_url && !user.avatar_url.includes('pravatar.cc') ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={['#EA580C', '#9A3412']}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerName} numberOfLines={1}>
                {facultyName.split(' ').length > 1
                  ? `${facultyName.split(' ')[0]} ${facultyName.split(' ').slice(-1)[0]}`
                  : facultyName}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.settingsIconBtn}
            onPress={() => setShowProfileMenu(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* Dept pill */}
        <View style={styles.deptPill}>
          <Ionicons name="school-outline" size={12} color="rgba(255,255,255,0.8)" />
          <Text style={styles.deptText}>{department}</Text>
          {empId ? <Text style={styles.deptId}>  ·  {empId}</Text> : null}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Next Lecture / Current Card */}
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#EA580C" />
            <Text style={styles.loadingText}>Loading ERP data…</Text>
          </View>
        ) : activeSlot ? (
          <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <View style={[styles.liveIndicator, isShowingRecentCard && { backgroundColor: '#E5E7EB' }]}>
                <View style={[styles.liveDot, isShowingRecentCard && { backgroundColor: '#6B7280' }]} />
                <Text style={[styles.liveText, isShowingRecentCard && { color: '#6B7280' }]}>
                  {isShowingRecentCard ? 'RECENT CLASS' : 'NEXT CLASS'}
                </Text>
              </View>
              <Text style={styles.currentTime}>{formatTime(activeSlot.start_time)}</Text>
            </View>

            <Text style={styles.currentSubject} numberOfLines={2}>
              📚 {activeSlot.subject_name || 'No Subject'}
            </Text>
            <Text style={styles.currentClass}>
              {activeSlot.lecture_type || 'Lecture'} • {formatDayDate(activeSlot.start_time)}
            </Text>
            {activeSlot.topic_name ? (
              <Text style={{ fontSize: 13, color: '#4B5563', marginTop: 4 }} numberOfLines={2}>
                Topic: {activeSlot.topic_name}
              </Text>
            ) : null}

            <View style={styles.currentMeta}>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.metaText}>
                  {formatTime(activeSlot.start_time)} – {formatTime(activeSlot.end_time)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        ) : (
          <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.currentCard}>
            <Text style={styles.emptyCardTitle}>No Upcoming Classes</Text>
            <Text style={styles.emptyCardSub}>Your timetable will appear here once synced from SRMS ERP.</Text>
          </LinearGradient>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Schedule')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.quickActionLabel}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('SalarySlip')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="card-outline" size={20} color="#10B981" />
            </View>
            <Text style={styles.quickActionLabel}>Payslip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('LeaveBalance')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.quickActionLabel}>Leaves</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.quickActionsContainer, { marginTop: -12, marginBottom: 24 }]}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('RaiseIssue')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#EF4444" />
            </View>
            <Text style={styles.quickActionLabel}>Raise Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('TeacherAlerts')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="notifications-outline" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.quickActionLabel}>Campus Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('FacultyOfficialChat')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="chatbubbles-outline" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.quickActionLabel}>Portal Chats</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        <View style={styles.scheduleHeader}>
          <Text style={styles.sectionTitle}>
            {isShowingRecent ? '📅 Recently Synced Schedule' : "📅 Today's Schedule"}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Schedule')} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>See All →</Text>
          </TouchableOpacity>
        </View>

        {scheduleToShow.length > 0 ? (
          <View style={styles.scheduleContainer}>
            {scheduleToShow.slice(0, 5).map((item, index) => (
              <LinearGradient
                key={item.tt_cd || index}
                colors={['#FFFFFF', '#F9FAFB']}
                style={styles.scheduleCard}
              >
                <View style={styles.scheduleTime}>
                  <Text style={styles.scheduleTimeHour}>{formatTime(item.start_time).split(' ')[0]}</Text>
                  <Text style={styles.scheduleTimePeriod}>{formatTime(item.start_time).split(' ')[1]}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#6B7280', marginTop: 3 }}>
                    {formatDay(item.start_time).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.scheduleLine}>
                  <LinearGradient colors={['#EA580C', '#F97316']} style={styles.scheduleDot} />
                  {index < scheduleToShow.length - 1 && <View style={styles.scheduleLineConnector} />}
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleSubject} numberOfLines={1}>{item.subject_name || '—'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 3 }}>
                    <View style={{ backgroundColor: String(item.lecture_type || 'Lecture').toLowerCase().includes('practical') ? '#7C3AED15' : '#EA580C15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: String(item.lecture_type || 'Lecture').toLowerCase().includes('practical') ? '#7C3AED' : '#EA580C' }}>
                        {item.lecture_type || 'LECTURE'}
                      </Text>
                    </View>
                    <Text style={[styles.scheduleDetails, { flex: 1 }]} numberOfLines={1}>
                      {item.topic_name || 'Class session'}
                    </Text>
                  </View>
                  <View style={styles.scheduleMeta}>
                    <Ionicons name="time-outline" size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                    <Text style={styles.scheduleLocation}>
                      {formatTime(item.start_time)} – {formatTime(item.end_time)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            ))}
          </View>
        ) : !loading ? (
          <View style={styles.emptySchedule}>
            <Text style={styles.emptyScheduleText}>No schedule data available from ERP</Text>
          </View>
        ) : null}

        {/* Campus Fitness (same as student app) */}
        <Text style={styles.sectionTitle}>❤️ Campus Fitness</Text>
        <TouchableOpacity
          style={styles.fitnessCard}
          onPress={() => navigation.navigate('FitnessDetail')}
          activeOpacity={0.8}
        >
          <View style={styles.fitnessHeader}>
            <View style={[styles.fitnessIconBg, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="heart-pulse" size={20} color="#EF4444" />
            </View>
            <View style={styles.fitnessHeaderText}>
              <Text style={styles.fitnessTitle}>Daily Movement</Text>
              <Text style={styles.fitnessSub}>
                {metrics.steps.toLocaleString()} / {goals.steps.toLocaleString()} steps today
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </View>

          <View style={styles.fitnessBody}>
            <View style={styles.fitnessRingContainer}>
              <View style={[styles.ringStack, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityRing radius={32} stroke={10} progress={stepsProgress} color="#EF4444" bgColor="#EF444420" />
                <ActivityRing radius={22} stroke={10} progress={caloriesProgress} color="#10B981" bgColor="#10B98120" />
                <ActivityRing radius={12} stroke={10} progress={focusProgress} color="#3B82F6" bgColor="#3B82F620" />
              </View>
            </View>

            <View style={styles.fitnessVDivider} />

            <View style={styles.fitnessGridStats}>
              <View style={styles.fitnessRow}>
                <View style={styles.fitnessItem}>
                  <Text style={styles.fitnessVal}>{metrics.steps.toLocaleString()}</Text>
                  <Text style={styles.fitnessLabel}>STEPS</Text>
                </View>
                <View style={styles.fitnessItem}>
                  <Text style={styles.fitnessVal}>{metrics.calories}</Text>
                  <Text style={styles.fitnessLabel}>KCAL</Text>
                </View>
              </View>
              <View style={[styles.fitnessHDivider, { backgroundColor: '#F3F4F6' }]} />
              <View style={styles.fitnessRow}>
                <View style={styles.fitnessItem}>
                  <Text style={styles.fitnessVal}>{Math.round((metrics.calories / Math.max(1, goals.calories)) * 100)}%</Text>
                  <Text style={styles.fitnessLabel}>MOVE GOAL</Text>
                </View>
                <View style={styles.fitnessItem}>
                  <Text style={styles.fitnessVal}>{metrics.sleepHours}</Text>
                  <Text style={styles.fitnessLabel}>SLEEP (HRS)</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Mental Health Box (same as student app) */}
        <Text style={styles.sectionTitle}>🧠 Mental Health & Wellness</Text>
        <View style={styles.mentallyBox}>
          <View style={styles.mentallyIconCircle}>
            <MaterialCommunityIcons name="brain" size={16} color="#4338CA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mentallyText}>
              "Ready to prioritize your peace? Take a brief mindfulness break or chat with our AI coach."
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('MentallyMain')}>
              <Text style={styles.mentallyAction}>TALK TO MENTALLY</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Topics Taught */}
        {topics.length > 0 && (
          <>
            <View style={styles.scheduleHeader}>
              <Text style={styles.sectionTitle}>📖 Recent Topics Taught</Text>
            </View>
            <View style={styles.scheduleContainer}>
              {topics.slice(0, 3).map((topic, index) => (
                <LinearGradient
                  key={index}
                  colors={['#FFFFFF', '#F9FAFB']}
                  style={styles.topicCard}
                >
                  <View style={styles.topicLeft}>
                    <Text style={styles.topicSubject} numberOfLines={1}>{topic.subject_name}</Text>
                    {topic.comp_name ? (
                      <Text style={styles.topicComp} numberOfLines={2}>{topic.comp_name}</Text>
                    ) : null}
                  </View>
                  <View style={styles.topicRight}>
                    <Text style={styles.topicDate}>{topic.lecture_date || ''}</Text>
                    <Text style={styles.topicType}>{topic.lecture_type || 'Theory'}</Text>
                  </View>
                </LinearGradient>
              ))}
            </View>
          </>
        )}

        {/* Support Tickets Section */}
        <View style={{ marginTop: 8, marginBottom: 24 }}>
          <View style={styles.scheduleHeader}>
            <View>
              <Text style={styles.sectionTitle}>🎫 My Support Tickets</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('RaiseIssue')}>
              <Text style={styles.viewAllText}>+ Raise New</Text>
            </TouchableOpacity>
          </View>

          {isLoadingIssues ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#EA580C" />
              <Text style={styles.loadingText}>Loading tickets...</Text>
            </View>
          ) : raisedIssues.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={36} color="#9CA3AF" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyScheduleText}>No issues raised yet</Text>
            </View>
          ) : (
            <View style={styles.issuesList}>
              {raisedIssues.map((issue) => {
                const statusLower = (issue.status || '').toLowerCase().replace('-', '_');
                let statusColor = '#9CA3AF'; // gray
                if (statusLower === 'pending') statusColor = '#3B82F6'; // blue
                else if (statusLower === 'open') statusColor = '#EF4444'; // red
                else if (statusLower === 'in_progress') statusColor = '#F59E0B'; // orange
                else if (statusLower === 'resolved') statusColor = '#10B981'; // green

                let categoryIcon = 'alert-circle-outline';
                if (issue.category === 'academic') categoryIcon = 'school-outline';
                else if (issue.category === 'technical') categoryIcon = 'laptop';
                else if (issue.category === 'fees') categoryIcon = 'cash-outline';
                else if (issue.category === 'hostel') categoryIcon = 'bed-outline';
                else if (issue.category === 'transport') categoryIcon = 'bus-outline';
                else if (issue.category === 'admin') categoryIcon = 'office-building-outline';
                else if (issue.category === 'safety') categoryIcon = 'shield-check-outline';

                const extractAttachmentUrl = (desc) => {
                  if (!desc) return null;
                  const match = desc.match(/Attachment:\s*(https?:\/\/\S+)/i);
                  return match ? match[1] : null;
                };
                const cleanDescription = (desc) => {
                  if (!desc) return '';
                  return desc.replace(/Attachment:\s*https?:\/\/\S+/gi, '').trim();
                };
                const attachmentUrl = extractAttachmentUrl(issue.description);
                const displayDesc = cleanDescription(issue.description);

                return (
                  <View key={issue.id} style={styles.issueItemCard}>
                    <View style={styles.issueItemHeader}>
                      <View style={[styles.issueIconCircle, { backgroundColor: '#FFF7ED' }]}>
                        <MaterialCommunityIcons name={categoryIcon} size={20} color="#EA580C" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.issueSubject} numberOfLines={1}>
                          {issue.subject}
                        </Text>
                        <Text style={styles.issueCategoryText}>
                          Category: {issue.category.toUpperCase()} • Priority: {issue.priority.toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                          {issue.status.replace(/[-_]/g, ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.issueDesc} numberOfLines={2}>
                      {displayDesc}
                    </Text>

                    {attachmentUrl && (
                      <View style={{ marginTop: 4, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Image
                          source={{ uri: attachmentUrl }}
                          style={{ width: 80, height: 50, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}
                          resizeMode="cover"
                        />
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialCommunityIcons name="paperclip" size={14} color="#EA580C" />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#EA580C' }}>Attachment</Text>
                          </View>
                          <Text style={{ fontSize: 10, color: '#9CA3AF' }}>Uploaded file</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.issueFooter}>
                      <Text style={styles.issueTimeText}>
                        {new Date(issue.created_at).toLocaleDateString()} {new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Profile Dropdown Modal */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={[styles.profileMenu, { top: insets.top + 60 }]}>
            <View style={styles.menuHeader}>
              {user?.avatar_url && !user.avatar_url.includes('pravatar.cc') ? (
                <Image source={{ uri: user.avatar_url }} style={styles.menuAvatar} />
              ) : (
                <View style={styles.menuAvatarFallback}>
                  <Text style={styles.menuAvatarFallbackText}>{initials}</Text>
                </View>
              )}
              <View style={styles.menuHeaderInfo}>
                <Text style={styles.menuName}>{facultyName}</Text>
                <Text style={styles.menuSub}>{empId || 'Teacher Account'}</Text>
                <Text style={styles.menuDept}>{department}</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleSelectAvatar}>
              <Ionicons name="camera-outline" size={20} color="#4B5563" />
              <Text style={styles.menuItemText}>Update Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowProfileMenu(false);
                navigation.navigate('TeacherSettings');
              }}
            >
              <Ionicons name="settings-outline" size={20} color="#4B5563" />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, styles.logoutText]}>Log out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* First-Time Profile Image Setup Modal */}
      <Modal
        visible={showAvatarSetup}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSkipAvatar}
      >
        <View style={styles.avatarModalOverlay}>
          <View style={styles.avatarModalContent}>
            <Text style={styles.avatarModalTitle}>
              Welcome to UniCampus!
            </Text>
            <Text style={styles.avatarModalSubtitle}>
              Let's personalize your profile. Upload a profile photo so your peers and colleagues can recognize you.
            </Text>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handlePickAvatar} 
              style={styles.avatarPreviewContainer}
            >
              <Image 
                source={{ uri: selectedAvatarUri || getAvatarUrl(user?.avatar_url || user?.emp_id) }} 
                style={styles.avatarPreviewImage} 
              />
              <View style={styles.avatarCameraBadge}>
                <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.avatarSelectBtn} 
              onPress={handlePickAvatar}
            >
              <Text style={styles.avatarSelectBtnText}>
                {selectedAvatarUri ? 'Change Photo' : 'Select Photo'}
              </Text>
            </TouchableOpacity>

            <View style={styles.avatarActionsContainer}>
              <TouchableOpacity 
                style={[
                  styles.avatarSaveBtn, 
                  { backgroundColor: selectedAvatarUri ? '#EA580C' : '#E5E7EB' }
                ]} 
                onPress={handleSaveAvatar}
                disabled={!selectedAvatarUri || isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.avatarSaveBtnText}>Save & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.avatarSkipBtn} 
                onPress={handleSkipAvatar}
                disabled={isUploadingAvatar}
              >
                <Text style={styles.avatarSkipBtnText}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 20,
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  settingsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  headerTextGroup: { gap: 2, flex: 1 },
  headerGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  headerName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  deptPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingTop: 10,
  },
  deptText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  deptId: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  performanceRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  perfPill: {
    flex: 1, borderRadius: 24, paddingVertical: 16, paddingHorizontal: 20,
    borderWidth: 1, borderColor: '#FFEDD5', alignItems: 'flex-start',
  },
  perfValue: { fontSize: 26, fontWeight: '900', color: '#9A3412', letterSpacing: -0.5 },
  perfLabel: { fontSize: 9, fontWeight: '800', color: '#9A3412', letterSpacing: 0.5, marginTop: 4 },
  aiInsightBox: {
    marginBottom: 24, borderRadius: 24, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  aiIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(6,95,70,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  aiInsightText: { flex: 1, fontSize: 12, color: '#064E3B', lineHeight: 18 },
  loadingCard: {
    borderRadius: 28, padding: 32, marginBottom: 24,
    backgroundColor: '#FFFFFF', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
  },
  loadingText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  currentCard: {
    borderRadius: 28, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 4,
  },
  currentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#EF4444', letterSpacing: 0.5 },
  currentTime: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  currentSubject: {
    fontSize: 20, fontWeight: '900', color: '#111827',
    marginBottom: 4, letterSpacing: -0.5, lineHeight: 26,
  },
  currentClass: { fontSize: 13, color: '#6B7280', marginBottom: 16, fontWeight: '500', lineHeight: 18 },
  currentMeta: { gap: 8, marginBottom: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, color: '#6B7280', fontWeight: '500', lineHeight: 18 },
  primaryBtn: {
    borderRadius: 40, overflow: 'hidden',
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  emptyCardTitle: { fontSize: 16, fontWeight: '700', color: '#374151', textAlign: 'center', marginBottom: 6 },
  emptyCardSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 14, letterSpacing: -0.3 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  viewAllText: { fontSize: 13, color: '#EA580C', fontWeight: '800' },
  scheduleContainer: { gap: 10, marginBottom: 24 },
  scheduleCard: {
    flexDirection: 'row', gap: 12, padding: 16, borderRadius: 24,
    borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
  },
  scheduleTime: { width: 55, alignItems: 'flex-end' },
  scheduleTimeHour: { fontSize: 15, fontWeight: '800', color: '#EA580C', letterSpacing: -0.3 },
  scheduleTimePeriod: { fontSize: 10, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  scheduleLine: { alignItems: 'center', width: 18, position: 'relative' },
  scheduleDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, borderWidth: 2, borderColor: '#FFFFFF' },
  scheduleLineConnector: { position: 'absolute', top: 20, width: 2, height: 60, backgroundColor: '#F3F4F6' },
  scheduleInfo: { flex: 1 },
  scheduleSubject: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2, letterSpacing: -0.2 },
  scheduleDetails: { fontSize: 12, color: '#6B7280', marginBottom: 4, fontWeight: '500', lineHeight: 16 },
  scheduleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scheduleLocation: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  emptySchedule: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24 },
  emptyScheduleText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  topicCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  topicLeft: { flex: 1, marginRight: 12 },
  topicSubject: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 4 },
  topicComp: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  topicRight: { alignItems: 'flex-end' },
  topicDate: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  topicType: {
    fontSize: 10, fontWeight: '700', color: '#EA580C',
    backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  fitnessCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
  },
  fitnessHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  fitnessIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  fitnessHeaderText: { flex: 1 },
  fitnessTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  fitnessSub: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  fitnessBody: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  fitnessRingContainer: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  ringStack: { position: 'relative', width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
  fitnessVDivider: { width: 1, height: 60, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
  fitnessGridStats: { flex: 1, gap: 10 },
  fitnessRow: { flexDirection: 'row', justifyContent: 'space-between' },
  fitnessItem: { flex: 1 },
  fitnessVal: { fontSize: 16, fontWeight: '900', color: '#111827' },
  fitnessLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  fitnessHDivider: { height: 1, backgroundColor: '#F3F4F6' },
  mentallyBox: {
    flexDirection: 'row', gap: 12, padding: 16, borderRadius: 24, marginBottom: 24,
    backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#E0E7FF',
  },
  mentallyIconCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0E7FF',
    justifyContent: 'center', alignItems: 'center',
  },
  mentallyText: { flex: 1, fontSize: 13, color: '#3730A3', lineHeight: 18, fontWeight: '500' },
  mentallyAction: { fontSize: 11, fontWeight: '800', color: '#4338CA', marginTop: 8, letterSpacing: 0.5 },
  avatarImage: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  quickActionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  profileMenu: {
    position: 'absolute',
    right: 20,
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  menuAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#312E81',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuAvatarFallbackText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  menuHeaderInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  menuSub: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 1,
  },
  menuDept: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  logoutItem: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: '#EF4444',
  },
  // ─── First-time Avatar Setup Modal Styles ─────────────────────────────────
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  avatarModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  avatarModalTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
    color: '#111827',
  },
  avatarModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    color: '#4B5563',
  },
  avatarPreviewContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#EA580C',
    padding: 3,
    marginBottom: 16,
    position: 'relative',
  },
  avatarPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    backgroundColor: '#EA580C',
  },
  avatarSelectBtn: {
    borderWidth: 1.5,
    borderColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  avatarSelectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EA580C',
  },
  avatarActionsContainer: {
    width: '100%',
    gap: 12,
  },
  avatarSaveBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSaveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  avatarSkipBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSkipBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  issuesList: {
    gap: 16,
    marginTop: 12,
  },
  issueItemCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  issueItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  issueIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  issueSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  issueCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  issueDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#4B5563',
    marginBottom: 12,
  },
  issueFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    paddingTop: 8,
  },
  issueTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});

export default TeacherDashboardScreen;