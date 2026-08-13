import React from 'react';
import { getAvatarUrl } from "../../utils/avatar";
import { SafeStudentAvatar } from '../../components/SafeStudentAvatar';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform, Modal, Switch, TextInput, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { TimelineSkeleton } from '../../components/SkeletonLoader';
import ActivityRing from '../../components/ActivityRing';
import { useUser } from '../../context/UserContext';
import { useNotifications, NotificationBadge } from '../../context/NotificationContext';
import { useHealthMetrics } from '../../hooks/useHealthMetrics';
import { generateAIInsight, generateRoadmap, computeSkillGap, generateDynamicRoadmap, fetchDynamicLLMInsight, enrichRoadmapWithMarks } from '../../data/aiEngine';

import { booksData } from '../student/library/LibraryMainScreen';
import { listGrievancesAPI, deleteGrievanceAPI, uploadAvatarAPI, createOutpass, getStudentOutpasses, getResults, getCompetencyGaps, logMoodAPI, getMoodEntriesAPI } from '../../data/apiService';
import { getDisplayCourse, isMedicalStudent } from '../../utils/courseDisplay';
import { calculateExactMedicalPerformance } from '../../utils/academicPerformance';
import { readCachedMedicalPct } from '../../utils/medicalPctCache';

const { width } = Dimensions.get('window');

const formatTime = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minStr} ${ampm}`;
  } catch (e) {
    return '';
  }
};

const DashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, accessToken, updateAvatarUrl } = useUser();
  const { totalUnreadCount, unreadRequestsCount } = useNotifications();

  // ─── First-time Profile Image Setup Modal State ──────────────────────────────
  const [showAvatarSetup, setShowAvatarSetup] = React.useState(false);
  const [selectedAvatarUri, setSelectedAvatarUri] = React.useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  React.useEffect(() => {
    if (!user || user.role !== 'student') return;

    // Check if the user does not have an avatar
    if (!user.avatar_url) {
      const checkPrompted = async () => {
        try {
          const key = `@avatar_setup_prompted_${user.id}`;
          const prompted = await AsyncStorage.getItem(key);
          if (!prompted) {
            setShowAvatarSetup(true);
          }
        } catch (e) {
          console.warn('[Dashboard] Error checking avatar setup flag:', e);
        }
      };
      checkPrompted();
    }
  }, [user]);

  const [cvButtonText, setCvButtonText] = React.useState('');

  React.useEffect(() => {
    if (!user) return;

    const checkCVState = async () => {
      try {
        const cacheKey = `@ats_resume_${user.id}`;
        const tsKey = `@ats_resume_timestamp_${user.id}`;
        
        const cached = await AsyncStorage.getItem(cacheKey);
        const lastGenStr = await AsyncStorage.getItem(tsKey);
        
        const isMed = isMedicalStudent(user) || (user.course || '').toLowerCase().includes('mbbs') || (user.category || '').toLowerCase().includes('medical');

        if (!cached) {
          setCvButtonText(isMed ? 'Build Clinical CV' : 'View / Build Resume');
        } else if (lastGenStr) {
          const lastGen = parseInt(lastGenStr, 10);
          const oneWeek = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - lastGen >= oneWeek) {
            setCvButtonText(isMed ? 'Rebuild Clinical CV' : 'Rebuild AI Resume');
          } else {
            setCvButtonText(isMed ? 'View Clinical CV' : 'View AI Resume');
          }
        } else {
          setCvButtonText(isMed ? 'View Clinical CV' : 'View AI Resume');
        }
      } catch (e) {
        console.warn('Error checking CV state:', e);
      }
    };

    checkCVState();
    const unsubscribe = navigation.addListener('focus', () => {
      checkCVState();
    });
    return unsubscribe;
  }, [user, navigation]);

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
        const key = `@avatar_setup_prompted_${user.id}`;
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
    if (user?.id) {
      try {
        const key = `@avatar_setup_prompted_${user.id}`;
        await AsyncStorage.setItem(key, 'true');
      } catch (e) {
        console.warn('[Dashboard] Failed to store skip flag:', e);
      }
    }
    setShowAvatarSetup(false);
  };

  // ─── Live Health Metrics ────────────────────────────────────────────────────
  const { metrics, goals } = useHealthMetrics();

  const stepsProgress = goals.steps > 0 ? Math.min(metrics.steps / goals.steps, 1) : 0;
  const caloriesProgress = goals.calories > 0 ? Math.min(metrics.calories / goals.calories, 1) : 0;
  const focusProgress = goals.focus > 0 ? Math.min(metrics.focusMinutes / goals.focus, 1) : 0;

  const [raisedIssues, setRaisedIssues] = React.useState([]);
  const [isLoadingIssues, setIsLoadingIssues] = React.useState(false);

  const fetchRaisedIssues = React.useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingIssues(true);
    try {
      const data = await listGrievancesAPI(accessToken);
      if (data) {
        setRaisedIssues(data);
      }
    } catch (error) {
      console.warn('[Dashboard] Failed to fetch issues:', error);
    } finally {
      setIsLoadingIssues(false);
    }
  }, [accessToken]);

  const handleDeleteIssue = React.useCallback((issueId) => {
    Alert.alert(
      "Delete Ticket",
      "Are you sure you want to delete this support ticket?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGrievanceAPI(accessToken, issueId);
              fetchRaisedIssues(); // Refresh list
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to delete ticket");
            }
          }
        }
      ]
    );
  }, [accessToken, fetchRaisedIssues]);

  React.useEffect(() => {
    fetchRaisedIssues();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRaisedIssues();
    });
    return unsubscribe;
  }, [navigation, fetchRaisedIssues]);

  // ── Dynamic featured books — same course-aware sorting as LibraryMainScreen ──
  const featuredBooks = React.useMemo(() => {
    // Only display books that have a valid pdfUrl
    const validBooks = booksData.filter(b => !!b.pdfUrl);

    if (!user) return validBooks.slice(0, 4);

    const isMed = isMedicalStudent(user) || (user.course || '').toLowerCase().includes('mbbs') || (user.category || '').toLowerCase().includes('medical');

    if (isMed) {
      const medCategories = ['Medicine', 'Medical', 'Anatomy', 'Pathology', 'Pharmacology', 'Nutrition', 'Pharmaceutics', 'Physiology'];
      const filtered = validBooks.filter(b => medCategories.includes(b.category));
      const sorted = filtered.sort((a, b) => {
        const aId = parseInt(a.id, 10);
        const bId = parseInt(b.id, 10);
        if (aId >= 16 && bId < 16) return -1;
        if (aId < 16 && bId >= 16) return 1;
        return aId - bId;
      });
      return sorted.slice(0, 4);
    }

    const courseLower = (user.course || '').toLowerCase();
    const branchLower = (user.branch || '').toLowerCase();
    const categoryLower = (user.category || '').toLowerCase();

    let matchCategories = [];
    if (courseLower.includes('pharma')) {
      matchCategories = ['Pharmacology', 'Pharmaceutics', 'Anatomy', 'Pathology'];
    } else if (branchLower.includes('computer') || branchLower.includes('cse') || branchLower.includes('it') || courseLower.includes('mca') || courseLower.includes('bca') || branchLower.includes('software')) {
      matchCategories = ['Programming', 'Software Engineering', 'AI / ML', 'Computer Science'];
    } else if (branchLower.includes('electronics') || branchLower.includes('ec') || branchLower.includes('ece')) {
      matchCategories = ['Electronics', 'ECE', 'Digital Systems', 'Circuits'];
    } else if (courseLower.includes('mba') || courseLower.includes('bba') || courseLower.includes('com') || courseLower.includes('business')) {
      matchCategories = ['Entrepreneurship', 'Management', 'Finance', 'Business'];
    }

    const sorted = [...validBooks].sort((a, b) => {
      const aMatch = matchCategories.includes(a.category);
      const bMatch = matchCategories.includes(b.category);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
    return sorted.slice(0, 4);
  }, [user]);

  const avatarUrl = getAvatarUrl(user?.avatar_url || user?.name, user?.rollno);
  const isMed = user && (isMedicalStudent(user) || (user.course || '').toLowerCase().includes('mbbs') || (user.category || '').toLowerCase().includes('medical'));
  const [activeMood, setActiveMood] = React.useState(2);

  const [medMarksPct, setMedMarksPct] = React.useState(46);

  useFocusEffect(
    React.useCallback(() => {
      async function loadStoredPct() {
        try {
          const cachedVal = await readCachedMedicalPct(user);
          if (cachedVal !== null && cachedVal > 0) {
            setMedMarksPct(cachedVal);
            return;
          }

          const stId = user?.id || user?.username || user?.rollno || 'default';
          if (accessToken) {
            const records = await getResults(accessToken, stId);
            if (records && Array.isArray(records) && records.length > 0) {
              const computed = calculateExactMedicalPerformance(records);
              if (computed && computed > 0) {
                setMedMarksPct(computed);
                await AsyncStorage.setItem(`@erp_overall_pct_${stId}`, String(computed));
                return;
              }
            }
          }
        } catch (_) {}
      }
      loadStoredPct();
    }, [accessToken, user])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (!accessToken) return;
      let isMounted = true;
      const fetchTodayMood = async () => {
        try {
          const res = await getMoodEntriesAPI(accessToken);
          if (isMounted && res && res.length > 0) {
            const latestMood = res[0];
            const moodDate = new Date(latestMood.created_at);
            const today = new Date();
            if (moodDate.getDate() === today.getDate() && moodDate.getMonth() === today.getMonth() && moodDate.getFullYear() === today.getFullYear()) {
              const apiValToId = {
                 'excited': 0,
                 'happy': 1,
                 'neutral': 2,
                 'stressed': 3,
                 'focused': 0
              };
              if (apiValToId[latestMood.mood] !== undefined) {
                 setActiveMood(apiValToId[latestMood.mood]);
              }
            }
          }
        } catch(e) {
          console.warn("Failed to fetch today's mood:", e);
        }
      };
      fetchTodayMood();
      return () => { isMounted = false; };
    }, [accessToken])
  );

  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const [isHostelMode, setIsHostelMode] = React.useState(false);
  const [gatePassStatus, setGatePassStatus] = React.useState('idle'); // idle, pending, approved
  const [activeOutpass, setActiveOutpass] = React.useState(null);
  const [showQRModal, setShowQRModal] = React.useState(false);
  const [showRequestModal, setShowRequestModal] = React.useState(false);
  const [outpassForm, setOutpassForm] = React.useState({ reason: '', duration: '2 Hours' });
  const [interestsInput, setInterestsInput] = React.useState('');
  const [activeInterests, setActiveInterests] = React.useState('');

  const [roadmapData, setRoadmapData] = React.useState(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = React.useState(false);
  const [pathwayRetriesLeft, setPathwayRetriesLeft] = React.useState(1);
  const [cachedInsight, setCachedInsight] = React.useState(null);
  const [academicResults, setAcademicResults] = React.useState([]);
  const [erpCompetencies, setErpCompetencies] = React.useState(null);

  // Load stored interests and check daily limit status on mount
  React.useEffect(() => {
    if (!user) return;
    
    const loadSavedPathway = async () => {
      try {
        const interestsKey = `@pathway_interests_${user.id}`;
        const stored = await AsyncStorage.getItem(interestsKey);
        if (stored) {
          setActiveInterests(stored);
          setInterestsInput(stored);
        }

        const lastRefined = await AsyncStorage.getItem('@pathway_last_refined');
        if (lastRefined) {
          const daysSince = (Date.now() - parseInt(lastRefined, 10)) / (1000 * 60 * 60 * 24);
          if (daysSince < 1) {
            setPathwayRetriesLeft(0);
          } else {
            setPathwayRetriesLeft(1);
          }
        }
      } catch (e) {
        console.warn('Error loading pathway state:', e);
      }
    };

    loadSavedPathway();
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    const loadInsight = async () => {
      try {
        const key = `@ai_insight_v2_${user.id}`;
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          setCachedInsight(cached);
        } else {
          const freshInsight = await fetchDynamicLLMInsight(user, accessToken);
          if (freshInsight) {
            setCachedInsight(freshInsight);
            await AsyncStorage.setItem(key, freshInsight);
          }
        }
      } catch (e) {
        setCachedInsight(generateAIInsight(user));
      }
    };
    loadInsight();
  }, [user, accessToken]);

  const [loadingCompetencyGaps, setLoadingCompetencyGaps] = React.useState(false);

  const handleFetchCompetencyGaps = async () => {
    setLoadingCompetencyGaps(true);
    try {
      const [resultsData, gapsData] = await Promise.all([
        getResults(accessToken),
        getCompetencyGaps(accessToken)
      ]);
      if (resultsData) {
        setAcademicResults(resultsData);
        await AsyncStorage.setItem('@erp_academic_results_cache', JSON.stringify(resultsData));
      }
      if (gapsData) {
        setErpCompetencies(gapsData);
        await AsyncStorage.setItem('@erp_competency_gaps_cache', JSON.stringify(gapsData));
      }
      Alert.alert("Success", "Clinical competency gaps synchronized successfully!");
    } catch (e) {
      console.warn("Failed to fetch competency gaps:", e);
      Alert.alert("Sync Failed", "Could not synchronize with live ERP server. Please try again.");
    } finally {
      setLoadingCompetencyGaps(false);
    }
  };

  // Load cached ERP results and competency gaps on mount
  React.useEffect(() => {
    async function loadCachedERPData() {
      try {
        const cachedGaps = await AsyncStorage.getItem('@erp_competency_gaps_cache');
        if (cachedGaps) {
          setErpCompetencies(JSON.parse(cachedGaps));
        }
        const cachedResults = await AsyncStorage.getItem('@erp_academic_results_cache');
        if (cachedResults) {
          setAcademicResults(JSON.parse(cachedResults));
        }
      } catch (e) {
        console.warn('Error loading cached ERP data:', e);
      }
    }
    loadCachedERPData();
  }, []);

  const loadPathwayRetries = React.useCallback(async () => {
    try {
      const lastRefined = await AsyncStorage.getItem('@pathway_last_refined');
      if (lastRefined) {
        const daysSince = (Date.now() - parseInt(lastRefined)) / (1000 * 60 * 60 * 24);
        if (daysSince < 1) {
          setPathwayRetriesLeft(0);
        } else {
          setPathwayRetriesLeft(1);
        }
      } else {
        setPathwayRetriesLeft(1);
      }
    } catch (err) {
      console.warn(err);
    }
  }, []);

  React.useEffect(() => {
    loadPathwayRetries();
    const unsubscribe = navigation.addListener('focus', loadPathwayRetries);
    return unsubscribe;
  }, [navigation, loadPathwayRetries]);

  React.useEffect(() => {
    if (!user) return;

    if (!activeInterests) {
      setRoadmapData(generateRoadmap(user, '', academicResults));
      return;
    }

    let isMounted = true;
    setIsGeneratingRoadmap(true);

    generateDynamicRoadmap(user, activeInterests, accessToken)
      .then(data => {
        if (isMounted) {
          setRoadmapData(data);
          setIsGeneratingRoadmap(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) {
          setRoadmapData(generateRoadmap(user, activeInterests, academicResults));
          setIsGeneratingRoadmap(false);
        }
      });

    return () => { isMounted = false; };
  }, [user, activeInterests, academicResults]);

  const loadOutpassStatus = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await getStudentOutpasses(accessToken);
      if (res && res.length > 0) {
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
      }
    } catch (err) {
      console.warn('[DashboardScreen] Error loading outpasses:', err);
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (isHostelMode && accessToken) {
      loadOutpassStatus();
    }
  }, [isHostelMode, accessToken, loadOutpassStatus]);

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (user && accessToken) {
        const key = `@ai_insight_v2_${user.id}`;
        const freshInsight = await fetchDynamicLLMInsight(user, accessToken);
        if (freshInsight) {
          setCachedInsight(freshInsight);
          await AsyncStorage.setItem(key, freshInsight);
        }
      }
    } catch (e) {}

    await Promise.allSettled([
      fetchRaisedIssues(),
      loadOutpassStatus(),
      loadPathwayRetries(),
    ]);
    setRefreshing(false);
  }, [accessToken, user, fetchRaisedIssues, loadOutpassStatus, loadPathwayRetries]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isHostelMode && accessToken) {
        loadOutpassStatus();
      }
    });
    return unsubscribe;
  }, [navigation, isHostelMode, accessToken, loadOutpassStatus]);

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    navigation.replace('Login');
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>

      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={isDark ? ['#9A3412', '#7C2D12'] : ['#EA580C', '#9A3412']}
            style={styles.logoIconBg}
          >
            <MaterialIcons name="school" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, position: 'relative' }]}
            onPress={() => navigation.navigate('Alerts')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            <NotificationBadge count={totalUnreadCount} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => navigation.navigate('CampusJournal')}
          >
            <Image
              source={require('../../../assets/journal-logo.webp')}
              style={styles.journalIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowProfileMenu(true)} style={{ position: 'relative' }}>
            <SafeStudentAvatar
              uri={avatarUrl}
              name={user?.name || 'S'}
              style={[styles.avatarSmall, { borderColor: colors.primary }]}
            />
            {unreadRequestsCount > 0 && (
              <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#FFF' }} />
            )}
          </TouchableOpacity>
        </View>
      </View>



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
          <View style={[styles.profileMenu, { top: insets.top + 50, backgroundColor: colors.card, borderColor: colors.border }]}>

            <View style={styles.menuHeader}>
              <SafeStudentAvatar
                uri={avatarUrl}
                name={user?.name || 'S'}
                style={styles.menuAvatar}
              />
              <View style={{ flex: 1, paddingRight: 4 }}>
                <Text style={[styles.menuName, { color: colors.textPrimary }]} numberOfLines={2} ellipsizeMode="tail">
                  {user?.name || 'Student'}
                </Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>{user?.id || 'Student Account'}</Text>
              </View>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />


            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowProfileMenu(false);
                navigation.navigate('Settings');
              }}
            >
              <MaterialCommunityIcons name="cog-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Settings</Text>

            </TouchableOpacity>



            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="moon-waning-crescent" size={20} color={colors.textSecondary} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Dark Mode</Text>

              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />

            </View>

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="home-city-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Hostel Mode</Text>
              </View>
              <Switch
                value={isHostelMode}
                onValueChange={setIsHostelMode}
                trackColor={{ false: colors.border, true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />


            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}
              onPress={handleLogout}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
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
          <View style={[styles.avatarModalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.avatarModalTitle, { color: colors.textPrimary }]}>
              Welcome to UniCampus!
            </Text>
            <Text style={[styles.avatarModalSubtitle, { color: colors.textSecondary }]}>
              Let's personalize your profile. Upload a profile photo so your peers and faculty can recognize you.
            </Text>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handlePickAvatar} 
              style={[styles.avatarPreviewContainer, { borderColor: colors.primary }]}
            >
              <Image 
                source={{ uri: selectedAvatarUri || avatarUrl }} 
                style={styles.avatarPreviewImage} 
              />
              <View style={[styles.avatarCameraBadge, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.avatarSelectBtn, { borderColor: colors.primary }]} 
              onPress={handlePickAvatar}
            >
              <Text style={[styles.avatarSelectBtnText, { color: colors.primary }]}>
                {selectedAvatarUri ? 'Change Photo' : 'Select Photo'}
              </Text>
            </TouchableOpacity>

            <View style={styles.avatarActionsContainer}>
              <TouchableOpacity 
                style={[
                  styles.avatarSaveBtn, 
                  { backgroundColor: selectedAvatarUri ? colors.primary : colors.border }
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
                <Text style={[styles.avatarSkipBtnText, { color: colors.textSecondary }]}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            </View>
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
                <Text style={styles.qrStatusText}>VALID UNTIL {activeOutpass ? (formatTime(activeOutpass.return_time) || '10:30 PM') : '10:30 PM'}</Text>
              </View>
            </View>

            <View style={styles.qrInfo}>
              <Text style={[styles.qrInfoName, { color: colors.textPrimary }]}>{user?.name || 'Student'}</Text>
              <Text style={[styles.qrInfoSub, { color: colors.textSecondary }]}>{user?.course || 'Room 402'}</Text>
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
                {['2 Hours', '4 Hours', 'Full Day', 'Overnight'].map((d) => (
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
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={async () => {
                if (!outpassForm.reason) return;
                setGatePassStatus('pending');
                try {
                  if (accessToken) {
                    const now = new Date();
                    const exit_time = now.toISOString();
                    const return_time = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
                    await createOutpass(accessToken, {
                      reason: `${outpassForm.reason};Out of Campus`,
                      destination: 'Out of Campus',
                      exit_time,
                      return_time
                    });
                    await loadOutpassStatus();
                  }
                } catch (err) {
                  console.warn('[DashboardScreen] Error creating outpass:', err);
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

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >

        {/* Main User Card with Gradient */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={isDark ? [colors.card, colors.background] : ['#FFFFFF', '#F9FAFB']}
            style={[styles.userCard, { borderColor: colors.border }]}

            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.userCardTop}>
              <View>
                <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Hello, {user?.name?.split(' ')[0] || 'Student'}</Text>
                <Text style={[styles.welcomeSub, { color: colors.textSecondary }]}>{getDisplayCourse(user)}</Text>

              </View>
              <MaterialCommunityIcons name="star-shooting-outline" size={32} color={colors.primary} style={{ opacity: 0.2 }} />
            </View>


            {/* Stats Row */}
            <View style={styles.statsRow}>
              <LinearGradient
                colors={isDark ? ['rgba(234, 88, 12, 0.2)', 'rgba(234, 88, 12, 0.1)'] : ['#FFF7ED', '#FFEDD5']}
                style={[styles.statPillOrange, { borderColor: isDark ? 'rgba(234, 88, 12, 0.3)' : '#FFEDD5' }]}
              >
                <Text style={[styles.statValueOrange, { color: isDark ? '#FB923C' : '#9A3412' }]}>
                  {isMed ? `${medMarksPct}%` : (user?.cgpa || '0.0')}
                </Text>
                <Text style={[styles.statLabelOrange, { color: isDark ? '#FB923C' : '#9A3412' }]}>
                  {isMed ? 'ACADEMIC MARKS' : 'ACADEMIC CGPA'}
                </Text>
              </LinearGradient>
              <LinearGradient
                colors={isDark ? ['rgba(67, 56, 202, 0.2)', 'rgba(67, 56, 202, 0.1)'] : ['#EEF2FF', '#E0E7FF']}
                style={[styles.statPillPurple, { borderColor: isDark ? 'rgba(67, 56, 202, 0.3)' : '#E0E7FF' }]}
              >
                <Text style={[styles.statValuePurple, { color: isDark ? '#818CF8' : '#3730A3' }]}>
                  {user?.social_credits || ((user?.extracurricular?.length || 0) + (user?.leadership?.length || 0)) * 100 + 120}
                </Text>
                <Text style={[styles.statLabelPurple, { color: isDark ? '#818CF8' : '#3730A3' }]}>SOCIAL CREDITS</Text>
              </LinearGradient>
            </View>

            <LinearGradient
              colors={isDark ? ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)'] : ['#ECFDF5', '#D1FAE5']}
              style={[styles.aiSuggestionBox, { borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0' }]}
            >
              <View style={[styles.aiIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6,95,70,0.1)' }]}>
                <MaterialCommunityIcons name="auto-fix" size={20} color={isDark ? '#34D399' : '#065F46'} />
              </View>
              <Text style={[styles.aiSuggestionText, { color: isDark ? '#A7F3D0' : '#064E3B' }]}>
                <Text style={{ fontWeight: '800' }}>AI Insight:</Text> {cachedInsight || 'Connecting to AI Engine...'}
              </Text>
            </LinearGradient>

            {/* Premium Fitness Bar */}
            <TouchableOpacity
              style={[styles.fitnessCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => navigation.navigate('FitnessDetail')}
              activeOpacity={0.8}
            >
              <View style={styles.fitnessHeader}>
                <View style={[styles.fitnessIconBg, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="heart-pulse" size={20} color="#EF4444" />
                </View>
                <View style={styles.fitnessHeaderText}>
                  <Text style={[styles.fitnessTitle, { color: colors.textPrimary }]}>Campus Fitness</Text>
                  <Text style={[styles.fitnessSub, { color: colors.textSecondary }]}>
                    {metrics.steps.toLocaleString()} / {goals.steps.toLocaleString()} steps today
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
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
                      <Text style={[styles.fitnessVal, { color: colors.textPrimary }]}>{metrics.steps.toLocaleString()}</Text>
                      <Text style={[styles.fitnessLabel, { color: colors.textSecondary }]}>STEPS</Text>
                    </View>
                    <View style={styles.fitnessItem}>
                      <Text style={[styles.fitnessVal, { color: colors.textPrimary }]}>{metrics.calories}</Text>
                      <Text style={[styles.fitnessLabel, { color: colors.textSecondary }]}>KCAL</Text>
                    </View>
                  </View>
                  <View style={[styles.fitnessHDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.fitnessRow}>
                    <View style={styles.fitnessItem}>
                      <Text style={[styles.fitnessVal, { color: colors.textPrimary }]}>{Math.round((metrics.calories / Math.max(1, goals.calories)) * 100)}%</Text>
                      <Text style={[styles.fitnessLabel, { color: colors.textSecondary }]}>MOVE GOAL</Text>
                    </View>
                    <View style={styles.fitnessItem}>
                      <Text style={[styles.fitnessVal, { color: colors.textPrimary }]}>{metrics.sleepHours}</Text>
                      <Text style={[styles.fitnessLabel, { color: colors.textSecondary }]}>SLEEP</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

          </LinearGradient>
        </View>
        {isHostelMode && (
          <View style={styles.sectionContainer}>
            <View style={styles.hostelHeaderRow}>
              <View>
                <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>Hostel Connect</Text>
                <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                  Home away from home{user?.room_number ? ` • Room ${user.room_number}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.gatePassBtn,
                  { backgroundColor: gatePassStatus === 'pending' ? '#FEF3C7' : gatePassStatus === 'approved' ? '#ECFDF5' : isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }
                ]}
                onPress={() => {
                  if (gatePassStatus === 'idle') {
                    setShowRequestModal(true);
                  } else if (gatePassStatus === 'approved') {
                    setShowQRModal(true);
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={gatePassStatus === 'pending' ? 'clock-outline' : gatePassStatus === 'approved' ? 'check-circle-outline' : 'qrcode-scan'}
                  size={20}
                  color={gatePassStatus === 'pending' ? '#D97706' : '#10B981'}
                />
                <Text style={[styles.gatePassText, { color: gatePassStatus === 'pending' ? '#D97706' : '#10B981' }]}>
                  {gatePassStatus === 'pending' ? 'WAITING...' : gatePassStatus === 'approved' ? 'VIEW PASS' : 'REQUEST PASS'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hostelGrid}>
              {/* Mess Menu */}
              <TouchableOpacity
                style={[styles.hostelCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', opacity: 0.7 }]}
                onPress={() => Alert.alert('Premium Feature', 'Tonight\'s Mess Menu is locked in this demo.')}
                activeOpacity={0.8}
              >
                <View style={[styles.hostelIconCircle, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                  <MaterialCommunityIcons name="lock" size={20} color={colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hostelCardTitle, { color: colors.textPrimary, textDecorationLine: 'line-through' }]}>Tonight's Dinner</Text>
                  <Text style={[styles.hostelCardSub, { color: colors.textSecondary }]} numberOfLines={1}>Paneer, Dal, Roti, Kheer (Locked)</Text>
                </View>
                <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
              </TouchableOpacity>

              {/* Laundry Status */}
              <TouchableOpacity
                style={[styles.hostelCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', opacity: 0.7 }]}
                onPress={() => Alert.alert('Premium Feature', 'Live Laundry Status is locked in this demo.')}
                activeOpacity={0.8}
              >
                <View style={[styles.hostelIconCircle, { backgroundColor: '#E0E7FF' }]}>
                  <MaterialCommunityIcons name="washing-machine" size={20} color="#4338CA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hostelCardTitle, { color: colors.textPrimary }]}>Laundry Status</Text>
                  <Text style={[styles.hostelCardSub, { color: colors.textSecondary }]}>Locked in Demo</Text>
                </View>
                <MaterialIcons name="lock" size={16} color={colors.textMuted} />
              </TouchableOpacity>

            </View>
          </View>
        )}

        {/* Quick Launchpad (Links to the new massive modules) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>Campus Launchpad</Text>

          <View style={styles.launchpadGrid}>
            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => Alert.alert('Premium Feature', 'This feature is locked in the free trial.')}
            >
              <View style={[styles.lockBadge, { top: -4, right: -4, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }]}>
                <MaterialIcons name="lock" size={8} color="#FFFFFF" />
                <Text style={[styles.lockBadgeText, { fontSize: 8, marginLeft: 2 }]}>DEMO</Text>
              </View>
              <LinearGradient colors={['#EA580C', '#9A3412']} style={[styles.launchIconBg, { opacity: 0.5 }]}>
                <MaterialCommunityIcons name="food" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.launchText, { color: colors.textPrimary, opacity: 0.5 }]}>Order Food</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('RaiseIssue')}
            >
              <LinearGradient colors={['#FFD700', '#B8860B']} style={styles.launchIconBg}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#111827" />
              </LinearGradient>
              <Text style={[styles.launchText, { color: colors.textPrimary }]}>Raise Issue</Text>

            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('TheHustle')}
            >
              <LinearGradient colors={['#059669', '#064E3B']} style={styles.launchIconBg}>
                <MaterialCommunityIcons name="trending-up" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.launchText, { color: colors.textPrimary }]}>The Hustle</Text>

            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('ERPHub')}
            >
              <LinearGradient colors={['#D97706', '#92400E']} style={styles.launchIconBg}>
                <MaterialCommunityIcons name="office-building" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.launchText, { color: colors.textPrimary }]}>ERP</Text>

            </TouchableOpacity>
          </View>
        </View>

        {/* Pulse Check */}
        <View style={styles.sectionContainer}>
          <View style={[styles.pulseCard, { backgroundColor: colors.card }]}>
            <View style={styles.pulseHeaderRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pulse Check</Text>
                <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>How are you feeling today?</Text>
              </View>
              <MaterialCommunityIcons name="heart-pulse" size={28} color="#EA580C" opacity={0.5} />
            </View>

            <View style={styles.moodRow}>
              {[
                { id: 0, icon: 'emoticon-excited-outline', apiVal: 'excited' },
                { id: 1, icon: 'emoticon-happy-outline', apiVal: 'happy' },
                { id: 2, icon: 'emoticon-neutral-outline', apiVal: 'neutral' },
                { id: 3, icon: 'emoticon-sad-outline', apiVal: 'stressed' },
              ].map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  onPress={async () => {
                    setActiveMood(mood.id);
                    try {
                      await logMoodAPI(accessToken, mood.apiVal);
                      Alert.alert("Mood Logged", "Your daily vibe check has been recorded. Stay healthy!");
                    } catch (e) {
                      console.warn("Failed to log mood:", e);
                    }
                  }}
                  style={[
                    styles.moodBtn,
                    { backgroundColor: activeMood === mood.id ? '#EA580C' : isDark ? '#1F2937' : '#F1F5F9' }
                  ]}
                >
                  <MaterialCommunityIcons
                    name={mood.icon}
                    size={28}
                    color={activeMood === mood.id ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>


        <View style={styles.sectionContainer}>
          <View style={[styles.mentallyBox, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
            <View style={[styles.mentallyIconCircle, { backgroundColor: isDark ? '#334155' : '#E0E7FF' }]}>
              <MaterialCommunityIcons name="brain" size={16} color="#4338CA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mentallyText, { color: isDark ? '#A5B4FC' : '#3730A3' }]}>
                "Stress levels look slightly high before the {user?.major || 'academic'} finals. Need a 5-min mindfulness break?"
              </Text>

              <TouchableOpacity onPress={() => navigation.navigate('MentallyMain')}>
                <Text style={[styles.mentallyAction, { color: isDark ? '#818CF8' : '#4338CA' }]}>TALK TO MENTALLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* E-Library Module */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>E-Library</Text>
              <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Expand your knowledge</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                if (isMed) {
                  navigation.navigate('LibraryMain');
                } else {
                  Alert.alert('Premium Feature', 'This feature is locked in the free trial.');
                }
              }}
            >
              <Text style={[styles.viewAllText, { color: '#EA580C' }, !isMed && { opacity: 0.5 }]}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.libraryGrid}>
            {featuredBooks.map((book) => {
              const isBookUnlocked = parseInt(book.id, 10) >= 16;
              return (
                <TouchableOpacity
                  key={book.id}
                  style={[styles.libraryBookCard, !isBookUnlocked && { opacity: 0.5 }]}
                  onPress={() => {
                    if (isBookUnlocked) {
                      navigation.navigate('BookDetail', { book });
                    } else {
                      Alert.alert('Premium Feature', 'This feature is locked in the free trial.');
                    }
                  }}
                >
                  {!isBookUnlocked && (
                    <View style={[styles.lockBadge, { top: 5, left: 5, zIndex: 10 }]}>
                      <MaterialIcons name="lock" size={10} color="#FFFFFF" />
                      <Text style={styles.lockBadgeText}>DEMO LOCK</Text>
                    </View>
                  )}
                  <Image source={{ uri: book.cover }} style={styles.libraryBookImg} />
                  <Text style={[styles.libraryBookTitle, { color: colors.textPrimary }]} numberOfLines={1}>{book.title}</Text>
                  <Text style={[styles.libraryBookAuthor, { color: colors.textMuted }]} numberOfLines={1}>{book.author}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.innovationHeader}>
          <Text style={[styles.innovationBadge, { color: colors.primary }]}>INNOVATION HUB</Text>
          <Text style={[styles.innovationTitle, { color: colors.textPrimary }]}>{isMed ? 'Clinical Career Catalyst' : 'Career AI Catalyst'}</Text>
        </View>


        {/* Career Hub Grid */}
        <View style={styles.careerGrid}>
          {/* Resume Builder */}
          <LinearGradient
            colors={isDark ? [colors.card, colors.background] : ['#ffffff', '#fffaf0']}
            style={[styles.resumeCard, { borderColor: colors.border }]}
          >
            <View style={[styles.resumeIcon, { backgroundColor: isDark ? colors.background : '#FFF7ED' }]}>
              <MaterialCommunityIcons name="file-document-edit-outline" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{isMed ? 'Clinical CV & Case Portfolio' : 'AI Resume Builder'}</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary, marginBottom: 8 }]}>
              {isMed 
                ? 'Structure your clinical postings, case logs, OPD observations, and clinical workshops.' 
                : `Smart tailoring based on your ${user?.cgpa || '8.9'} CGPA and technical skills in ${APP_CONFIG.UNIVERSITY_SHORT_NAME} labs.`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : '#EDE9FE', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={isDark ? '#A78BFA' : '#6D28D9'} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#A78BFA' : '#6D28D9', marginLeft: 4 }}>GENERATES ONCE A WEEK</Text>
            </View>

            <TouchableOpacity
              style={[styles.resumeBtn, { backgroundColor: isDark ? colors.primary : '#111827' }]}
              onPress={() => navigation.navigate('ResumeBuilder')}
            >
              <Text style={styles.resumeBtnText}>{cvButtonText || (isMed ? 'Build Clinical CV' : 'View / Build Resume')}</Text>
              <MaterialCommunityIcons name="magic-staff" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <View style={styles.resumeBgIcon}>
              <MaterialCommunityIcons name="file-document" size={120} color={colors.primary} style={{ opacity: 0.05 }} />
            </View>
          </LinearGradient>


          {/* Mock Interview */}
          <LinearGradient colors={isDark ? ['#312E81', '#1E1B4B'] : ['#4338CA', '#312E81']} style={styles.interviewCard}>
            <View style={styles.interviewTop}>
              <View style={[styles.interviewIconBg, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                <MaterialCommunityIcons name="microphone" size={24} color={isDark ? colors.primary : "#4338CA"} />
              </View>
              <MaterialIcons name="auto-awesome" size={24} color={isDark ? colors.primaryLight : "#A5B4FC"} />
            </View>
            <View>
              <Text style={styles.interviewTitle}>{isMed ? 'Clinical Viva & OSCE Prep' : 'Mock Interview'}</Text>
              <Text style={[styles.interviewDesc, { color: isDark ? '#C7D2FE' : '#C7D2FE' }]}>
                {isMed 
                  ? 'Simulate emergency ward rounds, patient history vivas, and residency interviews.' 
                  : "Practice with specialized AI for 'Cloud Architect' roles."}
              </Text>
            </View>

            <View style={styles.lockBadge}>
              <MaterialIcons name="lock" size={10} color="#FFFFFF" />
              <Text style={styles.lockBadgeText}>DEMO LOCK</Text>
            </View>

            <TouchableOpacity
              onPress={() => Alert.alert('Premium Feature', 'This feature is locked in the free trial.')}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}
            />
            <View style={[styles.practicingRow, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <View style={styles.practicingAvatars}>
                <Image source={{ uri: getAvatarUrl('1') }} style={[styles.miniAvatar, { borderColor: isDark ? colors.primary : '#4338CA' }]} />
                <Image source={{ uri: getAvatarUrl('2') }} style={[styles.miniAvatar, { marginLeft: -10, borderColor: isDark ? colors.primary : '#4338CA' }]} />
                <View style={[styles.countBadge, { backgroundColor: isDark ? colors.card : '#E0E7FF', borderColor: isDark ? colors.primary : '#4338CA' }]}><Text style={[styles.countText, { color: isDark ? colors.textPrimary : '#312E81' }]}>+12</Text></View>
              </View>
              <Text style={styles.practicingText}>Practicing now</Text>
            </View>
          </LinearGradient>

        </View>

        {/* ========== SKILL GAP ANALYSIS ========== */}
        <View style={styles.sectionContainer}>
          <View style={[styles.skillGapCard, { backgroundColor: colors.card, paddingBottom: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.skillGapIconWrapper, { backgroundColor: isDark ? colors.background : '#FFF7ED' }]}>
                  <MaterialCommunityIcons name="chart-areaspline" size={24} color={colors.primary} />
                </View>
                <View style={{ justifyContent: 'center' }}>
                  <Text style={[styles.skillGapTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                    {isMed ? 'Clinical Competency Gap' : 'Skill Gap Analysis'}
                  </Text>
                </View>
              </View>
            </View>

            {isMed && !erpCompetencies ? (
              <View style={[styles.syncPlaceholderCard, { borderColor: colors.border, borderWidth: 1, backgroundColor: isDark ? colors.card : '#FDFBF7' }]}>
                <View style={[styles.syncIconBg, { backgroundColor: '#EA580C10' }]}>
                  <Ionicons name="shield-checkmark-outline" size={32} color="#EA580C" />
                </View>
                <Text style={[styles.syncTitle, { color: colors.textPrimary }]}>Live Competency Alignment</Text>
                <Text style={[styles.syncDesc, { color: colors.textSecondary }]}>
                  Analyze your sessional exam results to identify clinical competency gaps based on NMC guidelines.
                </Text>
                
                {loadingCompetencyGaps ? (
                  <View style={{ alignItems: 'center', marginTop: 16 }}>
                    <ActivityIndicator size="small" color="#EA580C" />
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>Querying live ERP records...</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.syncButton, { backgroundColor: colors.primary }]}
                    onPress={handleFetchCompetencyGaps}
                  >
                    <Ionicons name="sync-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.syncButtonText}>Analyze Gaps from Live ERP</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : user && (() => {
              const gapData = computeSkillGap(user, academicResults, erpCompetencies);
              const targetGoal = user.course?.toLowerCase().includes('medicine') || user.course?.toLowerCase().includes('mbbs')
                ? 'NEET-PG / NEXT' : user.course?.toLowerCase().includes('computer') || user.course?.toLowerCase().includes('cse')
                  ? 'FAANG' : 'Top Placements';

              let missingItems = [
                ...gapData.academicMissingSkills.map(skill => ({ name: skill, isAcademic: true, isMissing: true })),
                ...gapData.industryMissingSkills.map(skill => ({ name: skill, isAcademic: false, isMissing: true }))
              ];
              if (missingItems.length === 0) {
                missingItems = [
                  ...gapData.academicExpectedSkills.map(skill => ({ name: skill, isAcademic: true, isMissing: false })),
                  ...gapData.industryExpectedSkills.map(skill => ({ name: skill, isAcademic: false, isMissing: false }))
                ];
              }
              const displaySkills = missingItems.slice(0, 6).map(item => {
                const score = gapData.skillScores?.[item.name] ??
                  (item.isMissing ? 0 : 90);
                const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
                return { ...item, score, color };
              });

              return (
                <>
                  <Text style={[styles.skillGapDesc, { color: colors.textSecondary, marginBottom: 0 }]}>
                    {isMed ? `What clinical competencies are missing for ${targetGoal}?` : `What's missing for ${targetGoal}?`}
                  </Text>
                  {isMed && erpCompetencies && (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, marginBottom: 4 }}>
                      <TouchableOpacity 
                        onPress={handleFetchCompetencyGaps} 
                        disabled={loadingCompetencyGaps} 
                        style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          gap: 6, 
                          paddingHorizontal: 12, 
                          paddingVertical: 6, 
                          borderRadius: 10, 
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                          borderWidth: 1,
                          borderColor: colors.border
                        }}
                      >
                        {loadingCompetencyGaps ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <>
                            <Ionicons name="sync-outline" size={14} color={colors.primary} />
                            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Sync ERP Results</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}



                  {/* Category Split Metrics */}
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 16 }}>
                    <View style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF', borderWidth: 1, borderColor: isDark ? 'rgba(59,130,246,0.2)' : '#DBEAFE' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#3B82F6', textTransform: 'uppercase', marginBottom: 4 }}>{isMed ? 'Prof Theory Prep' : 'Academic Prep'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>{gapData.academicMatchPct}%</Text>
                        <View style={{ flex: 1, height: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 2 }}>
                          <View style={{ height: '100%', width: `${gapData.academicMatchPct}%`, backgroundColor: '#3B82F6', borderRadius: 2 }} />
                        </View>
                      </View>
                    </View>
                    <View style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: isDark ? 'rgba(124,58,237,0.1)' : '#F5F3FF', borderWidth: 1, borderColor: isDark ? 'rgba(124,58,237,0.2)' : '#EDE9FE' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#7C3AED', textTransform: 'uppercase', marginBottom: 4 }}>{isMed ? 'Clinical Competency' : 'Industry Skill'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>{gapData.industryMatchPct}%</Text>
                        <View style={{ flex: 1, height: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 2 }}>
                          <View style={{ height: '100%', width: `${gapData.industryMatchPct}%`, backgroundColor: '#7C3AED', borderRadius: 2 }} />
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.skillGapProgressSection}>
                    {displaySkills.map((skill, idx) => (
                      <View key={idx} style={styles.skillProgressItem}>
                        <View style={styles.skillProgressHeader}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                              <Text style={[styles.skillName, { color: colors.textPrimary, fontSize: 14, fontWeight: '700' }]} numberOfLines={1}>{skill.name}</Text>
                              <View style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                                backgroundColor: skill.isAcademic ? (isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF') : (isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF'),
                                borderWidth: 0.5,
                                borderColor: skill.isAcademic ? '#3B82F6' : '#7C3AED'
                              }}>
                                <Text style={{
                                  fontSize: 8,
                                  fontWeight: '800',
                                  color: skill.isAcademic ? '#3B82F6' : '#7C3AED',
                                  textTransform: 'uppercase',
                                }}>
                                  {skill.isAcademic ? (isMed ? 'Theory' : 'Academic') : (isMed ? 'Clinical' : 'Industry')}
                                </Text>
                              </View>
                              <View style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                                backgroundColor: skill.isMissing ? (isDark ? 'rgba(239,68,68,0.2)' : '#FEE2E2') : (isDark ? 'rgba(16,185,129,0.2)' : '#D1FAE5'),
                              }}>
                                <Text style={{
                                  fontSize: 8,
                                  fontWeight: '800',
                                  color: skill.isMissing ? '#EF4444' : '#10B981',
                                  textTransform: 'uppercase',
                                }}>
                                  {skill.isMissing ? 'Gap' : 'Good'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <Text style={[styles.skillPercent, { color: colors.textPrimary }]}>{skill.score}%</Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
                          <View style={[styles.progressBarFill, { width: `${skill.score}%`, backgroundColor: skill.color }]} />
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              );
            })()}
            {(!isMed || erpCompetencies) && (
              <View style={styles.skillGapActions}>
                <TouchableOpacity
                  style={styles.giveTestBtn}
                  onPress={() => navigation.navigate('SkillGapTest')}
                >
                  <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.giveTestBtnGradient}>
                    <MaterialCommunityIcons name="pencil-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.giveTestBtnText}>{isMed ? 'Assess Competency' : 'Give Test'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.analyzeBtn, { borderColor: colors.border }]}
                  onPress={() => navigation.navigate('DeepDiveAnalysis')}
                >
                  <Text style={[styles.analyzeBtnText, { color: colors.primary }]}>{isMed ? 'Clinical Gap Analysis →' : 'Deep Dive Analysis →'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ========== CAREER ROADMAP ========== */}
        <View style={styles.sectionContainer}>
          <View style={styles.roadmapHeader}>
            <Text style={[styles.roadmapTitle, { color: colors.textPrimary }]}>{roadmapData ? `Suggested ${roadmapData.label}` : 'Suggested Career Roadmap'}</Text>

            {roadmapData && roadmapData.target ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: isDark ? '#451A03' : '#FEF3C7', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#F59E0B' }}>
                <MaterialCommunityIcons name="briefcase-check" size={16} color={isDark ? '#FCD34D' : '#D97706'} />
                <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '800', color: isDark ? '#FCD34D' : '#D97706' }}>
                  {isMed ? 'Target Specialty: ' : 'Target Role: '}{roadmapData.target}
                </Text>
              </View>
            ) : (
              <Text style={[styles.roadmapSubtitle, { color: colors.textSecondary }]}>Your projected path towards success</Text>
            )}
          </View>

          <View style={styles.timelineContainer}>
            {isGeneratingRoadmap ? (
              <View style={{ paddingVertical: 8 }}>
                <TimelineSkeleton steps={3} />
              </View>
            ) : (
              <>
                  {roadmapData && (() => {
                    // Enrich roadmap with real marks averages for MBBS students
                    const displayRoadmap = enrichRoadmapWithMarks(roadmapData, academicResults, user);
                    return displayRoadmap.steps.map((step, index) => {
                  const isDone = step.status === 'done';
                  const isCurrent = step.status === 'current';
                  const dotColors = isCurrent ? ['#EA580C', '#9A3412'] : isDone ? ['#10B981', '#059669'] : ['#9CA3AF', '#6B7280'];
                  const cardColors = isDark
                    ? (isCurrent ? ['#7C2D12', '#EA580C'] : isDone ? ['#064E3B', '#10B981'] : ['#1F2937', '#374151'])
                    : (isCurrent ? ['#FFF7ED', '#FFEDD5'] : isDone ? ['#F0FDF4', '#DCFCE7'] : ['#F3F4F6', '#E5E7EB']);

                  return (
                    <View key={index} style={styles.timelineItem}>
                      <View style={styles.timelineDotWrapper}>
                        <LinearGradient colors={dotColors} style={[styles.timelineDot, isCurrent && styles.timelineDotActive, { borderColor: isDark && isCurrent ? colors.primaryLight : isCurrent ? '#FED7AA' : 'transparent' }]} />
                        {index < displayRoadmap.steps.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                      </View>
                      <LinearGradient
                        colors={cardColors}
                        style={[styles.timelineCard, isCurrent && styles.timelineCardActive, { borderColor: isDark && isCurrent ? colors.primary : isCurrent ? '#EA580C' : colors.border, borderWidth: 1 }]}
                      >
                        {isCurrent && (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>CURRENT PHASE</Text>
                          </View>
                        )}
                        <Text style={[styles.timelineYear, { color: isDark && isCurrent ? '#FED7AA' : colors.textSecondary }]}>{isMed ? `PROF PHASE ${step.n}` : `PHASE ${step.n}`}</Text>
                        <Text style={[styles.timelineCardTitle, { color: isDark && isCurrent ? '#FFFFFF' : colors.textPrimary }]}>{step.title}</Text>

                        <Text style={{ fontSize: 12, color: isDark && isCurrent ? '#FFFFFF' : (isCurrent ? '#4B5563' : colors.textSecondary), marginTop: 4 }}>{step.desc}</Text>
                      </LinearGradient>
                    </View>
                  );
                });
                  })()}

                {/* Pathway Outcome */}
                {roadmapData && (
                  <View style={[styles.timelineItem, { marginTop: 8 }]}>
                    <View style={styles.timelineDotWrapper}>
                      <LinearGradient colors={['#F59E0B', '#D97706']} style={[styles.timelineDot, styles.timelineDotActive, { borderColor: isDark ? '#FEF3C7' : '#FEF3C7' }]} />
                    </View>
                    <LinearGradient
                      colors={isDark ? ['#451A03', '#78350F'] : ['#FEF3C7', '#FDE68A']}
                      style={[styles.timelineCard, { borderColor: '#F59E0B', borderWidth: 1 }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <MaterialCommunityIcons name="trophy" size={16} color={isDark ? '#FCD34D' : '#D97706'} />
                        <Text style={[styles.timelineYear, { color: isDark ? '#FCD34D' : '#D97706', marginLeft: 6, marginBottom: 0 }]}>PATHWAY OUTCOME</Text>
                      </View>
                      <Text style={[styles.timelineCardTitle, { color: isDark ? '#FFFFFF' : colors.textPrimary, fontSize: 15 }]}>
                        {roadmapData.outcome}
                      </Text>
                    </LinearGradient>
                  </View>
                )}
              </>
            )}

            {/* Dynamic Interests Input */}
            <View style={{ marginTop: 24, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 16, marginBottom: 8 }}>
                {isMed ? 'Refine Your Clinical Pathway' : 'Refine Your Pathway'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
                {isMedicalStudent(user)
                  ? 'Tell us your clinical interests (e.g., Cardiology, Pediatrics, Neurology) and our AI will adapt your roadmap.'
                  : 'Tell us your specific interests (e.g., AI, Robotics, Web Dev) and our AI will adapt your roadmap.'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: isDark ? colors.background : '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: colors.textPrimary, fontSize: 14 }}
                  placeholder={isMedicalStudent(user) ? 'E.g. Pediatrics, Cardiology, Surgery...' : 'E.g. Machine Learning, NLP...'}
                  placeholderTextColor={colors.textSecondary}
                  value={interestsInput}
                  onChangeText={setInterestsInput}
                />
                <TouchableOpacity
                  style={{ backgroundColor: pathwayRetriesLeft > 0 ? colors.primary : colors.textMuted, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  disabled={pathwayRetriesLeft === 0}
                  onPress={async () => {
                    const lastRefined = await AsyncStorage.getItem('@pathway_last_refined');
                    if (lastRefined) {
                      const daysSince = (Date.now() - parseInt(lastRefined)) / (1000 * 60 * 60 * 24);
                      if (daysSince < 1) {
                        Alert.alert('Daily Limit Reached', 'You can only refine your pathway once a day to ensure optimal AI performance.');
                        setPathwayRetriesLeft(0);
                        return;
                      }
                    }
                    if (user?.id) {
                      await AsyncStorage.setItem(`@pathway_interests_${user.id}`, interestsInput);
                    }
                    await AsyncStorage.setItem('@pathway_last_refined', Date.now().toString());
                    setPathwayRetriesLeft(0);
                    setActiveInterests(interestsInput);
                  }}
                >
                  {pathwayRetriesLeft === 0 && <MaterialIcons name="lock" size={14} color="#fff" />}
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                    {pathwayRetriesLeft > 0 ? `Refine (${pathwayRetriesLeft} left)` : 'Locked'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════ */}
        {/* TODAY'S MENU — Campus Food Ordering             */}
        {/* ═══════════════════════════════════════════════ */}
        <View style={styles.sectionContainer}>
          <View style={styles.menuSectionHeader}>
            <View>
              <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>CAMPUS DINING</Text>
              <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Today's Menu</Text>
            </View>
            <TouchableOpacity
              style={[styles.viewAllBtn, { backgroundColor: isDark ? 'rgba(234,88,12,0.15)' : '#FFF7ED' }]}
              onPress={() => Alert.alert('Premium Feature', 'This feature is locked in the free trial.')}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              <MaterialIcons name="lock" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Horizontal scroll of food cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuScroll}
          >
            {[
              {
                id: 1,
                name: 'Special Veg Thali',
                price: '₹249',
                tag: 'Bestseller',
                rating: '4.9',
                image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&auto=format&fit=crop',
              },
              {
                id: 2,
                name: 'Paneer Tikka',
                price: '₹120',
                tag: 'Campus Fav',
                rating: '4.8',
                image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&auto=format&fit=crop',
              },
              {
                id: 3,
                name: 'Masala Chai',
                price: '₹25',
                tag: 'Quick Pick',
                rating: '4.8',
                image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop',
              },
              {
                id: 4,
                name: 'Chole Bhature',
                price: '₹85',
                tag: 'Today Special',
                rating: '4.9',
                image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop',
              },
            ].map((food) => (
              <TouchableOpacity
                key={food.id}
                style={[styles.menuCard, { backgroundColor: colors.card }]}
                onPress={() => Alert.alert('Premium Feature', 'This feature is locked in the free trial.')}
                activeOpacity={0.85}
              >
                <Image source={{ uri: food.image }} style={styles.menuCardImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.55)']}
                  style={styles.menuCardOverlay}
                >
                  <View style={styles.menuCardBadge}>
                    <Text style={styles.menuCardBadgeText}>{food.tag}</Text>
                  </View>
                </LinearGradient>
                <View style={styles.menuCardBody}>
                  <Text style={[styles.menuCardName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {food.name}
                  </Text>
                  <View style={styles.menuCardFooter}>
                    <Text style={[styles.menuCardPrice, { color: isDark ? '#FB923C' : '#9A3412' }]}>
                      {food.price}
                    </Text>
                    <View style={styles.menuCardRating}>
                      <MaterialIcons name="star" size={11} color="#F97316" />
                      <Text style={styles.menuCardRatingText}>{food.rating}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.lockBadge}>
                  <MaterialIcons name="lock" size={10} color="#FFFFFF" />
                  <Text style={styles.lockBadgeText}>LOCKED</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* View All Card */}
            <TouchableOpacity
              style={[styles.menuViewAllCard, { backgroundColor: isDark ? '#1E293B' : '#FFF7ED' }]}
              onPress={() => navigation.navigate('CampusBitesMenu')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.menuViewAllIcon}>
                <MaterialCommunityIcons name="food" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.menuViewAllLabel, { color: isDark ? '#FB923C' : '#9A3412' }]}>
                View Full{'\n'}Menu
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color={isDark ? '#FB923C' : '#9A3412'} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Raised Issues Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>My Support Tickets</Text>
              <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Issues you have raised</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => navigation.navigate('GrievancesList')}>
                <Text style={[styles.viewAllText, { color: '#EA580C' }]}>View All ({raisedIssues.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('RaiseIssue')}>
                <Text style={[styles.viewAllText, { color: '#EA580C', fontWeight: '800' }]}>+ Raise New</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isLoadingIssues ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary }}>Loading tickets...</Text>
            </View>
          ) : raisedIssues.length === 0 ? (
            <View style={[styles.noIssuesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={36} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.noIssuesText, { color: colors.textSecondary }]}>No issues raised yet</Text>
            </View>
          ) : (
            <View style={styles.issuesList}>
              {raisedIssues.slice(0, 3).map((issue) => {
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

                return (
                  <View key={issue.id} style={[styles.issueItemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.issueItemHeader}>
                      <View style={[styles.issueIconCircle, { backgroundColor: isDark ? 'rgba(234,88,12,0.1)' : '#FFF7ED' }]}>
                        <MaterialCommunityIcons name={categoryIcon} size={20} color="#EA580C" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.issueSubject, { color: colors.textPrimary }]} numberOfLines={1}>
                          {issue.subject}
                        </Text>
                        <Text style={[styles.issueCategoryText, { color: colors.textMuted }]}>
                          Category: {issue.category.toUpperCase()} • Priority: {issue.priority.toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                          {issue.status.replace(/[-_]/g, ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    {(() => {
                      const extractAttachmentUrl = (desc) => {
                        if (!desc) return null;
                        const match = desc.match(/Attachment:\s*(https?:\/\/\S+)/i);
                        return match ? match[1] : null;
                      };
                      const cleanDescription = (desc) => {
                        if (!desc) return '';
                        return desc.replace(/Attachment:\s*https?:\/\/\S+/gi, '').trim();
                      };
                      const attachmentUrl = issue.attachment_url || extractAttachmentUrl(issue.description);
                      const displayDesc = cleanDescription(issue.description);
                      return (
                        <>
                          <Text style={[styles.issueDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                            {displayDesc}
                          </Text>
                          {attachmentUrl && (
                            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <Image
                                source={{ uri: attachmentUrl }}
                                style={{ width: 80, height: 50, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                                resizeMode="cover"
                              />
                              <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <MaterialCommunityIcons name="paperclip" size={14} color={colors.primary} />
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Image Attachment</Text>
                                </View>
                                <Text style={{ fontSize: 10, color: colors.textMuted }}>Uploaded to Cloudinary</Text>
                              </View>
                            </View>
                          )}
                        </>
                      );
                    })()}
                    <View style={[styles.issueFooter, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }]}>
                      <Text style={[styles.issueTimeText, { color: colors.textMuted }]}>
                        {new Date(issue.created_at).toLocaleDateString()} {new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 16 }}>
                        {statusLower === 'pending' && (
                          <TouchableOpacity 
                            onPress={() => navigation.navigate('RaiseIssue', { editMode: true, issue })}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          >
                            <MaterialIcons name="edit" size={16} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Edit</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          onPress={() => handleDeleteIssue(issue.id)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        >
                          <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                          <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>


    </View>
  );
};

const styles = StyleSheet.create({
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
  },
  avatarModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  avatarPreviewContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
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
  },
  avatarSelectBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  avatarSelectBtnText: {
    fontSize: 14,
    fontWeight: '700',
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
  },

  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconBtn: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  journalIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  avatarSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
  },

  // Profile Dropdown Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  profileMenu: {
    position: 'absolute',
    right: 16,
    width: 275,
    maxWidth: width - 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 4,
  },
  menuAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  menuName: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  menuSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },

  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 6,
    marginHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
  },

  logoutItem: {
    backgroundColor: '#FEF2F2',
    marginTop: 2,
  },
  logoutText: {
    color: '#EF4444',
  },

  scroll: {
    paddingBottom: 20,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  userCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  welcomeSub: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statPillOrange: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignItems: 'flex-start',
  },

  statValueOrange: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabelOrange: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  statPillPurple: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignItems: 'flex-start',
  },

  statValuePurple: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabelPurple: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  aiSuggestionBox: {
    marginTop: 24,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
  },

  aiIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(6,95,70,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSuggestionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    paddingRight: 10,
  },

  moduleTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  launchpadGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  launchBtn: {
    alignItems: 'center',
    gap: 8,
    width: '23%',
  },
  launchIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  launchText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  pulseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  pulseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: 14,
    marginTop: 4,
  },

  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
  },
  moodBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodIconActive: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },

  mentallyBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  mentallyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  mentallyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  mentallyAction: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  innovationHeader: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  innovationBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  innovationTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -1,
  },

  careerGrid: {
    padding: 16,
    gap: 16,
  },
  resumeCard: {
    borderRadius: 32,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },

  resumeIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
  },

  cardDesc: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 22,
    maxWidth: '80%',
  },

  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginTop: 24,
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  resumeBgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    zIndex: -1,
  },
  interviewCard: {
    borderRadius: 32,
    padding: 28,
    gap: 24,
    minHeight: 220,
    justifyContent: 'space-between',
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
  interviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interviewIconBg: {
    backgroundColor: '#FFFFFF',
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interviewTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  interviewDesc: {
    fontSize: 14,
    color: '#C7D2FE',
    lineHeight: 22,
  },
  lockBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  lockBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  practicingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'flex-start',
    gap: 12,
  },
  practicingAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#4338CA',
  },
  countBadge: {
    backgroundColor: '#E0E7FF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#4338CA',
  },
  countText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#312E81',
  },
  practicingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  // Skill Gap Analysis Styles
  skillGapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  skillGapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  skillGapIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillGapTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  skillGapDesc: {
    fontSize: 14,
    marginBottom: 20,
  },
  skillGapProgressSection: {
    gap: 16,
    marginBottom: 24,
  },
  skillProgressItem: {
    gap: 8,
  },
  skillProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillName: {
    fontSize: 14,
    fontWeight: '600',
  },
  skillPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  analyzeBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  analyzeBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  // Career Roadmap Styles
  roadmapHeader: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  roadmapTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  roadmapSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },

  timelineContainer: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDotWrapper: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  timelineDotActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#FED7AA',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    position: 'absolute',
    top: 36,
    bottom: -20,
    left: '50%',
    marginLeft: -1,
  },
  timelineCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    marginLeft: 8,
    marginBottom: 8,
  },
  timelineCardActive: {
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  timelineYear: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 8,
  },
  timelineCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },

  timelineTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
  activeBadge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Today's Menu Styles ──
  menuSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  menuScroll: {
    paddingRight: 16,
    gap: 12,
  },
  menuCard: {
    width: width * 0.42,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent', // Can map to colors.border if you prefer
  },
  menuCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  menuCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    padding: 12,
  },
  menuCardBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  menuCardBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  menuCardBody: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  menuCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
  },
  menuCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuCardPrice: {
    fontSize: 16,
    fontWeight: '900',
  },
  menuCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  menuCardRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9A3412',
  },
  menuViewAllCard: {
    width: width * 0.35,
    height: 180,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#FED7AA',
    gap: 12,
  },
  menuViewAllIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillGapActions: {
    marginTop: 20,
    gap: 12,
  },
  giveTestBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  giveTestBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  giveTestBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  fitnessCard: {
    padding: 20,
    borderRadius: 28,
    marginTop: 16,
  },
  fitnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  fitnessIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fitnessHeaderText: {
    flex: 1,
  },
  fitnessTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  fitnessSub: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.6,
  },
  fitnessBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  fitnessRingContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringStack: {
    width: 64,
    height: 64,
  },
  ringBase: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 8,
  },
  ringFill: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 8,
  },
  fitnessVDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  fitnessGridStats: {
    flex: 1,
    gap: 10,
  },
  fitnessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fitnessItem: {
    flex: 1,
  },
  fitnessVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  fitnessLabel: {
    fontSize: 9,
    fontWeight: '800',
    opacity: 0.5,
    letterSpacing: 1,
  },
  fitnessHDivider: {
    height: 1,
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '800',
  },
  libraryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  libraryBookCard: {
    width: (width - 48) / 2,
    marginBottom: 20,
  },
  libraryBookImg: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
  },
  libraryBookTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  libraryBookAuthor: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Hostel Mode Styles
  hostelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  gatePassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  gatePassText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hostelGrid: {
    gap: 12,
  },
  hostelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  hostelIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostelCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  hostelCardSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  messTime: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  hostelActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  miniHostelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  miniHostelBtnText: {
    fontSize: 13,
    fontWeight: '700',
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
  noIssuesCard: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  noIssuesText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  issuesList: {
    gap: 16,
    marginTop: 12,
  },
  issueItemCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
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
  },
  issueCategoryText: {
    fontSize: 11,
    fontWeight: '600',
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
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: 250,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalBtnTextCancel: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBtnSubmit: {
    flex: 2,
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalBtnTextSubmit: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  syncPlaceholderCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  syncIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  syncTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  syncDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default DashboardScreen;