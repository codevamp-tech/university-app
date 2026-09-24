import React from 'react';
import { getAvatarUrl } from "../../utils/avatar";
import { SafeStudentAvatar } from '../../components/SafeStudentAvatar';
import { ProfileDropdownModal } from '../../components/ProfileDropdownModal';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform, Modal, Switch, TextInput, Alert, ActivityIndicator, RefreshControl, LayoutAnimation, KeyboardAvoidingView
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
import { generateAIInsight, generateRoadmap, computeSkillGap, generateDynamicRoadmap, fetchDynamicLLMInsight, enrichRoadmapWithMarks, getPathwayRefineConfig } from '../../data/aiEngine';

import { booksData } from '../student/library/LibraryMainScreen';
import { listGrievancesAPI, deleteGrievanceAPI, uploadAvatarAPI, createOutpass, getStudentOutpasses, getResults, getCompetencyGaps, logMoodAPI, getMoodEntriesAPI, fetchGitHubRepos, fetchGitHubUser, getErpRecentLessons, getErpPlacementSummary, getErpNoticesUnreadCount, getErpLibraryBooks, getEBooks, getErpCourseCode } from '../../data/apiService';
import { getDisplayCourse, isMedicalStudent } from '../../utils/courseDisplay';
import { isCsEligibleForPlacement, computePlacementReadinessScore } from '../../utils/placementReadiness';

const { width } = Dimensions.get('window');

const BookCoverImage = ({ uri, title, style, isCompact = false }) => {
  const [failed, setFailed] = React.useState(!uri);

  React.useEffect(() => {
    setFailed(!uri);
  }, [uri]);

  if (failed || !uri) {
    const gradients = [
      ['#3B82F6', '#1D4ED8'],
      ['#8B5CF6', '#5B21B6'],
      ['#EC4899', '#BE185D'],
      ['#059669', '#047857'],
      ['#EA580C', '#C2410C'],
      ['#6366F1', '#4338CA'],
      ['#0284C7', '#0369A1'],
    ];
    let hash = 0;
    for (let i = 0; i < (title || '').length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const grad = gradients[Math.abs(hash) % gradients.length];

    return (
      <LinearGradient colors={grad} style={[style, { justifyContent: 'center', alignItems: 'center', padding: isCompact ? 6 : 12 }]}>
        <MaterialCommunityIcons
          name="book-open-page-variant"
          size={isCompact ? 26 : 40}
          color="rgba(255, 255, 255, 0.85)"
        />
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: isCompact ? 9 : 12,
            fontWeight: '800',
            textAlign: 'center',
            marginTop: isCompact ? 4 : 8,
            lineHeight: isCompact ? 12 : 15,
          }}
          numberOfLines={isCompact ? 3 : 4}
        >
          {title}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
};

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
  const { user, logout, accessToken, updateAvatarUrl, githubUsername, updateGithubUsername, isHostelMode, setIsHostelMode } = useUser();
  const { totalUnreadCount, unreadRequestsCount } = useNotifications();

  const isCsEligible = isCsEligibleForPlacement(user);
  const [gitHubRepos, setGitHubRepos] = React.useState([]);
  const [isLoadingGitHub, setIsLoadingGitHub] = React.useState(false);
  const [showGitHubModal, setShowGitHubModal] = React.useState(false);
  const [githubInput, setGithubInput] = React.useState('');
  const [showSkillGapInfoModal, setShowSkillGapInfoModal] = React.useState(false);
  const [placementStrengthsOpen, setPlacementStrengthsOpen] = React.useState(false);
  const [placementWeaknessesOpen, setPlacementWeaknessesOpen] = React.useState(false);
  const [placementActionItemsOpen, setPlacementActionItemsOpen] = React.useState(false);
  const [startupReposOpen, setStartupReposOpen] = React.useState(false);
  const [indexedReposOpen, setIndexedReposOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isCsEligible) return;
    const targetGh = githubUsername || user?.github_username;
    if (targetGh) {
      setIsLoadingGitHub(true);
      fetchGitHubRepos(targetGh).then(repos => {
        setGitHubRepos(repos || []);
        setIsLoadingGitHub(false);
      }).catch(() => {
        setIsLoadingGitHub(false);
      });
    }
  }, [isCsEligible, githubUsername, user?.github_username]);

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

  // ── Dynamic social credits calculation matching TalentIdentityScreen ──
  const totalSocialCredits = React.useMemo(() => {
    let leadership = '';
    let extracurricular = '';
    const bioText = user?.bio || '';
    if (bioText.includes('Leadership:') || bioText.includes('Extracurricular:')) {
      const lMatch = bioText.match(/Leadership:\s*([^|]+)/i);
      const eMatch = bioText.match(/Extracurricular:\s*(.+)/i);
      if (lMatch && lMatch[1].trim()) leadership = lMatch[1].trim();
      if (eMatch && eMatch[1].trim()) extracurricular = eMatch[1].trim();
    }

    const leadershipItems = (Array.isArray(user?.leadership) && user.leadership.length > 0)
      ? user.leadership
      : (leadership ? leadership.split(',').map(s => s.trim()).filter(Boolean) : []);

    const extracurricularItems = (Array.isArray(user?.extracurricular) && user.extracurricular.length > 0)
      ? user.extracurricular
      : (extracurricular ? extracurricular.split(',').map(s => s.trim()).filter(Boolean) : []);

    const totalActivities = leadershipItems.length + extracurricularItems.length;
    if (totalActivities > 0) {
      return totalActivities * 100;
    }
    const val = Number(user?.social_credits);
    return !isNaN(val) && val > 0 ? val : 0;
  }, [user]);

  // ── State for ERP & SRMS E-Library books ──
  const [erpLibraryBooks, setErpLibraryBooks] = React.useState([]);

  const loadErpLibraryBooks = React.useCallback(async () => {
    try {
      const isMedStudent = isMedicalStudent(user) || (user?.course || '').toLowerCase().includes('mbbs') || (user?.category || '').toLowerCase().includes('medical');
      const parts = String(user?.rollno || user?.emp_id || '').split('/');
      const colgcd = parts.length >= 2 && parts[1] && parts[1] !== '0' ? parts[1] : (isMedStudent ? '11' : '2');

      const [backendRes, srmsRes] = await Promise.allSettled([
        accessToken ? getErpLibraryBooks(accessToken) : Promise.resolve([]),
        getEBooks('', colgcd),
      ]);

      const backendBooks = backendRes.status === 'fulfilled' && Array.isArray(backendRes.value) ? backendRes.value : [];
      const srmsBooks = srmsRes.status === 'fulfilled' && Array.isArray(srmsRes.value) ? srmsRes.value : [];

      const mappedBackend = backendBooks.map((b, i) => ({
        id: String(b.id || `erp_${b.isbn || i}`),
        title: b.title || 'Academic Reference Book',
        author: b.author || b.publisher || 'ERP Library',
        cover: b.cover_url || b.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop',
        pdfUrl: b.ebook_url || b.pdfUrl,
        rating: b.rating || 4.8,
        category: b.category || 'General',
        pages: b.pages || 450,
        description: b.description || `Official library copy of ${b.title || 'resource'}.`,
        is_ebook: b.is_ebook,
        copies_available: b.copies_available,
      }));

      const combined = [...mappedBackend, ...srmsBooks];
      if (combined.length > 0) {
        setErpLibraryBooks(combined);
      }
    } catch (e) {
      console.warn('[Dashboard] Failed to fetch ERP library books:', e);
    }
  }, [accessToken, user]);

  React.useEffect(() => {
    loadErpLibraryBooks();
  }, [loadErpLibraryBooks]);

  // ── Dynamic featured books — ERP prioritized with course-aware sorting ──
  const featuredBooks = React.useMemo(() => {
    const combinedAll = erpLibraryBooks;

    // Deduplicate by title (case-insensitive)
    const seenTitles = new Set();
    const uniqueBooks = [];
    for (const b of combinedAll) {
      if (!b || !b.title) continue;
      const tKey = b.title.trim().toLowerCase();
      if (!seenTitles.has(tKey)) {
        seenTitles.add(tKey);
        uniqueBooks.push(b);
      }
    }

    const validBooks = uniqueBooks.filter(b => !!b.title);
    if (!validBooks.length) return [];

    if (!user) return validBooks.slice(0, 4);

    const isMed = isMedicalStudent(user) || (user.course || '').toLowerCase().includes('mbbs') || (user.category || '').toLowerCase().includes('medical');

    if (isMed) {
      const medCategories = ['Medicine', 'Medical', 'Anatomy', 'Pathology', 'Pharmacology', 'Nutrition', 'Pharmaceutics', 'Physiology', 'Internal Medicine', 'Surgery', 'Paediatrics', 'Forensic'];
      const filtered = validBooks.filter(b => {
        const cat = (b.category || '').toLowerCase();
        const title = (b.title || '').toLowerCase();
        return medCategories.some(m => cat.includes(m.toLowerCase()) || title.includes(m.toLowerCase()));
      });
      return (filtered.length > 0 ? filtered : validBooks).slice(0, 4);
    }

    const courseLower = (user.course || '').toLowerCase();
    const branchLower = (user.branch || '').toLowerCase();
    const bioLower = (user.bio || '').toLowerCase();

    // IMPORTANT: Use courseLower for primary classification — department name is unreliable
    // (e.g. MBA Finance students may have dept = "Computer Applications")

    let matchCategories = [];
    let isNonTechTrack = false;

    // 1. Pharmacy — check course first
    if (courseLower.includes('pharm') || branchLower.includes('pharm')) {
      matchCategories = ['Pharmacology', 'Pharmaceutics', 'Anatomy', 'Pathology', 'Medicinal Chemistry', 'Chemistry'];
      isNonTechTrack = true;

    // 2. Commerce & Management — check course name first, BEFORE any tech/dept check
    } else if (
      courseLower.includes('mba') || courseLower.includes('bba') ||
      courseLower.includes('mcom') || courseLower.includes('m.com') ||
      courseLower.includes('bcom') || courseLower.includes('b.com') ||
      courseLower.includes('commerce') || courseLower.includes('management') ||
      courseLower.includes('business') ||
      branchLower.includes('finance') || branchLower.includes('accounting') ||
      branchLower.includes('commerce') || branchLower.includes('management') ||
      branchLower.includes('business') || branchLower.includes('marketing')
    ) {
      matchCategories = ['Finance', 'Management', 'Entrepreneurship', 'Business', 'Marketing', 'Accounting', 'Economics', 'Corporate Finance'];
      isNonTechTrack = true;

    // 3. Electronics — check before generic 'computer' in branch
    } else if (
      courseLower.includes('ece') || courseLower.includes('electronics') ||
      branchLower.includes('electronics') || branchLower.includes('ece') ||
      branchLower.includes('circuit') || branchLower.includes('digital')
    ) {
      matchCategories = ['Electronics', 'ECE', 'Digital Systems', 'Circuits', 'Engineering'];
      isNonTechTrack = true;

    // 4. Tech — B.Tech CS/IT, BCA, MCA, Software
    } else if (
      courseLower.includes('bca') || courseLower.includes('mca') ||
      courseLower.includes('b.tech') || courseLower.includes('btech') ||
      courseLower.includes('m.tech') || courseLower.includes('mtech') ||
      branchLower.includes('computer') || branchLower.includes('cse') ||
      branchLower.includes('software') || branchLower.includes('information') ||
      branchLower.includes('ai') || branchLower.includes('data science') ||
      bioLower.includes('developer') || bioLower.includes('software engineer')
    ) {
      matchCategories = ['Programming', 'Software Engineering', 'AI / ML', 'Computer Science', 'Design', 'Data Structures', 'Database', 'Cloud'];
      isNonTechTrack = false;

    } else {
      matchCategories = ['Programming', 'Computer Science', 'Management', 'AI / ML', 'Business'];
      isNonTechTrack = false;
    }

    const matchesTrack = (book) => {
      const cat = (book.category || '').toLowerCase();
      return matchCategories.some(mc => cat.includes(mc.toLowerCase()));
    };

    if (isNonTechTrack) {
      // Strictly show only matching category books — never show tech/engineering books to MBA/Finance students
      const matchedBooks = validBooks.filter(matchesTrack);
      return matchedBooks.slice(0, 4);
    }

    const sorted = [...validBooks].sort((a, b) => {
      const aMatch = matchesTrack(a);
      const bMatch = matchesTrack(b);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
    return sorted.slice(0, 4);
  }, [erpLibraryBooks, user]);

  const avatarUrl = getAvatarUrl(user?.avatar_url || user?.name, user?.rollno);
  const isMed = user && (isMedicalStudent(user) || (user.course || '').toLowerCase().includes('mbbs') || (user.category || '').toLowerCase().includes('medical'));
  const [activeMood, setActiveMood] = React.useState(2);

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
        } catch (e) {
          console.warn("Failed to fetch today's mood:", e);
        }
      };
      fetchTodayMood();
      return () => { isMounted = false; };
    }, [accessToken])
  );

  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const [gatePassStatus, setGatePassStatus] = React.useState('idle'); // idle, pending, approved
  const [activeOutpass, setActiveOutpass] = React.useState(null);
  const [showQRModal, setShowQRModal] = React.useState(false);
  const [showRequestModal, setShowRequestModal] = React.useState(false);
  const [outpassForm, setOutpassForm] = React.useState({ reason: '', duration: '2 Hours' });
  const [interestsInput, setInterestsInput] = React.useState('');
  const [activeInterests, setActiveInterests] = React.useState('');

  const [roadmapData, setRoadmapData] = React.useState(null);
  const [isRefineExpanded, setIsRefineExpanded] = React.useState(true);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = React.useState(false);
  const [pathwayRetriesLeft, setPathwayRetriesLeft] = React.useState(1);
  const [cachedInsight, setCachedInsight] = React.useState(null);
  const [academicResults, setAcademicResults] = React.useState([]);
  const [erpCompetencies, setErpCompetencies] = React.useState(null);
  const [recentLessons, setRecentLessons] = React.useState([]);
  const [placementSummary, setPlacementSummary] = React.useState(null);
  const [noticesUnread, setNoticesUnread] = React.useState(0);

  // Load stored interests and check daily limit status on mount
  React.useEffect(() => {
    if (!user) return;

    // Load ERP recent lessons and summary (non-blocking)
    if (accessToken && !isMed) {
      const studentCourseCd = user?.course_cd || getErpCourseCode(user?.course || user?.course_name);
      const studentSemCd = user?.sem_cd || user?.semester || '';
      getErpRecentLessons(accessToken, { courseCd: studentCourseCd, semCd: studentSemCd })
        .then(l => {
          const list = Array.isArray(l) ? l : [];
          const filtered = list.filter(item => !item.course_cd || String(item.course_cd) === String(studentCourseCd));
          setRecentLessons(filtered.slice(0, 5));
        })
        .catch(() => { });
      getErpPlacementSummary(accessToken).then(s => setPlacementSummary(s)).catch(() => { });
      getErpNoticesUnreadCount(accessToken).then(c => setNoticesUnread(c)).catch(() => { });
    }

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
        const key = `@ai_insight_v6_${user.id || user.rollno}_${user.course || 'gen'}_${user.branch || 'gen'}`;
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
      const studentKey = user?.id || user?.user_id || user?.rollno || 'default';
      if (resultsData) {
        setAcademicResults(resultsData);
        await AsyncStorage.setItem(`@erp_academic_results_cache_${studentKey}`, JSON.stringify(resultsData));
      }
      if (gapsData) {
        setErpCompetencies(gapsData);
        await AsyncStorage.setItem(`@erp_competency_gaps_cache_${studentKey}`, JSON.stringify(gapsData));
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
      if (!isMed) {
        setErpCompetencies(null);
        setAcademicResults([]);
        return;
      }
      try {
        const studentKey = user?.id || user?.user_id || user?.rollno || 'default';
        const cachedGaps = await AsyncStorage.getItem(`@erp_competency_gaps_cache_${studentKey}`);
        if (cachedGaps) {
          setErpCompetencies(JSON.parse(cachedGaps));
        }
        const cachedResults = await AsyncStorage.getItem(`@erp_academic_results_cache_${studentKey}`);
        if (cachedResults) {
          setAcademicResults(JSON.parse(cachedResults));
        }
      } catch (e) {
        console.warn('Error loading cached ERP data:', e);
      }
    }
    loadCachedERPData();
  }, [user, isMed]);

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
        const key = `@ai_insight_v3_${user.id}_${user.course || 'gen'}`;
        const freshInsight = await fetchDynamicLLMInsight(user, accessToken);
        if (freshInsight) {
          setCachedInsight(freshInsight);
          await AsyncStorage.setItem(key, freshInsight);
        }
      }
    } catch (e) { }

    await Promise.allSettled([
      fetchRaisedIssues(),
      loadOutpassStatus(),
      loadPathwayRetries(),
      loadErpLibraryBooks(),
    ]);
    setRefreshing(false);
  }, [accessToken, user, fetchRaisedIssues, loadOutpassStatus, loadPathwayRetries, loadErpLibraryBooks]);

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
              rollno={user?.rollno || user?.username}
              name={user?.name || user?.full_name || 'S'}
              style={[styles.avatarSmall, { borderColor: colors.primary }]}
            />
            {unreadRequestsCount > 0 && (
              <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#FFF' }} />
            )}
          </TouchableOpacity>
        </View>
      </View>



      {/* Profile Dropdown Modal */}
      <ProfileDropdownModal
        visible={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        navigation={navigation}
      />



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

      {/* GitHub Account Connect Modal */}
      <Modal
        visible={showGitHubModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGitHubModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.dialogCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="github" size={26} color={isDark ? '#FFFFFF' : '#24292F'} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Connect GitHub</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGitHubModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16, lineHeight: 18 }}>
              Enter your public GitHub username. AI will fetch your repositories, evaluate commit activity, and detect startup potential.
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>GITHUB USERNAME</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="e.g., torvalds, ankita-singh, octocat"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={githubInput}
                onChangeText={setGithubInput}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              {githubUsername && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#EF4444',
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                  }}
                  onPress={async () => {
                    await updateGithubUsername(null);
                    setGitHubRepos([]);
                    setGithubInput('');
                    setShowGitHubModal(false);
                    Alert.alert('Disconnected', 'GitHub account has been unlinked.');
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>Disconnect</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { flex: 2, backgroundColor: colors.primary, marginTop: 0, opacity: isLoadingGitHub ? 0.7 : 1 }
                ]}
                disabled={isLoadingGitHub}
                onPress={async () => {
                  const clean = githubInput.trim().replace(/^@/, '');
                  if (!clean) {
                    Alert.alert('Username Required', 'Please enter a valid GitHub username.');
                    return;
                  }
                  setIsLoadingGitHub(true);
                  try {
                    const repos = await fetchGitHubRepos(clean, true);
                    if (repos && repos.length > 0) {
                      await updateGithubUsername(clean);
                      setGitHubRepos(repos);
                      setShowGitHubModal(false);
                      Alert.alert(
                        'GitHub Synced! 🚀',
                        `Successfully analyzed ${repos.length} repositories for @${clean}. Placement readiness score updated!`
                      );
                    } else {
                      Alert.alert(
                        'No Repositories Found',
                        `Could not find public repositories for "${clean}". Please verify the username.`
                      );
                    }
                  } catch (err) {
                    Alert.alert('Error', 'Failed to connect to GitHub. Please try again.');
                  } finally {
                    setIsLoadingGitHub(false);
                  }
                }}
              >
                {isLoadingGitHub ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>ANALYZE & CONNECT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Skill Gap Explanatory Modal */}
      <Modal
        visible={showSkillGapInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSkillGapInfoModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowSkillGapInfoModal(false)}
          />

          <View
            style={{
              backgroundColor: colors.card,
              borderColor: isDark ? 'rgba(91, 75, 255, 0.3)' : '#E0E7FF',
              borderWidth: 1.5,
              borderRadius: 24,
              padding: 22,
              width: '100%',
              maxWidth: 420,
              maxHeight: '88%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isDark ? '#312E81' : '#EEF2FF', justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={22} color="#5B4BFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Skill Gap Guide</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>How it works & how to boost scores</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowSkillGapInfoModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close-circle-outline" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Question 1: What is Skill Gap? */}
              <View style={{ marginBottom: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary, marginBottom: 4 }}>
                  1. What is Skill Gap Analysis?
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                  {isMed
                    ? `It compares your clinical competencies and theory curriculum (${user?.course || 'MBBS'}) against NMC guidelines and clinical licensing benchmarks.`
                    : `It compares your practical skill set against modern industry-standard benchmarks required for top tech roles in ${user?.course || 'your program'}. It is purely based on practical capabilities—not academic exam marks or attendance.`}
                </Text>
              </View>

              {/* Question 2: How are skills verified? */}
              <View style={{ marginBottom: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary, marginBottom: 4 }}>
                  {isMed ? '2. How are clinical competencies tracked?' : '2. How are your skills verified?'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                  {isMed
                    ? 'Clinical competencies are computed from your verified ERP logbook submissions, practical case presentations, and sessional evaluations.'
                    : 'Skills are verified from two active sources: your Student Profile Skills and your Connected GitHub Code Repositories (indexed languages, frameworks, and projects).'}
                </Text>
              </View>

              {/* Question 3: How to Clear Gaps? */}
              <View style={{ marginBottom: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary, marginBottom: 6 }}>
                  3. How do I clear gaps and boost my score?
                </Text>
                <View style={{ gap: 8 }}>
                  {!isMed && (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                      <Ionicons name="logo-github" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                      <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1, lineHeight: 17 }}>
                        <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Connect GitHub:</Text> Link your public GitHub profile to automatically index repositories and code stacks.
                      </Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 2 }} />
                    <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1, lineHeight: 17 }}>
                      <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Tap "Give Test":</Text> Take a 5-question diagnostic assessment to verify your knowledge and turn GAP into MATCHED.
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <Ionicons name="compass-outline" size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                    <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1, lineHeight: 17 }}>
                      <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Deep Dive Analysis:</Text> Access curated learning roadmaps to build projects and master missing industry skills.
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowSkillGapInfoModal(false)}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>Got it, Let's Learn!</Text>
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
              <View style={{ flex: 1 }}>
                <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
                  Hello, {(() => {
                    const candidate = user?.name || user?.full_name;
                    if (candidate && isNaN(Number(candidate)) && candidate.trim().toLowerCase() !== 'student' && !candidate.trim().toLowerCase().startsWith('student ')) {
                      return candidate.trim().split(' ')[0];
                    }
                    if (user?.rollno === '2300140100015') return 'Ankita';
                    if (user?.rollno === '2400141780033') return 'Syeda';
                    return user?.name || 'Student';
                  })()}
                </Text>
                <Text style={[styles.welcomeSub, { color: colors.textSecondary }]}>{getDisplayCourse(user)}</Text>
              </View>
              <MaterialCommunityIcons name="star-shooting-outline" size={32} color={colors.primary} style={{ opacity: 0.2 }} />
            </View>

            {/* Highlighted Placement Readiness Score Banner (Domain-Adaptive) */}
            {isCsEligible && (() => {
              const topReadiness = computePlacementReadinessScore(user, gitHubRepos);
              const isTech = topReadiness.isTech;
              let subtitleText = '';
              if (isTech) {
                subtitleText = topReadiness.startupRepos.length > 0
                  ? `🔥 ${topReadiness.startupRepos.length} Startup Repos • Tier-1 Ready`
                  : `${gitHubRepos.length} Repos Indexed • Tier-1 Eligible`;
              } else if (topReadiness.track === 'commerce_management') {
                subtitleText = '💼 Corporate Certs & Big 4 Advisory Ready';
              } else if (topReadiness.track === 'pharma_healthcare') {
                subtitleText = '🔬 QA/QC & Clinical Research Ready';
              } else {
                subtitleText = '📋 Academic & Professional Readiness Active';
              }

              return (
                <View
                  style={{
                    marginTop: 10,
                    marginBottom: 12,
                    borderRadius: 14,
                    overflow: 'hidden',
                  }}
                >
                  <LinearGradient
                    colors={isDark ? ['#1E1B4B', '#2E1065'] : ['#EEF2FF', '#FAF5FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1.5,
                      borderColor: isDark ? 'rgba(91, 75, 255, 0.4)' : '#C7D2FE',
                      borderRadius: 14,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <LinearGradient
                        colors={['#5B4BFF', '#7867FF']}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <MaterialCommunityIcons name="briefcase-check" size={20} color="#FFFFFF" />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 12, fontWeight: '900', color: isDark ? '#A5B4FC' : '#4338CA', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Placement Index
                          </Text>
                          <View style={{ backgroundColor: topReadiness.badgeColor + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: topReadiness.badgeColor }}>
                              {topReadiness.score >= 80 ? 'Ready 🚀' : topReadiness.score >= 60 ? 'On Track ⭐' : 'Building 📈'}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                          {subtitleText}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: isDark ? '#FFFFFF' : '#1E1B4B' }}>
                          {topReadiness.score}<Text style={{ fontSize: 11, color: colors.textMuted }}>/100</Text>
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              );
            })()}

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <LinearGradient
                colors={isDark ? ['rgba(234, 88, 12, 0.2)', 'rgba(234, 88, 12, 0.1)'] : ['#FFF7ED', '#FFEDD5']}
                style={[styles.statPillOrange, { borderColor: isDark ? 'rgba(234, 88, 12, 0.3)' : '#FFEDD5', flex: 1 }]}
              >
                <Text style={[styles.statValueOrange, { color: isDark ? '#FB923C' : '#9A3412' }]}>
                  {user?.cgpa !== undefined && user?.cgpa !== null && !isNaN(Number(user.cgpa)) && Number(user.cgpa) > 0 ? Number(user.cgpa).toFixed(2) : 'N/A'}
                </Text>
                <Text style={[styles.statLabelOrange, { color: isDark ? '#FB923C' : '#9A3412' }]}>ACADEMIC CGPA</Text>
              </LinearGradient>

              <LinearGradient
                colors={isDark ? ['rgba(67, 56, 202, 0.2)', 'rgba(67, 56, 202, 0.1)'] : ['#EEF2FF', '#E0E7FF']}
                style={[styles.statPillPurple, { borderColor: isDark ? 'rgba(67, 56, 202, 0.3)' : '#E0E7FF', flex: 1 }]}
              >
                <Text style={[styles.statValuePurple, { color: isDark ? '#818CF8' : '#3730A3' }]}>
                  {totalSocialCredits}
                </Text>
                <Text style={[styles.statLabelPurple, { color: isDark ? '#818CF8' : '#3730A3' }]}>SOCIAL CREDITS</Text>
              </LinearGradient>
            </View>

            {/* AI Insight Box (Top Header Icon + 100% Width Full Content) */}
            <LinearGradient
              colors={isDark ? ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)'] : ['#ECFDF5', '#D1FAE5']}
              style={[styles.aiSuggestionBox, { borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0' }]}
            >
              <View style={styles.aiInsightHeaderRow}>
                <View style={styles.aiInsightBadge}>
                  <MaterialCommunityIcons name="auto-fix" size={13} color={isDark ? '#34D399' : '#065F46'} />
                  <Text style={[styles.aiInsightBadgeText, { color: isDark ? '#34D399' : '#065F46' }]}>AI INSIGHT</Text>
                </View>
              </View>
              <Text style={[styles.aiSuggestionText, { color: isDark ? '#A7F3D0' : '#064E3B' }]}>
                {cachedInsight || 'Connecting to AI Engine...'}
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
                  <MaterialCommunityIcons name="heart-pulse" size={18} color="#EF4444" />
                </View>
                <View style={styles.fitnessHeaderText}>
                  <Text style={[styles.fitnessTitle, { color: colors.textPrimary }]}>Campus Fitness</Text>
                  <Text style={[styles.fitnessSub, { color: colors.textSecondary }]}>
                    {metrics.steps.toLocaleString()} / {goals.steps.toLocaleString()} steps today
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
              </View>

              <View style={styles.fitnessBody}>
                <View style={styles.fitnessRingContainer}>
                  <View style={[styles.ringStack, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityRing radius={30} stroke={9} progress={stepsProgress} color="#EF4444" bgColor="#EF444420" />
                    <ActivityRing radius={20} stroke={9} progress={caloriesProgress} color="#10B981" bgColor="#10B98120" />
                    <ActivityRing radius={10} stroke={9} progress={focusProgress} color="#3B82F6" bgColor="#3B82F620" />
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
                      <Text style={[styles.fitnessLabel, { color: colors.textSecondary }]}>GOAL</Text>
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

        {/* Hostel Connect (Side-by-Side 2-Column Grid) */}
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
                  size={18}
                  color={gatePassStatus === 'pending' ? '#D97706' : '#10B981'}
                />
                <Text style={[styles.gatePassText, { color: gatePassStatus === 'pending' ? '#D97706' : '#10B981' }]}>
                  {gatePassStatus === 'pending' ? 'WAITING...' : gatePassStatus === 'approved' ? 'VIEW PASS' : 'PASS'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hostelGridRow}>
              {/* Mess Menu */}
              <TouchableOpacity
                style={[styles.hostelCardCompact, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }]}
                onPress={() => Alert.alert('Premium Feature', 'Tonight\'s Mess Menu is locked in this demo.')}
                activeOpacity={0.8}
              >
                <View style={styles.hostelCardTop}>
                  <View style={[styles.hostelIconCircle, { backgroundColor: isDark ? '#374151' : '#FFF7ED' }]}>
                    <MaterialCommunityIcons name="food-variant" size={18} color="#EA580C" />
                  </View>
                  <MaterialCommunityIcons name="lock" size={14} color={colors.textMuted} />
                </View>
                <View style={{ marginTop: 6 }}>
                  <Text style={[styles.hostelCardTitle, { color: colors.textPrimary, textDecorationLine: 'line-through' }]}>Tonight's Dinner</Text>
                  <Text style={[styles.hostelCardSub, { color: colors.textSecondary }]} numberOfLines={1}>Paneer, Dal, Roti</Text>
                </View>
              </TouchableOpacity>

              {/* Laundry Status */}
              <TouchableOpacity
                style={[styles.hostelCardCompact, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }]}
                onPress={() => Alert.alert('Premium Feature', 'Live Laundry Status is locked in this demo.')}
                activeOpacity={0.8}
              >
                <View style={styles.hostelCardTop}>
                  <View style={[styles.hostelIconCircle, { backgroundColor: '#E0E7FF' }]}>
                    <MaterialCommunityIcons name="washing-machine" size={18} color="#4338CA" />
                  </View>
                  <MaterialIcons name="lock" size={14} color={colors.textMuted} />
                </View>
                <View style={{ marginTop: 6 }}>
                  <Text style={[styles.hostelCardTitle, { color: colors.textPrimary }]}>Laundry Status</Text>
                  <Text style={[styles.hostelCardSub, { color: colors.textSecondary }]} numberOfLines={1}>Locked in Demo</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Launchpad (Clean Balanced Alignment) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>Campus Launchpad</Text>

          <View style={styles.launchpadGrid}>
            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => Alert.alert('Premium Feature', 'This feature is locked in the free trial.')}
              activeOpacity={0.8}
            >
              <View style={styles.launchIconWrapper}>
                <LinearGradient colors={['#EA580C', '#9A3412']} style={[styles.launchIconBg, { opacity: 0.65 }]}>
                  <MaterialCommunityIcons name="food" size={24} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.launchpadLockTag}>
                  <MaterialIcons name="lock" size={7} color="#FFFFFF" />
                  <Text style={styles.launchpadLockTagText}>DEMO</Text>
                </View>
              </View>
              <Text style={[styles.launchText, { color: colors.textPrimary, opacity: 0.65 }]}>Order Food</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('RaiseIssue')}
              activeOpacity={0.8}
            >
              <View style={styles.launchIconWrapper}>
                <LinearGradient colors={['#FFD700', '#B8860B']} style={styles.launchIconBg}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#111827" />
                </LinearGradient>
              </View>
              <Text style={[styles.launchText, { color: colors.textPrimary }]}>Raise Issue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('TheHustle')}
              activeOpacity={0.8}
            >
              <View style={styles.launchIconWrapper}>
                <LinearGradient colors={['#059669', '#064E3B']} style={styles.launchIconBg}>
                  <MaterialCommunityIcons name="trending-up" size={24} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={[styles.launchText, { color: colors.textPrimary }]}>The Hustle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('ERPHub')}
              activeOpacity={0.8}
            >
              <View style={styles.launchIconWrapper}>
                <LinearGradient colors={['#D97706', '#92400E']} style={styles.launchIconBg}>
                  <MaterialCommunityIcons name="office-building" size={24} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={[styles.launchText, { color: colors.textPrimary }]}>ERP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pulse Check & Mentally Mindfulness Hub (Combined Sleek Card) */}
        <View style={styles.sectionContainer}>
          <View style={[styles.pulseCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.pulseHeaderRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 16 }]}>Pulse Check</Text>
                <Text style={[styles.sectionSub, { color: colors.textSecondary, fontSize: 11 }]}>How are you feeling today?</Text>
              </View>

              <View style={styles.moodRowCompact}>
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
                      styles.moodBtnCompact,
                      { backgroundColor: activeMood === mood.id ? '#EA580C' : isDark ? '#1F2937' : '#F1F5F9' }
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={mood.icon}
                      size={20}
                      color={activeMood === mood.id ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Inline Mentally Mindfulness Prompt */}
            <View style={[styles.mentallyInlineBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF', borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#E0E7FF' }]}>
              <MaterialCommunityIcons name="brain" size={16} color={isDark ? '#818CF8' : '#4338CA'} />
              <Text style={[styles.mentallyInlineText, { color: isDark ? '#C7D2FE' : '#3730A3' }]} numberOfLines={1}>
                Need a 5-min mindfulness break?
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('MentallyMain')}
                style={[styles.mentallyInlineActionBtn, { backgroundColor: isDark ? '#4338CA' : '#3730A3' }]}
              >
                <Text style={styles.mentallyInlineActionText}>TALK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* E-Library Module (Horizontal Carousel) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>E-Library</Text>
              <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Expand your knowledge</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('LibraryMain')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
            >
              <Text style={[styles.viewAllText, { color: '#EA580C' }]}>View All</Text>
              <MaterialIcons name="chevron-right" size={16} color="#EA580C" />
            </TouchableOpacity>
          </View>

          {featuredBooks.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.libraryScrollContent}
            >
              {featuredBooks.map((book) => {
                return (
                  <TouchableOpacity
                    key={book.id}
                    style={[styles.libraryBookCardCompact, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('BookDetail', { book })}
                    activeOpacity={0.8}
                  >
                    <BookCoverImage uri={book.cover} title={book.title} style={styles.libraryBookImgCompact} isCompact />
                    <View style={styles.libraryBookMeta}>
                      <Text style={[styles.libraryBookTitle, { color: colors.textPrimary, fontSize: 12 }]} numberOfLines={1}>{book.title}</Text>
                      <Text style={[styles.libraryBookAuthor, { color: colors.textMuted, fontSize: 10 }]} numberOfLines={1}>{book.author}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={[styles.libraryEmptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('LibraryMain')}
              activeOpacity={0.8}
            >
              <View style={[styles.libraryEmptyIconBg, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
                <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#6366F1" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>Digital Library Catalog</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Tap to browse official curriculum & reference e-books</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.innovationHeader}>
          <Text style={[styles.innovationBadge, { color: colors.primary }]}>INNOVATION HUB</Text>
          <Text style={[styles.innovationTitle, { color: colors.textPrimary }]}>{isMed ? 'Clinical Career Catalyst' : 'Career AI Catalyst'}</Text>
        </View>


        {/* Career Hub Side-by-Side 2-Column Grid */}
        <View style={styles.careerGrid}>
          {/* 1. Resume Builder */}
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('ResumeBuilder')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isDark ? [colors.card, colors.background] : ['#FFFFFF', '#FFFAF0']}
              style={[styles.compactResumeCard, { borderColor: colors.border }]}
            >
              <View style={[styles.compactResumeIcon, { backgroundColor: isDark ? colors.background : '#FFF7ED' }]}>
                <MaterialCommunityIcons name="file-document-edit-outline" size={22} color={colors.primary} />
              </View>

              <View style={{ flex: 1, justifyContent: 'center', marginVertical: 6 }}>
                <Text style={[styles.compactCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {isMed ? 'Clinical CV & Portfolio' : 'AI Resume Builder'}
                </Text>
                <Text style={[styles.compactCardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {isMed
                    ? 'Clinical postings & case logs.'
                    : `Tailored to your ${user?.cgpa || '8.9'} CGPA.`}
                </Text>
              </View>

              <View style={[styles.compactResumeBtn, { backgroundColor: isDark ? colors.primary : '#111827' }]}>
                <Text style={styles.compactResumeBtnText} numberOfLines={1}>
                  {isMed ? 'Build CV' : 'View Resume'}
                </Text>
                <MaterialCommunityIcons name="magic-staff" size={12} color="#FFFFFF" style={{ marginLeft: 3 }} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* 2. Mock Interview */}
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('MockInterview')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isDark ? ['#312E81', '#1E1B4B'] : ['#4338CA', '#312E81']}
              style={styles.compactInterviewCard}
            >
              <View style={styles.compactInterviewTop}>
                <View style={[styles.compactInterviewIconBg, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                  <MaterialCommunityIcons name="microphone" size={20} color={isDark ? colors.primary : "#4338CA"} />
                </View>
                <View style={styles.lockBadge}>
                  <MaterialIcons name="lock" size={9} color="#FFFFFF" />
                  <Text style={styles.lockBadgeText}>DEMO</Text>
                </View>
              </View>

              <View style={{ flex: 1, justifyContent: 'center', marginVertical: 6 }}>
                <Text style={styles.compactInterviewTitle} numberOfLines={2}>
                  {isMed ? 'Clinical Viva & OSCE' : 'Mock Interview'}
                </Text>
                <Text style={[styles.compactInterviewDesc, { color: '#C7D2FE' }]} numberOfLines={2}>
                  {isMed
                    ? 'Ward rounds & vivas.'
                    : "1:1 AI video practice."}
                </Text>
              </View>

              <View style={[styles.compactPracticingRow, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <View style={styles.practicingAvatars}>
                  <Image source={{ uri: getAvatarUrl('1') }} style={[styles.compactMiniAvatar, { borderColor: '#4338CA' }]} />
                  <Image source={{ uri: getAvatarUrl('2') }} style={[styles.compactMiniAvatar, { marginLeft: -8, borderColor: '#4338CA' }]} />
                  <View style={[styles.compactCountBadge, { backgroundColor: isDark ? colors.card : '#E0E7FF' }]}>
                    <Text style={[styles.compactCountText, { color: isDark ? colors.textPrimary : '#312E81' }]}>+12</Text>
                  </View>
                </View>
                <Text style={styles.compactPracticingText}>Active</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ========== PLACEMENT READINESS CARD (CS NON-MEDICAL ONLY) ========== */}
        {isCsEligible && user && (() => {
          const readiness = computePlacementReadinessScore(user, gitHubRepos);
          const ghLinked = !!(githubUsername || user?.github_username);

          return (
            <View style={styles.sectionContainer}>
              <LinearGradient
                colors={isDark ? ['#18182E', '#1F1B3C'] : ['#FFFFFF', '#F8FAFC']}
                style={[
                  styles.skillGapCard,
                  {
                    borderWidth: 1.5,
                    borderColor: isDark ? 'rgba(91, 75, 255, 0.35)' : '#E0E7FF',
                    paddingBottom: 20,
                    shadowColor: '#5B4BFF',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDark ? 0.25 : 0.08,
                    shadowRadius: 16,
                    elevation: 5,
                  }
                ]}
              >
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <LinearGradient
                      colors={['#5B4BFF', '#7867FF']}
                      style={{ width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <MaterialCommunityIcons name="briefcase-check" size={24} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.skillGapTitle, { color: colors.textPrimary, fontSize: 17, fontWeight: '800' }]}>
                        Placement Readiness
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        Multi-Signal AI Placement Index
                      </Text>
                    </View>
                  </View>

                  {/* Score Pill / Circle */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{
                      backgroundColor: readiness.badgeColor + '20',
                      borderColor: readiness.badgeColor,
                      borderWidth: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: readiness.badgeColor }}>
                        {readiness.score}%
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: readiness.badgeColor }}>
                        {readiness.label.split(' ')[0]}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Score Progress Bar */}
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                      Composite Index: <Text style={{ color: readiness.badgeColor, fontWeight: '900' }}>{readiness.score} / 100</Text>
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>
                      Target: 85+ (Tier 1 Offers)
                    </Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEF2F6', borderRadius: 4, overflow: 'hidden' }}>
                    <LinearGradient
                      colors={readiness.score >= 80 ? ['#10B981', '#059669'] : readiness.score >= 60 ? ['#F59E0B', '#D97706'] : ['#EF4444', '#DC2626']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: '100%', width: `${readiness.score}%`, borderRadius: 4 }}
                    />
                  </View>
                </View>

                {/* 5-Pill Metric Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {/* CGPA */}
                  <View style={{ flex: 1, minWidth: '30%', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' }}>CGPA (30%)</Text>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary, marginTop: 2 }}>{readiness.breakdown.cgpa.value}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#10B981', marginTop: 2 }}>+{readiness.breakdown.cgpa.score}/30 pts</Text>
                  </View>

                  {/* Attendance */}
                  <View style={{ flex: 1, minWidth: '30%', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' }}>
                      {readiness.isTech ? 'Att. (15%)' : 'Att. (20%)'}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary, marginTop: 2 }}>{readiness.breakdown.attendance.value}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#10B981', marginTop: 2 }}>
                      +{readiness.breakdown.attendance.score}/{readiness.isTech ? 15 : 20} pts
                    </Text>
                  </View>

                  {/* Core Skills */}
                  <View style={{ flex: 1, minWidth: '30%', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' }}>
                      {readiness.isTech ? 'Skills (20%)' : 'Skills (25%)'}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary, marginTop: 2 }}>{readiness.breakdown.skills.value}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#3B82F6', marginTop: 2 }}>
                      +{readiness.breakdown.skills.score}/{readiness.isTech ? 20 : 25} pts
                    </Text>
                  </View>

                  {/* Certs */}
                  <View style={{ flex: 1, minWidth: '45%', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' }}>
                      {readiness.isTech ? 'Certifications (10%)' : 'Certifications (15%)'}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary, marginTop: 2 }}>{readiness.breakdown.certs.value} Done</Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#7C3AED', marginTop: 2 }}>
                      +{readiness.breakdown.certs.score}/{readiness.isTech ? 10 : 15} pts
                    </Text>
                  </View>

                  {/* 5th Pillar: GitHub (Tech) or Internships (Non-Tech) */}
                  {readiness.isTech ? (
                    <View style={{ flex: 1, minWidth: '45%', backgroundColor: ghLinked ? (isDark ? 'rgba(88, 166, 255, 0.1)' : '#F0F6FF') : (isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC'), padding: 10, borderRadius: 12, borderWidth: 1, borderColor: ghLinked ? '#3B82F6' : (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0') }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: ghLinked ? '#3B82F6' : colors.textMuted, textTransform: 'uppercase' }}>GitHub (25%)</Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary, marginTop: 2 }}>{readiness.breakdown.github.value}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: ghLinked ? '#10B981' : '#F59E0B', marginTop: 2 }}>
                        {ghLinked ? `+${readiness.breakdown.github.score}/25 pts` : 'Unlock +25%'}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flex: 1, minWidth: '45%', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' }}>Internships (10%)</Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary, marginTop: 2 }}>
                        {readiness.breakdown.experience.value}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: readiness.breakdown.experience.score > 0 ? '#10B981' : '#F59E0B', marginTop: 2 }}>
                        +{readiness.breakdown.experience.score}/10 pts
                      </Text>
                    </View>
                  )}
                </View>

                {/* Tech: GitHub Banner | Non-Tech: Corporate Profile Highlight */}
                {readiness.isTech ? (
                  <View>
                    {/* GitHub Connection Banner */}
                    <View style={{
                      backgroundColor: ghLinked ? (isDark ? 'rgba(36, 41, 47, 0.6)' : '#F6F8FA') : (isDark ? 'rgba(234, 88, 12, 0.12)' : '#FFF7ED'),
                      borderRadius: 14,
                      padding: 12,
                      marginBottom: 14,
                      borderWidth: 1,
                      borderColor: ghLinked ? (isDark ? '#30363D' : '#D0D7DE') : (isDark ? 'rgba(234, 88, 12, 0.3)' : '#FFEDD5'),
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <MaterialCommunityIcons name="github" size={24} color={isDark ? '#FFFFFF' : '#24292F'} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>
                              {ghLinked ? `@${githubUsername || user?.github_username}` : 'Connect GitHub Account'}
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                              {ghLinked
                                ? `${gitHubRepos.length} Repos • ${readiness.totalStars} Stars • Languages: ${readiness.languages.slice(0, 3).join(', ') || 'Code'}`
                                : 'Analyze repositories, commit velocity & code quality'}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={{
                            backgroundColor: ghLinked ? (isDark ? '#30363D' : '#EAECEF') : colors.primary,
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 8,
                            marginLeft: 8,
                          }}
                          onPress={() => {
                            setGithubInput(githubUsername || user?.github_username || '');
                            setShowGitHubModal(true);
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '800', color: ghLinked ? colors.textPrimary : '#FFFFFF' }}>
                            {ghLinked ? 'Manage' : 'Connect'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Startup Potential Repos Section (Accordion - default collapsed) */}
                    {readiness.startupRepos && readiness.startupRepos.length > 0 && (
                      <View style={{
                        backgroundColor: isDark ? 'rgba(234, 88, 12, 0.08)' : '#FFF7ED',
                        borderRadius: 14,
                        padding: 12,
                        marginBottom: 14,
                        borderWidth: 1.5,
                        borderColor: '#F97316',
                      }}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setStartupReposOpen(!startupReposOpen);
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 8 }}>
                            <MaterialCommunityIcons name="fire" size={20} color="#EA580C" />
                            <Text style={{ flex: 1, fontSize: 12, fontWeight: '900', color: '#EA580C', textTransform: 'uppercase' }} numberOfLines={1}>
                              Future Startup Potential Repositories ({readiness.startupRepos.length})
                            </Text>
                          </View>
                          <MaterialIcons
                            name={startupReposOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                            size={22}
                            color="#EA580C"
                          />
                        </TouchableOpacity>

                        {startupReposOpen && (
                          <View style={{ marginTop: 10 }}>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 10 }}>
                              AI identified these high-value product repositories capable of scaling into ventures:
                            </Text>

                            <ScrollView
                              nestedScrollEnabled={true}
                              style={{ maxHeight: 240 }}
                              showsVerticalScrollIndicator={true}
                              contentContainerStyle={{ gap: 8 }}
                            >
                              {readiness.startupRepos.map((repo, rIdx) => (
                                <View
                                  key={rIdx}
                                  style={{
                                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                                    borderRadius: 10,
                                    padding: 10,
                                    borderWidth: 1,
                                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#FED7AA',
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                                      📦 {repo.name}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                      {Boolean(repo.language) && (
                                        <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#1E40AF' }}>{repo.language}</Text>
                                        </View>
                                      )}
                                      {Number(repo.stargazers_count) > 0 && (
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>★ {repo.stargazers_count}</Text>
                                      )}
                                    </View>
                                  </View>
                                  {Boolean(repo.description) && (
                                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }} numberOfLines={2}>
                                      {repo.description}
                                    </Text>
                                  )}
                                </View>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={{
                    backgroundColor: isDark ? 'rgba(91, 75, 255, 0.1)' : '#EEF2FF',
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(91, 75, 255, 0.25)' : '#C7D2FE',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="domain" size={22} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>
                          Corporate Industry Standing
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                          {readiness.score >= 80
                            ? 'Top-tier corporate & consulting placement eligibility verified'
                            : `Academics on track (${parseFloat(user?.cgpa || 8.5).toFixed(1)} CGPA). Complete certs & internships to unlock Tier-1`}
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: readiness.score >= 80 ? '#D1FAE5' : (isDark ? '#374151' : '#E0E7FF'),
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6
                      }}>
                        <Text style={{
                          fontSize: 10,
                          fontWeight: '900',
                          color: readiness.score >= 80 ? '#065F46' : (isDark ? '#A5B4FC' : '#4338CA')
                        }}>
                          {readiness.score >= 80 ? '✓ ELIGIBLE' : '🎯 IN PROGRESS'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* All Indexed Repositories (Accordion - default collapsed) — Tech students only */}
                {readiness.isTech && ghLinked && gitHubRepos.length > 0 && (
                  <View style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                  }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setIndexedReposOpen(!indexedReposOpen);
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 8 }}>
                        <MaterialCommunityIcons name="source-repository" size={18} color={colors.textSecondary} />
                        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', flex: 1 }} numberOfLines={1}>
                          All Indexed Repositories ({gitHubRepos.length})
                        </Text>
                      </View>
                      <MaterialIcons
                        name={indexedReposOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                        size={22}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {indexedReposOpen && (
                      <View style={{ marginTop: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 }}>
                          <Text style={{ fontSize: 10, color: colors.textMuted }}>Scroll to explore</Text>
                        </View>
                        <ScrollView
                          nestedScrollEnabled={true}
                          style={{ maxHeight: 220 }}
                          showsVerticalScrollIndicator={true}
                          contentContainerStyle={{ gap: 6 }}
                        >
                          {gitHubRepos.map((repo, idx) => (
                            <View
                              key={idx}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: isDark ? colors.card : '#FFFFFF',
                                padding: 8,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                              }}
                            >
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                                  {repo.name}
                                </Text>
                                <Text style={{ fontSize: 10, color: colors.textMuted }} numberOfLines={1}>
                                  {repo.language || 'Code'} • Updated {new Date(repo.updated_at).toLocaleDateString()}
                                </Text>
                              </View>
                              {repo.isStartupPotential && (
                                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 6 }}>
                                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#D97706' }}>🔥 Startup</Text>
                                </View>
                              )}
                              {Number(repo.stargazers_count) > 0 && (
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>
                                  ★ {repo.stargazers_count}
                                </Text>
                              )}
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}

                {/* ── Diagnostic Strengths & Weaknesses Section (Accordions) ── */}
                <View style={{ marginTop: 14 }}>
                  {/* Section Title */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Placement Strengths & Gaps
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <View style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981' }}>{readiness.strengths.length} Strengths</Text>
                      </View>
                      <View style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#D97706' }}>{readiness.weaknesses.length} Gaps</Text>
                      </View>
                    </View>
                  </View>

                  {/* Strengths Accordion */}
                  {readiness.strengths.length > 0 && (
                    <View style={{ marginBottom: 12, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : '#F0FDF4', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7' }}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setPlacementStrengthsOpen(!placementStrengthsOpen);
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="check-decagram" size={16} color="#10B981" />
                          <Text style={{ fontSize: 11, fontWeight: '900', color: '#10B981', textTransform: 'uppercase' }}>
                            Key Strengths & Advantages ({readiness.strengths.length})
                          </Text>
                        </View>
                        <MaterialIcons
                          name={placementStrengthsOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                          size={20}
                          color="#10B981"
                        />
                      </TouchableOpacity>

                      {placementStrengthsOpen && (
                        <View style={{ gap: 6, marginTop: 8 }}>
                          {readiness.strengths.map((item, sIdx) => (
                            <View
                              key={sIdx}
                              style={{
                                backgroundColor: isDark ? colors.card : '#FFFFFF',
                                borderRadius: 10,
                                padding: 10,
                                borderLeftWidth: 3,
                                borderLeftColor: '#10B981',
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                              }}
                            >
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary, flex: 1 }}>
                                  {item.title}
                                </Text>
                                <View style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 }}>
                                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#065F46' }}>{item.tag}</Text>
                                </View>
                              </View>
                              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 3, lineHeight: 15 }}>
                                {item.desc}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Weaknesses / Gaps Accordion */}
                  {readiness.weaknesses.length > 0 && (
                    <View style={{ marginBottom: 12, backgroundColor: isDark ? 'rgba(245, 158, 11, 0.05)' : '#FFFBEB', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setPlacementWeaknessesOpen(!placementWeaknessesOpen);
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="alert-decagram-outline" size={16} color="#F59E0B" />
                          <Text style={{ fontSize: 11, fontWeight: '900', color: '#D97706', textTransform: 'uppercase' }}>
                            Identified Weaknesses & Gaps ({readiness.weaknesses.length})
                          </Text>
                        </View>
                        <MaterialIcons
                          name={placementWeaknessesOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                          size={20}
                          color="#D97706"
                        />
                      </TouchableOpacity>

                      {placementWeaknessesOpen && (
                        <View style={{ gap: 6, marginTop: 8 }}>
                          {readiness.weaknesses.map((item, wIdx) => (
                            <View
                              key={wIdx}
                              style={{
                                backgroundColor: isDark ? colors.card : '#FFFFFF',
                                borderRadius: 10,
                                padding: 10,
                                borderLeftWidth: 3,
                                borderLeftColor: '#F59E0B',
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                              }}
                            >
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary, flex: 1 }}>
                                  {item.title}
                                </Text>
                                <View style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 }}>
                                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#92400E' }}>{item.tag}</Text>
                                </View>
                              </View>
                              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 3, lineHeight: 15 }}>
                                {item.desc}
                              </Text>
                              {item.action && (
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 4 }}>
                                  <MaterialCommunityIcons name="lightbulb-on-outline" size={13} color="#D97706" style={{ marginTop: 1 }} />
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#D97706', flex: 1 }}>
                                    Action: {item.action}
                                  </Text>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Actionable Focus Areas Accordion */}
                <View style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#EFF6FF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setPlacementActionItemsOpen(!placementActionItemsOpen);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="target" size={16} color="#2563EB" />
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#2563EB', textTransform: 'uppercase' }}>
                        Top Placement Action Items ({readiness.needsAttention.length})
                      </Text>
                    </View>
                    <MaterialIcons
                      name={placementActionItemsOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                      size={20}
                      color="#2563EB"
                    />
                  </TouchableOpacity>

                  {placementActionItemsOpen && (
                    <View style={{ marginTop: 8, gap: 4 }}>
                      {readiness.needsAttention.map((item, aIdx) => (
                        <View key={aIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: aIdx === 0 ? 0 : 4 }}>
                          <Text style={{ fontSize: 11, color: '#2563EB' }}>•</Text>
                          <Text style={{ fontSize: 11, color: colors.textPrimary, flex: 1, fontWeight: '600' }}>
                            {item}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          );
        })()}

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

              <TouchableOpacity
                onPress={() => setShowSkillGapInfoModal(true)}
                style={{
                  padding: 6,
                  borderRadius: 20,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
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
              const gapData = computeSkillGap(user, academicResults, erpCompetencies, gitHubRepos);
              const isTech = Boolean(gapData?.isTechnical);
              const targetGoal = user.course?.toLowerCase().includes('medicine') || user.course?.toLowerCase().includes('mbbs')
                ? 'NEET-PG / NEXT' : user.course?.toLowerCase().includes('computer') || user.course?.toLowerCase().includes('cse') || isTech
                  ? 'Top Tech Product Roles & FAANG' : 'Top Placements';

              let missingItems = isTech
                ? (gapData.missingSkills && gapData.missingSkills.length > 0
                  ? gapData.missingSkills.map(skill => ({ name: skill, isMissing: true }))
                  : gapData.expectedSkills.map(skill => ({ name: skill, isMissing: false })))
                : [
                  ...gapData.academicMissingSkills.map(skill => ({ name: skill, isAcademic: true, isMissing: true })),
                  ...gapData.industryMissingSkills.map(skill => ({ name: skill, isAcademic: false, isMissing: true }))
                ];
              if (!isTech && missingItems.length === 0) {
                missingItems = [
                  ...gapData.academicExpectedSkills.map(skill => ({ name: skill, isAcademic: true, isMissing: false })),
                  ...gapData.industryExpectedSkills.map(skill => ({ name: skill, isAcademic: false, isMissing: false }))
                ];
              }
              const displaySkills = missingItems.slice(0, 10).map(item => {
                const score = gapData.skillScores?.[item.name] ??
                  (item.isMissing ? 20 : 90);
                const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
                return { ...item, score, color };
              });

              return (
                <>
                  <Text style={[styles.skillGapDesc, { color: colors.textSecondary, marginBottom: 0 }]}>
                    {isMed
                      ? `What clinical competencies are missing for ${targetGoal}?`
                      : (isTech ? `Industry benchmark skills vs your profile skills & GitHub repos for ${targetGoal}:` : `What's missing for ${targetGoal}?`)}
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
                    <View style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5', borderWidth: 1, borderColor: isDark ? 'rgba(16,185,129,0.2)' : '#A7F3D0' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981', textTransform: 'uppercase', marginBottom: 4 }}>
                        {isMed ? 'Prof Theory Prep' : (isTech ? 'Must-Have Skills Verified' : 'Academic Prep')}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>
                          {isTech ? `${gapData.matchedSkills?.length || 0}/${gapData.expectedSkills?.length || 0}` : `${gapData.academicMatchPct}%`}
                        </Text>
                        <View style={{ flex: 1, height: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 2 }}>
                          <View style={{ height: '100%', width: `${gapData.matchPct}%`, backgroundColor: '#10B981', borderRadius: 2 }} />
                        </View>
                      </View>
                    </View>
                    <View style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: isDark ? 'rgba(124,58,237,0.1)' : '#F5F3FF', borderWidth: 1, borderColor: isDark ? 'rgba(124,58,237,0.2)' : '#EDE9FE' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#7C3AED', textTransform: 'uppercase', marginBottom: 4 }}>
                        {isMed ? 'Clinical Competency' : (isTech ? 'GitHub Code Repos' : 'Industry Skill')}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>
                          {isTech ? `${gapData.githubRepoCount || 0} Repos` : `${gapData.industryMatchPct}%`}
                        </Text>
                        <View style={{ flex: 1, height: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 2 }}>
                          <View style={{ height: '100%', width: `${Math.min((gapData.githubRepoCount || 0) * 20, 100)}%`, backgroundColor: '#7C3AED', borderRadius: 2 }} />
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={{ marginBottom: 14 }}>
                    <ScrollView
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      style={styles.skillGapScrollContainer}
                      contentContainerStyle={styles.skillGapProgressSection}
                    >
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
                                  backgroundColor: isTech ? '#5B4BFF15' : (skill.isAcademic ? (isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF') : (isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF')),
                                  borderWidth: 0.5,
                                  borderColor: isTech ? '#5B4BFF' : (skill.isAcademic ? '#3B82F6' : '#7C3AED')
                                }}>
                                  <Text style={{
                                    fontSize: 8,
                                    fontWeight: '800',
                                    color: isTech ? '#5B4BFF' : (skill.isAcademic ? '#3B82F6' : '#7C3AED'),
                                    textTransform: 'uppercase',
                                  }}>
                                    {isTech
                                      ? (gapData.requiredSkillObjs?.find(r => r.name === skill.name)?.tag || 'Tech')
                                      : (skill.isAcademic ? (isMed ? 'Theory' : 'Academic') : (isMed ? 'Clinical' : 'Industry'))}
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
                                    {skill.isMissing ? 'Missing Gap' : 'Verified'}
                                  </Text>
                                </View>
                              </View>
                              {isTech && gapData.skillEvidences?.[skill.name] && (
                                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                                  {gapData.skillEvidences[skill.name]}
                                </Text>
                              )}
                            </View>
                            <Text style={[styles.skillPercent, { color: skill.color, fontSize: 13, fontWeight: '800' }]}>{skill.score}%</Text>
                          </View>
                          <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', marginTop: 6 }]}>
                            <View style={[styles.progressBarFill, { width: `${Math.max(skill.score, 5)}%`, backgroundColor: skill.color }]} />
                          </View>
                        </View>
                      ))}
                    </ScrollView>

                    {displaySkills.length > 3 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6 }}>
                        <MaterialCommunityIcons name="swap-vertical" size={13} color={colors.textMuted} />
                        <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>
                          Showing 3 of {displaySkills.length} skills • Scroll inside for more
                        </Text>
                      </View>
                    )}
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

        {/* ========== CAREER ROADMAP (COMPACT VERTICAL TIMELINE) ========== */}
        <View style={styles.sectionContainer}>
          <View style={styles.roadmapHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <Text style={[styles.roadmapTitle, { color: colors.textPrimary }]}>
                {roadmapData ? `Suggested ${roadmapData.label}` : 'Suggested Career Roadmap'}
              </Text>

              {roadmapData && roadmapData.target ? (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#451A03' : '#FEF3C7',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#F59E0B'
                }}>
                  <MaterialCommunityIcons name="briefcase-check" size={13} color={isDark ? '#FCD34D' : '#D97706'} />
                  <Text style={{ marginLeft: 4, fontSize: 11, fontWeight: '800', color: isDark ? '#FCD34D' : '#D97706' }}>
                    {isMed ? 'Specialty: ' : 'Target: '}{roadmapData.target}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.timelineContainer, { marginTop: 8 }]}>
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
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={[styles.timelineYear, { color: isDark && isCurrent ? '#FED7AA' : (isCurrent ? '#EA580C' : colors.textSecondary) }]}>
                              {isMed ? `PROF PHASE ${step.n}` : `PHASE ${step.n}`}
                            </Text>
                            {isCurrent && (
                              <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>CURRENT PHASE</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.timelineCardTitle, { color: isDark && isCurrent ? '#FFFFFF' : colors.textPrimary }]} numberOfLines={1}>{step.title}</Text>
                          <Text style={{ fontSize: 11, lineHeight: 14, color: isDark && isCurrent ? '#FED7AA' : (isCurrent ? '#4B5563' : colors.textSecondary) }} numberOfLines={2}>{step.desc}</Text>
                        </LinearGradient>
                      </View>
                    );
                  });
                })()}

                {/* Pathway Outcome */}
                {roadmapData && (
                  <View style={[styles.timelineItem, { marginTop: 2 }]}>
                    <View style={styles.timelineDotWrapper}>
                      <LinearGradient colors={['#F59E0B', '#D97706']} style={[styles.timelineDot, styles.timelineDotActive, { borderColor: isDark ? '#FEF3C7' : '#FEF3C7' }]} />
                    </View>
                    <LinearGradient
                      colors={isDark ? ['#451A03', '#78350F'] : ['#FEF3C7', '#FDE68A']}
                      style={[styles.timelineCard, { borderColor: '#F59E0B', borderWidth: 1 }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <MaterialCommunityIcons name="trophy" size={13} color={isDark ? '#FCD34D' : '#D97706'} />
                        <Text style={[styles.timelineYear, { color: isDark ? '#FCD34D' : '#D97706', marginLeft: 4, marginBottom: 0 }]}>PATHWAY OUTCOME</Text>
                      </View>
                      <Text style={[styles.timelineCardTitle, { color: isDark ? '#FFFFFF' : colors.textPrimary, fontSize: 12, marginBottom: 0 }]}>
                        {roadmapData.outcome}
                      </Text>
                    </LinearGradient>
                  </View>
                )}
              </>
            )}

            {/* Dynamic Interests Input (Course & Branch Adaptive) — Collapsible Accordion */}
            {(() => {
              const refineConfig = getPathwayRefineConfig(user);
              return (
                <View style={{ marginTop: 6 }}>
                  <TouchableOpacity
                    onPress={() => setIsRefineExpanded(prev => !prev)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      backgroundColor: colors.card,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                      <MaterialCommunityIcons name="sparkles" size={13} color={colors.primary} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                        {interestsInput ? `Targeting: ${interestsInput}` : 'Customise Target Specialization / Goal'}
                      </Text>
                    </View>
                    <MaterialIcons
                      name={isRefineExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {isRefineExpanded && (
                    <View style={{
                      marginTop: 6,
                      padding: 10,
                      backgroundColor: colors.card,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6, lineHeight: 14 }}>
                        {refineConfig.desc}
                      </Text>

                      {/* Suggested Topic Quick Chips */}
                      {Array.isArray(refineConfig.chips) && refineConfig.chips.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                          {refineConfig.chips.map((chip, cIdx) => {
                            const isSelected = interestsInput.toLowerCase().includes(chip.toLowerCase());
                            return (
                              <TouchableOpacity
                                key={cIdx}
                                onPress={() => {
                                  if (isSelected) {
                                    setInterestsInput('');
                                  } else {
                                    setInterestsInput(chip);
                                  }
                                }}
                                style={{
                                  backgroundColor: isSelected ? (isDark ? '#312E81' : '#EEF2FF') : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
                                  borderColor: isSelected ? colors.primary : colors.border,
                                  borderWidth: 1,
                                  paddingHorizontal: 7,
                                  paddingVertical: 3,
                                  borderRadius: 6,
                                }}
                              >
                                <Text style={{ fontSize: 10, fontWeight: isSelected ? '800' : '600', color: isSelected ? colors.primary : colors.textSecondary }}>
                                  {isSelected ? `✓ ${chip}` : `+ ${chip}`}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TextInput
                          style={{ flex: 1, backgroundColor: isDark ? colors.background : '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, color: colors.textPrimary, fontSize: 11 }}
                          placeholder={refineConfig.placeholder}
                          placeholderTextColor={colors.textSecondary}
                          value={interestsInput}
                          onChangeText={setInterestsInput}
                        />
                        <TouchableOpacity
                          style={{ backgroundColor: pathwayRetriesLeft > 0 ? colors.primary : colors.textMuted, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
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
                            setIsRefineExpanded(false);
                          }}
                        >
                          {pathwayRetriesLeft === 0 && <MaterialIcons name="lock" size={12} color="#fff" />}
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>
                            {pathwayRetriesLeft > 0 ? `Refine` : 'Locked'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })()}
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
    marginTop: 16,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  aiInsightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiInsightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  aiInsightBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  aiSuggestionText: {
    fontSize: 12,
    lineHeight: 18,
  },

  moduleTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  launchpadGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  launchBtn: {
    alignItems: 'center',
    width: '23%',
  },
  launchIconWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  launchIconBg: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  launchpadLockTag: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 5,
  },
  launchpadLockTagText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  launchText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  pulseCard: {
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  pulseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: 13,
    marginTop: 2,
  },

  moodRowCompact: {
    flexDirection: 'row',
    gap: 6,
  },
  moodBtnCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentallyInlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  mentallyInlineText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  mentallyInlineActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mentallyInlineActionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  innovationHeader: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  innovationBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  innovationTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.5,
  },

  careerGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  compactResumeCard: {
    borderRadius: 24,
    padding: 14,
    minHeight: 200,
    borderWidth: 1,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  compactResumeIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
  },
  compactCardDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  compactResumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    alignSelf: 'stretch',
    marginTop: 6,
  },
  compactResumeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  compactInterviewCard: {
    borderRadius: 24,
    padding: 14,
    minHeight: 200,
    justifyContent: 'space-between',
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  compactInterviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactInterviewIconBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactInterviewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 19,
  },
  compactInterviewDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EA580C',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lockBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  compactPracticingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 6,
  },
  compactMiniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  compactCountBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -6,
  },
  compactCountText: {
    fontSize: 8,
    fontWeight: '900',
  },
  compactPracticingText: {
    color: '#E0E7FF',
    fontSize: 10,
    fontWeight: '700',
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
  skillGapScrollContainer: {
    maxHeight: 185,
  },
  skillGapProgressSection: {
    gap: 14,
    paddingRight: 6,
    paddingBottom: 4,
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
    marginBottom: 8,
  },
  timelineDotWrapper: {
    width: 22,
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  timelineDotActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FED7AA',
    marginTop: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    position: 'absolute',
    top: 22,
    bottom: -8,
    left: '50%',
    marginLeft: -1,
  },
  timelineCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginLeft: 6,
    marginBottom: 0,
  },
  timelineCardActive: {
    borderWidth: 1.5,
    borderColor: '#EA580C',
  },
  timelineYear: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  timelineCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
    marginTop: 2,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  activeBadgeText: {
    fontSize: 8,
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
    fontSize: 13,
    fontWeight: '800',
  },
  libraryScrollContent: {
    gap: 12,
    paddingVertical: 4,
  },
  libraryBookCardCompact: {
    width: 120,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  libraryBookImgCompact: {
    width: '100%',
    height: 130,
    backgroundColor: '#F1F5F9',
  },
  libraryBookMeta: {
    padding: 8,
  },
  libraryBookTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  libraryBookAuthor: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  libraryEmptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 4,
  },
  libraryEmptyIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Hostel Mode Styles
  hostelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gatePassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  gatePassText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hostelGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  hostelCardCompact: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  hostelCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hostelIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostelCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  hostelCardSub: {
    fontSize: 11,
    marginTop: 2,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialogCard: {
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
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