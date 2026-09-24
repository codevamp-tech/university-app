/**
 * PlacementReadinessScreen.js
 * ─────────────────────────────────────────────────────────────────
 * Dedicated Placement Readiness & Career Diagnostic Hub for CS Students.
 * Features:
 *   - AI Composite Readiness Score & Percentile Rank
 *   - SWOT Diagnostic Matrix (Strengths, Weaknesses, Growth Actions)
 *   - Live Campus Placement Drives & Registration (ERP API integration)
 *   - GitHub Code Intelligence & Future Startup Potential Detector
 *   - Tier 1/2/3 Corporate Eligibility Predictor
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Share,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import {
  fetchGitHubRepos,
  fetchGitHubUser,
  getErpPlacementDrives,
  getMyPlacementRegistrations,
  getErpPlacementOffers,
  respondToPlacementOffer,
  applyForPlacementDrive,
  getErpInternships,
  applyForErpInternship,
  getErpRepositoryList,
  registerForDrive,
} from '../../data/apiService';
import {
  isCsEligibleForPlacement,
  computePlacementReadinessScore,
  getStudentPlacementTrack,
  DOMAIN_SKILLS,
  DOMAIN_CERTIFICATIONS,
  DOMAIN_EXPERIENCE,
  getPlacementTiers,
} from '../../utils/placementReadiness';
import {
  generateLLMPlacementAudit,
  getCachedLLMPlacementAudit,
} from '../../data/aiEngine';

const { width } = Dimensions.get('window');

const parseGithubHandle = (input) => {
  if (!input || typeof input !== 'string') return '';
  let clean = input.trim();
  clean = clean.replace(/\/+$/, '');
  const urlMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-_]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  clean = clean.replace(/^@/, '');
  return clean.split('/')[0].trim();
};

const PlacementReadinessScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken, githubUsername, updateGithubUsername } = useUser();

  const track = getStudentPlacementTrack(user);
  const isTech = track === 'tech';

  const dynamicTabs = useMemo(() => {
    if (isTech) {
      return [
        { key: 'readiness', label: 'Readiness & SWOT', icon: 'speedometer' },
        { key: 'drives', label: 'Campus Drives', icon: 'briefcase' },
        { key: 'github', label: 'GitHub AI', icon: 'github' },
        { key: 'eligibility', label: 'Tech Roadmaps', icon: 'domain' },
      ];
    }
    return [
      { key: 'readiness', label: 'Readiness & SWOT', icon: 'speedometer' },
      { key: 'drives', label: 'Campus Drives', icon: 'briefcase' },
      { key: 'portfolio', label: 'Certifications & Internships', icon: 'certificate-outline' },
      { key: 'eligibility', label: 'Corporate Roadmaps', icon: 'domain' },
    ];
  }, [isTech]);

  const [activeTab, setActiveTab] = useState('readiness');
  const [refreshing, setRefreshing] = useState(false);

  // GitHub state
  const [gitHubRepos, setGitHubRepos] = useState([]);
  const [gitHubUser, setGitHubUser] = useState(null);
  const [loadingGh, setLoadingGh] = useState(false);
  const [showGhModal, setShowGhModal] = useState(false);
  const [ghInput, setGhInput] = useState('');
  const [inlineGhInput, setInlineGhInput] = useState(githubUsername || user?.github_username || '');
  const [isEditingGh, setIsEditingGh] = useState(false);
  const [showAllStartupRepos, setShowAllStartupRepos] = useState(false);
  const [showAllTopRepos, setShowAllTopRepos] = useState(false);
  const [showAllGithubTabRepos, setShowAllGithubTabRepos] = useState(false);

  // Weekly LLM Deep Audit state
  const [llmAudit, setLlmAudit] = useState(null);
  const [loadingLlmAudit, setLoadingLlmAudit] = useState(false);

  // Drives state
  const [drives, setDrives] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(false);
  const [registeringId, setRegisteringId] = useState(null);
  // ERP Internships + Repository (for portfolio tab)
  const [erpInternships, setErpInternships] = useState([]);
  const [internshipsCount, setInternshipsCount] = useState(0);
  const [erpRepository, setErpRepository] = useState([]);
  const [applyingInternshipId, setApplyingInternshipId] = useState(null);

  // Load GitHub repos
  const loadGitHub = useCallback(async (username, force = false) => {
    const handle = parseGithubHandle(username || githubUsername || user?.github_username);
    if (!handle) return;
    setLoadingGh(true);
    try {
      const [repos, ghProfile] = await Promise.all([
        fetchGitHubRepos(handle, force),
        fetchGitHubUser(handle),
      ]);
      setGitHubRepos(repos || []);
      setGitHubUser(ghProfile);
    } catch (e) {
      console.warn('[PlacementReadiness] GitHub load error:', e);
    } finally {
      setLoadingGh(false);
    }
  }, [githubUsername, user?.github_username]);

  const handleAnalyzeGithub = async (rawInput) => {
    const handle = parseGithubHandle(rawInput || inlineGhInput);
    if (!handle) {
      Alert.alert('Input Required', 'Please enter a valid GitHub username or profile URL (e.g. https://github.com/torvalds).');
      return;
    }
    setLoadingGh(true);
    // Clear old repos immediately to prevent stale mixing
    setGitHubRepos([]);
    setGitHubUser(null);
    try {
      const repos = await fetchGitHubRepos(handle, true);
      const profile = await fetchGitHubUser(handle);
      if (repos && repos.length > 0) {
        await updateGithubUsername(handle);
        setGitHubRepos(repos);
        setGitHubUser(profile);
        setInlineGhInput(handle);
        setIsEditingGh(false);
        Alert.alert(
          'GitHub Synced! 🚀',
          `Successfully connected to @${handle}! Previous repositories were cleared and ${repos.length} fresh repositories have been indexed, ranked, and flagged for startup potential.`
        );
      } else {
        Alert.alert(
          'No Repositories Found',
          `Could not find public repositories for "${handle}". Please verify the username or profile URL.`
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to connect to GitHub. Please try again.');
    } finally {
      setLoadingGh(false);
    }
  };

  const handleDisconnectGithub = () => {
    Alert.alert(
      'Disconnect GitHub',
      'Are you sure you want to remove the current GitHub connection? All indexed repositories will be removed and your score recalculated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await updateGithubUsername(null);
            setGitHubRepos([]);
            setGitHubUser(null);
            setInlineGhInput('');
            setIsEditingGh(false);
            Alert.alert('Disconnected', 'GitHub account unlinked and portfolio data cleared.');
          },
        },
      ]
    );
  };

  // Load ERP Drives (from NestJS ERP backend)
  const loadDrives = useCallback(async () => {
    if (!accessToken) return;
    setLoadingDrives(true);
    try {
      const studentCourse = user?.course || user?.course_cd || user?.department;
      const [drivesRes, regsRes, offersRes, internshipsRes, repoRes] = await Promise.all([
        getErpPlacementDrives(accessToken, 'open', studentCourse),
        getMyPlacementRegistrations(accessToken),
        getErpPlacementOffers(accessToken),
        getErpInternships(accessToken),
        getErpRepositoryList(accessToken).catch(() => []),
      ]);
      const rawDrives = Array.isArray(drivesRes) ? drivesRes : [];
      const userCourses = [
        user?.course,
        user?.course_name,
        user?.course_cd,
        user?.course_id,
        user?.department,
        user?.branch,
      ].filter(Boolean).map(c => (c || '').toLowerCase().replace(/[^a-z0-9]/g, ''));

      const filteredDrives = userCourses.length === 0 ? rawDrives : rawDrives.filter(drive => {
        const driveTarget = drive.courses || drive.eligible_courses || drive.eligibility_course_cd;
        if (!driveTarget) return true;
        let driveCourseList = [];
        if (Array.isArray(driveTarget)) {
          driveCourseList = driveTarget.flatMap(item => (item || '').split(/[,;/|]+/));
        } else if (typeof driveTarget === 'string') {
          driveCourseList = driveTarget.split(/[,;/|]+/);
        }
        const normList = driveCourseList.map(c => (c || '').toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
        if (normList.length === 0 || normList.includes('all') || normList.includes('any')) return true;
        return normList.some(dCourse =>
          userCourses.some(sCourse =>
            dCourse === sCourse ||
            (dCourse.length >= 3 && sCourse.length >= 3 && (dCourse.includes(sCourse) || sCourse.includes(dCourse)))
          )
        );
      });

      setDrives(filteredDrives);
      setRegistrations(Array.isArray(regsRes) ? regsRes : []);
      setOffers(Array.isArray(offersRes) ? offersRes : []);
      if (Array.isArray(internshipsRes)) {
        setErpInternships(internshipsRes);
        const applied = internshipsRes.filter(i => i.applied || i.status === 'applied' || i.my_application);
        setInternshipsCount(applied.length);
      }
      if (Array.isArray(repoRes)) {
        setErpRepository(repoRes);
      }
    } catch (e) {
      console.warn('[PlacementReadiness] Drives load error:', e);
    } finally {
      setLoadingDrives(false);
    }
  }, [accessToken, user]);

  // Load cached weekly LLM placement audit
  useEffect(() => {
    const handle = githubUsername || user?.github_username || user?.rollno;
    if (handle) {
      getCachedLLMPlacementAudit(handle).then(cached => {
        if (cached) setLlmAudit(cached);
      });
    }
  }, [githubUsername, user?.github_username, user?.rollno]);

  const handleRunLLMAudit = async (force = false) => {
    if (gitHubRepos.length === 0) {
      Alert.alert('Connect GitHub First', 'Please link your GitHub account and fetch repositories before running the AI Deep Code Audit.');
      return;
    }
    if (llmAudit && !llmAudit.isExpired && !force) {
      Alert.alert(
        'Weekly AI Audit Active',
        `Your AI Deep Code & Architecture Audit is already cached and valid for the current week. Next free refresh available in ${llmAudit.daysRemaining} days.\n\nDo you want to re-run it anyway?`,
        [
          { text: 'View Current Audit', style: 'cancel' },
          { text: 'Force Re-Scan', onPress: () => handleRunLLMAudit(true) },
        ]
      );
      return;
    }
    setLoadingLlmAudit(true);
    try {
      const audit = await generateLLMPlacementAudit(
        { ...user, github_username: githubUsername || user?.github_username },
        gitHubRepos,
        accessToken,
        force
      );
      setLlmAudit(audit);
      Alert.alert('AI Deep Audit Complete! ✨', 'Your code architecture, startup feasibility, and placement interview questions have been generated.');
    } catch (err) {
      Alert.alert('AI Audit Error', 'Unable to complete AI code analysis. Please try again.');
    } finally {
      setLoadingLlmAudit(false);
    }
  };

  useEffect(() => {
    if (isTech) {
      loadGitHub();
    }
    loadDrives();
  }, [isTech, loadGitHub, loadDrives]);

  const onRefresh = async () => {
    setRefreshing(true);
    const refreshTasks = [loadDrives()];
    if (isTech) {
      refreshTasks.push(loadGitHub(null, true));
    }
    await Promise.all(refreshTasks);
    if (isTech) {
      const handle = githubUsername || user?.github_username || user?.rollno;
      if (handle) {
        const cached = await getCachedLLMPlacementAudit(handle);
        if (cached) setLlmAudit(cached);
      }
    }
    setRefreshing(false);
  };

  const handleRegisterDrive = async (driveId) => {
    if (!accessToken) {
      Alert.alert('Session Expired', 'Please re-login to register for drives.');
      return;
    }
    setRegisteringId(driveId);
    try {
      const res = await registerForDrive(accessToken, driveId);
      if (res && res.success) {
        Alert.alert('Registration Successful! 🎉', 'You have been registered for this placement drive.');
        await loadDrives();
      } else {
        Alert.alert('Registration Status', res?.message || 'Unable to complete drive registration.');
      }
    } catch (e) {
      Alert.alert('Registration Error', 'An error occurred while registering for this drive.');
    } finally {
      setRegisteringId(null);
    }
  };

  const baseReadiness = computePlacementReadinessScore(user, isTech ? gitHubRepos : []);
  const readiness = {
    ...baseReadiness,
    score: Math.min(baseReadiness.score + (isTech ? (llmAudit?.verifiedBonusPoints || 0) : 0), 100),
  };
  const registrationMap = registrations.reduce((acc, r) => {
    acc[r.drive_id] = r;
    return acc;
  }, {});

  const [isExportingPlacementPDF, setIsExportingPlacementPDF] = useState(false);

  const handleShareWhatsApp = async () => {
    const studentName = user?.name || user?.full_name || 'Student';
    const course = user?.course || 'Undergraduate';
    const shareMsg = `🎓 *UniCampus AI • Placement Readiness Report*\n` +
      `👤 *Student:* ${studentName} (${user?.rollno || user?.username || ''})\n` +
      `📚 *Course:* ${course} • ${user?.branch || ''}\n` +
      `📊 *Readiness Index:* ${readiness.score}/100 (${readiness.label.split(' ')[0]})\n` +
      `📈 *CGPA Score:* ${readiness.breakdown.cgpa.value} (${readiness.breakdown.cgpa.score}/30 pts)\n` +
      `📋 *Attendance:* ${readiness.breakdown.attendance.value} (${readiness.breakdown.attendance.score} pts)\n` +
      `💻 *Skills & Certs:* ${readiness.breakdown.skills.score} pts / ${readiness.breakdown.certs.score} pts\n` +
      (isTech ? `🐙 *GitHub Repositories:* ${gitHubRepos.length} analyzed (${readiness.startupRepos.length} startup-flagged)\n\n` : `\n`) +
      `🚀 Generated via UniCampus AI Autonomous Career & Placement Hub`;

    const url = `whatsapp://send?text=${encodeURIComponent(shareMsg)}`;
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Share.share({ message: shareMsg });
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPlacementPDF(true);
      const studentName = user?.name || user?.full_name || 'Student';
      const rollNo = user?.rollno || user?.username || 'N/A';
      const course = user?.course || 'Undergraduate';
      const branch = user?.branch || 'General';
      const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      const startupHtml = readiness.startupRepos && readiness.startupRepos.length > 0
        ? readiness.startupRepos.map(r => `
          <div style="margin-bottom: 8px; padding: 10px; border-radius: 8px; background: #FFF7ED; border: 1px solid #FED7AA;">
            <div style="font-weight: 800; font-size: 13px; color: #C2410C;">📦 ${r.name} ${r.language ? `<span style="font-size: 10px; background: #DBEAFE; color: #1E40AF; padding: 2px 6px; border-radius: 4px;">${r.language}</span>` : ''}</div>
            <div style="font-size: 11px; color: #4B5563; margin-top: 4px;">${r.description || 'Scalable application architecture'}</div>
          </div>
        `).join('')
        : '<div style="color: #6B7280; font-size: 12px;">No startup-eligible repositories detected yet.</div>';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #1F2937; background: #FFFFFF; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #5B4BFF; padding-bottom: 16px; margin-bottom: 24px; }
            .logo { font-size: 22px; font-weight: 900; color: #5B4BFF; }
            .hero { background: linear-gradient(135deg, #5B4BFF, #372CBF); color: #FFFFFF; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
            .hero h1 { margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; }
            .hero .score { font-size: 46px; font-weight: 900; margin: 8px 0; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 12px; border-left: 4px solid #5B4BFF; padding-left: 8px; text-transform: uppercase; }
            .grid { display: flex; gap: 12px; margin-bottom: 16px; }
            .card { flex: 1; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 12px; }
            .footer { text-align: center; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 32px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">UniCampus • Placement Readiness Index</div>
              <div style="font-size: 14px; font-weight: 800; color: #111827; margin-top: 4px;">${studentName} (${rollNo})</div>
              <div style="font-size: 12px; color: #6B7280;">${course} • ${branch}</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #6B7280;">
              <div>Report Date: ${dateStr}</div>
              <div>Certified Placement Diagnostic</div>
            </div>
          </div>

          <div class="hero">
            <h1>AI COMPOSITE READINESS RATING</h1>
            <div class="score">${readiness.score} / 100</div>
            <div style="font-size: 14px; font-weight: 700;">${readiness.label}</div>
          </div>

          <div class="section">
            <div class="section-title">5-Pillar Score Breakdown</div>
            <div class="grid">
              <div class="card">
                <div style="font-size: 11px; color: #6B7280; font-weight: 700;">ACADEMIC CGPA</div>
                <div style="font-size: 18px; font-weight: 900; color: #111827; margin-top: 4px;">${readiness.breakdown.cgpa.value}</div>
                <div style="font-size: 11px; color: #10B981; font-weight: 700;">${readiness.breakdown.cgpa.score} / 30 pts</div>
              </div>
              <div class="card">
                <div style="font-size: 11px; color: #6B7280; font-weight: 700;">ATTENDANCE</div>
                <div style="font-size: 18px; font-weight: 900; color: #111827; margin-top: 4px;">${readiness.breakdown.attendance.value}</div>
                <div style="font-size: 11px; color: #10B981; font-weight: 700;">${readiness.breakdown.attendance.score} pts</div>
              </div>
              <div class="card">
                <div style="font-size: 11px; color: #6B7280; font-weight: 700;">INDUSTRY SKILLS</div>
                <div style="font-size: 18px; font-weight: 900; color: #111827; margin-top: 4px;">${readiness.breakdown.skills.score} pts</div>
                <div style="font-size: 11px; color: #6B7280;">Verified Stack</div>
              </div>
              <div class="card">
                <div style="font-size: 11px; color: #6B7280; font-weight: 700;">CERTIFICATIONS</div>
                <div style="font-size: 18px; font-weight: 900; color: #111827; margin-top: 4px;">${readiness.breakdown.certs.score} pts</div>
                <div style="font-size: 11px; color: #6B7280;">Completed</div>
              </div>
            </div>
          </div>

          ${isTech ? `
          <div class="section">
            <div class="section-title">Flagged Startup-Eligible Codebases (${readiness.startupRepos.length})</div>
            ${startupHtml}
          </div>
          ` : ''}

          <div class="footer">
            Generated by UniCampus Placement Intelligence System • Autonomous Career Diagnostic
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      setIsExportingPlacementPDF(false);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Download Placement Readiness Report PDF' });
      } else {
        await Print.printAsync({ html });
      }
    } catch (error) {
      setIsExportingPlacementPDF(false);
      Alert.alert('PDF Export Error', error.message || 'Unable to generate placement report PDF.');
    } finally {
      setIsExportingPlacementPDF(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* ── Top Header ── */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Placement & Careers</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {user?.course || 'B.Tech'} • {user?.branch || 'Computer Science'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: isDark ? 'rgba(37, 211, 102, 0.15)' : '#DCFCE7' }]}
            onPress={handleShareWhatsApp}
          >
            <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' }]}
            onPress={handleExportPDF}
            disabled={isExportingPlacementPDF}
          >
            {isExportingPlacementPDF ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <MaterialCommunityIcons name="file-pdf-box" size={20} color="#EF4444" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}
            onPress={onRefresh}
          >
            <Feather name="refresh-cw" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tab Navigation ── */}
      <View style={[styles.tabBarWrapper, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
          {dynamicTabs.map((t) => {
            const isSel = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.tabItem,
                  isSel && { backgroundColor: isDark ? 'rgba(91, 75, 255, 0.2)' : '#EEF2FF', borderColor: colors.primary }
                ]}
                onPress={() => setActiveTab(t.key)}
              >
                <MaterialCommunityIcons
                  name={t.icon}
                  size={16}
                  color={isSel ? colors.primary : colors.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabItemText, { color: isSel ? colors.primary : colors.textSecondary, fontWeight: isSel ? '800' : '600' }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Scroll View ── */}
      <ScrollView
        contentContainerStyle={[styles.contentScroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ========================================================================= */}
        {/* TAB 1: READINESS & SWOT                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'readiness' && (
          <View>
            {/* Hero Score Banner */}
            <LinearGradient
              colors={isDark ? ['#1F1B4C', '#13112E'] : ['#5B4BFF', '#372CBF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroTopRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.heroBadge}>
                    <MaterialCommunityIcons name="star-shooting" size={14} color="#FCD34D" />
                    <Text style={styles.heroBadgeText}>AI CAREER PROJECTION</Text>
                  </View>
                  <Text style={styles.heroScoreTitle}>{readiness.label}</Text>
                  <Text style={styles.heroScoreSubtitle}>
                    Estimated in top <Text style={{ fontWeight: '800', color: '#FCD34D' }}>12%</Text> of graduating batch
                  </Text>
                </View>

                {/* Score Gauge Circle */}
                <View style={styles.gaugeContainer}>
                  <Text style={styles.gaugeScore}>{readiness.score}</Text>
                  <Text style={styles.gaugeUnit}>/ 100</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.heroProgressBg}>
                <View
                  style={[
                    styles.heroProgressFill,
                    {
                      width: `${readiness.score}%`,
                      backgroundColor: readiness.score >= 80 ? '#10B981' : readiness.score >= 60 ? '#F59E0B' : '#EF4444',
                    }
                  ]}
                />
              </View>

              {/* Quick Summary Row */}
              <View style={styles.heroSummaryRow}>
                <View style={styles.heroSummaryItem}>
                  <Text style={styles.heroSummaryVal}>{readiness.breakdown.cgpa.value}</Text>
                  <Text style={styles.heroSummaryLabel}>CGPA</Text>
                </View>
                <View style={styles.heroSummaryDivider} />
                <View style={styles.heroSummaryItem}>
                  <Text style={styles.heroSummaryVal}>{readiness.breakdown.attendance.value}</Text>
                  <Text style={styles.heroSummaryLabel}>ATTENDANCE</Text>
                </View>
                <View style={styles.heroSummaryDivider} />
                <View style={styles.heroSummaryItem}>
                  <Text style={styles.heroSummaryVal}>
                    {isTech ? `${gitHubRepos.length} Repos` : `${(Array.isArray(user?.certsDone || user?.certificates_done) ? (user.certsDone || user.certificates_done).length : 0)} Verified`}
                  </Text>
                  <Text style={styles.heroSummaryLabel}>{isTech ? 'PORTFOLIO' : 'CERTS'}</Text>
                </View>
                <View style={styles.heroSummaryDivider} />
                <View style={styles.heroSummaryItem}>
                  <Text style={styles.heroSummaryVal}>
                    {isTech ? `${readiness.startupRepos.length}` : `${(Array.isArray(user?.internships) ? user.internships.length : 0)} Active`}
                  </Text>
                  <Text style={styles.heroSummaryLabel}>{isTech ? 'VENTURES' : 'INTERNSHIPS'}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* 5-Metric Breakdown Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Score Breakdown & Weights</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Weighted multi-signal analysis of your academic and technical profile:
              </Text>

              <View style={{ gap: 12, marginTop: 12 }}>
                {/* CGPA */}
                <View>
                  <View style={styles.metricRow}>
                    <Text style={[styles.metricName, { color: colors.textPrimary }]}>🎓 Academic CGPA (30%)</Text>
                    <Text style={[styles.metricVal, { color: colors.primary }]}>
                      {readiness.breakdown.cgpa?.score ?? 26} / 30 pts
                    </Text>
                  </View>
                  <View style={[styles.metricBarBg, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                    <View style={[styles.metricBarFill, { width: `${(((readiness.breakdown.cgpa?.score ?? 26)) / 30) * 100}%`, backgroundColor: '#3B82F6' }]} />
                  </View>
                </View>

                {/* Attendance */}
                <View>
                  <View style={styles.metricRow}>
                    <Text style={[styles.metricName, { color: colors.textPrimary }]}>
                      📋 Regularity & Attendance ({isTech ? '15%' : '20%'})
                    </Text>
                    <Text style={[styles.metricVal, { color: colors.primary }]}>
                      {readiness.breakdown.attendance?.score ?? (isTech ? 15 : 20)} / {isTech ? 15 : 20} pts
                    </Text>
                  </View>
                  <View style={[styles.metricBarBg, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                    <View style={[styles.metricBarFill, { width: `${(((readiness.breakdown.attendance?.score ?? (isTech ? 15 : 20))) / (isTech ? 15 : 20)) * 100}%`, backgroundColor: '#10B981' }]} />
                  </View>
                </View>

                {/* Skills */}
                <View>
                  <View style={styles.metricRow}>
                    <Text style={[styles.metricName, { color: colors.textPrimary }]}>
                      {isTech ? '💻 CS Industry Skills (20%)' : '📊 Domain Competency Mastery (25%)'}
                    </Text>
                    <Text style={[styles.metricVal, { color: colors.primary }]}>
                      {readiness.breakdown.skills?.score ?? (isTech ? 18 : 23)} / {isTech ? 20 : 25} pts
                    </Text>
                  </View>
                  <View style={[styles.metricBarBg, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                    <View style={[styles.metricBarFill, { width: `${(((readiness.breakdown.skills?.score ?? (isTech ? 18 : 23))) / (isTech ? 20 : 25)) * 100}%`, backgroundColor: '#8B5CF6' }]} />
                  </View>
                </View>

                {/* Certifications */}
                <View>
                  <View style={styles.metricRow}>
                    <Text style={[styles.metricName, { color: colors.textPrimary }]}>
                      📜 Industry Certifications ({isTech ? '10%' : '15%'})
                    </Text>
                    <Text style={[styles.metricVal, { color: colors.primary }]}>
                      {readiness.breakdown.certs?.score ?? (isTech ? 10 : 15)} / {isTech ? 10 : 15} pts
                    </Text>
                  </View>
                  <View style={[styles.metricBarBg, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                    <View style={[styles.metricBarFill, { width: `${(((readiness.breakdown.certs?.score ?? (isTech ? 10 : 15))) / (isTech ? 10 : 15)) * 100}%`, backgroundColor: '#F59E0B' }]} />
                  </View>
                </View>

                {/* 5th Pillar: GitHub (Tech) or Internships/Experience (Non-Tech) */}
                <View>
                  <View style={styles.metricRow}>
                    <Text style={[styles.metricName, { color: colors.textPrimary }]}>
                      {isTech ? '🐙 GitHub Code Activity (25%)' : '💼 Corporate Internships & Case Studies (10%)'}
                    </Text>
                    <Text style={[styles.metricVal, { color: colors.primary }]}>
                      {isTech ? (readiness.breakdown.github?.score ?? 20) : (readiness.breakdown.experience?.score ?? 10)} / {isTech ? 25 : 10} pts
                    </Text>
                  </View>
                  <View style={[styles.metricBarBg, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                    <View style={[styles.metricBarFill, { width: `${(((isTech ? (readiness.breakdown.github?.score ?? 20) : (readiness.breakdown.experience?.score ?? 10))) / (isTech ? 25 : 10)) * 100}%`, backgroundColor: '#EC4899' }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* ── GITHUB INTEGRATION (TECH) OR DOMAIN SKILLS HIGHLIGHT (NON-TECH) ── */}
            {isTech ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(91, 75, 255, 0.3)' : '#C7D2FE', borderWidth: 1.5 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <LinearGradient
                      colors={isDark ? ['#312E81', '#1E1B4B'] : ['#24292F', '#0F172A']}
                      style={{ width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <MaterialCommunityIcons name="github" size={24} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                        {gitHubUser ? `@${gitHubUser.login}` : 'Connect GitHub Account'}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                        {gitHubRepos.length > 0
                          ? `${gitHubRepos.length} repos analyzed • ${readiness.startupRepos.length} startup-flagged`
                          : 'Index public repositories & rank code quality'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {Boolean(gitHubUser || gitHubRepos.length > 0 || githubUsername || user?.github_username) && (
                      <TouchableOpacity
                        style={[styles.smallBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2', borderWidth: 1, borderColor: '#EF4444', paddingHorizontal: 10 }]}
                        onPress={handleDisconnectGithub}
                      >
                        <Text style={[styles.smallBtnText, { color: '#EF4444' }]}>Disconnect</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: colors.primary, paddingHorizontal: 10 }]}
                      onPress={() => {
                        setGhInput(githubUsername || user?.github_username || '');
                        setShowGhModal(true);
                      }}
                    >
                      <Text style={styles.smallBtnText}>{gitHubRepos.length > 0 ? 'Edit / Switch' : 'Connect'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(91, 75, 255, 0.3)' : '#C7D2FE', borderWidth: 1.5 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <LinearGradient
                    colors={['#5B4BFF', '#7867FF']}
                    style={{ width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                  >
                    <MaterialCommunityIcons name="domain" size={22} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                      {track === 'commerce_management' ? 'Corporate Skill Competency Matrix' : 'Professional Competency Matrix'}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                      Industry benchmark proficiencies mapped against your student profile:
                    </Text>
                  </View>
                </View>

                {/* Explanatory Benchmark Banner */}
                <View style={{
                  backgroundColor: isDark ? 'rgba(91, 75, 255, 0.12)' : '#F0F4FF',
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: '#5B4BFF',
                }}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
                    💡 <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Curated Benchmark:</Text> {track === 'commerce_management'
                      ? 'Derived from standard Big 4 (Deloitte, EY, PwC, KPMG) and Banking/FMCG job descriptions for Commerce & Finance graduates.'
                      : track === 'pharma_healthcare'
                      ? 'Derived from top MNC Pharma (Dr. Reddy\'s, Sun Pharma, Cipla, Novartis) formulation and QA/QC job descriptions.'
                      : 'Derived from corporate campus recruitment aptitude and competency benchmarks.'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                  {(DOMAIN_SKILLS[track] || DOMAIN_SKILLS.commerce_management).map((skill, sIdx) => {
                    const isAcquired = (readiness.matchedSkills || []).some(
                      ms => ms.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(ms.toLowerCase())
                    );
                    return (
                      <View
                        key={sIdx}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: isAcquired ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5') : (isDark ? '#1E293B' : '#F1F5F9'),
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isAcquired ? '#10B981' : colors.border,
                        }}
                      >
                        <MaterialCommunityIcons
                          name={isAcquired ? 'check-circle' : 'target'}
                          size={14}
                          color={isAcquired ? '#10B981' : '#9CA3AF'}
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: isAcquired ? '800' : '600',
                            color: isAcquired ? (isDark ? '#34D399' : '#065F46') : colors.textPrimary,
                          }}
                        >
                          {skill}
                        </Text>
                        <View
                          style={{
                            backgroundColor: isAcquired ? '#10B98120' : (isDark ? '#374151' : '#E2E8F0'),
                            paddingHorizontal: 5,
                            paddingVertical: 1,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 9,
                              fontWeight: '800',
                              color: isAcquired ? '#10B981' : colors.textMuted,
                            }}
                          >
                            {isAcquired ? 'ACQUIRED' : 'TARGET'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {isTech && (
              <View style={{ gap: 14 }}>
                {/* Startup-Eligible Repos Spotlight */}
                {readiness.startupRepos && readiness.startupRepos.length > 0 && (
                  <View style={{
                    backgroundColor: isDark ? 'rgba(234, 88, 12, 0.1)' : '#FFF7ED',
                    borderRadius: 14,
                    padding: 12,
                    borderWidth: 1.5,
                    borderColor: '#F97316',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <MaterialCommunityIcons name="fire" size={20} color="#EA580C" />
                      <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#EA580C', textTransform: 'uppercase', flex: 1 }} numberOfLines={1}>
                        Startup-Eligible Repositories ({readiness.startupRepos.length})
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 10 }}>
                      AI detected scalable product & SaaS architectures with commercial potential:
                    </Text>

                    <ScrollView
                      style={{ height: readiness.startupRepos.length > 5 ? 350 : undefined }}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      scrollEventThrottle={16}
                      contentContainerStyle={{ gap: 8, paddingRight: 2, paddingBottom: 4 }}
                    >
                      {readiness.startupRepos.map((repo, sIdx) => (
                        <View
                          key={sIdx}
                          style={{
                            backgroundColor: isDark ? colors.card : '#FFFFFF',
                            borderRadius: 10,
                            padding: 10,
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#FED7AA',
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                              <View style={{ backgroundColor: '#EA580C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 9, fontWeight: '900', color: '#FFFFFF' }}>STARTUP ASSET</Text>
                              </View>
                              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                                {repo.name}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              {Boolean(repo.language) && (
                                <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#1E40AF' }}>{repo.language}</Text>
                                </View>
                              )}
                              {(repo.stargazers_count || 0) > 0 ? (
                                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
                                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#D97706' }}>★ {repo.stargazers_count}</Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                          {repo.description ? (
                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, lineHeight: 15 }} numberOfLines={2}>
                              {repo.description}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                    </ScrollView>

                    {readiness.startupRepos.length > 5 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#FED7AA' }}>
                        <MaterialCommunityIcons name="gesture-swipe-vertical" size={13} color="#EA580C" />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#EA580C' }}>
                          Scroll to explore all {readiness.startupRepos.length} repositories ↓
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Ranked Repositories List */}
                {gitHubRepos && gitHubRepos.length > 0 && (
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 0 }]}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8 }}>
                      Ranked Repositories by Code Quality ({gitHubRepos.length} Total)
                    </Text>
                    <ScrollView
                      style={{ height: readiness.topRepos.length > 5 ? 280 : undefined }}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      scrollEventThrottle={16}
                      contentContainerStyle={{ gap: 6, paddingRight: 2, paddingBottom: 4 }}
                    >
                      {readiness.topRepos.map((repo, rIdx) => (
                        <View
                          key={rIdx}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                            padding: 10,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                            <View style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: rIdx === 0 ? '#F59E0B' : rIdx === 1 ? '#94A3B8' : '#B45309',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                              <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFF' }}>#{rIdx + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary }} numberOfLines={1}>
                                {repo.name}
                              </Text>
                              <Text style={{ fontSize: 10, color: colors.textMuted }} numberOfLines={1}>
                                {repo.language || 'Code'} • Updated {new Date(repo.updated_at).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>

                          {Boolean(repo.isStartupPotential) && (
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

                    {readiness.topRepos.length > 5 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <MaterialCommunityIcons name="gesture-swipe-vertical" size={13} color={colors.textMuted} />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>
                          Scroll to explore all {readiness.topRepos.length} repositories ↓
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* ── WEEKLY LLM DEEP CODE & STARTUP ARCHITECTURE AUDIT ── */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : '#DDD6FE', borderWidth: 1.5, marginBottom: 0 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <LinearGradient
                        colors={['#8B5CF6', '#6D28D9']}
                        style={{ width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                      >
                        <MaterialCommunityIcons name="creation" size={22} color="#FFFFFF" />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                          Deep AI Code & Startup Audit
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                          LLM code inspection, architecture rating & interview talking points
                        </Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#C4B5FD' : '#6D28D9' }}>ONCE A WEEK ⏱️</Text>
                    </View>
                  </View>

                  {!llmAudit ? (
                    <View style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.08)' : '#F5F3FF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' }}>
                      <Text style={{ fontSize: 12, color: colors.textPrimary, lineHeight: 17, marginBottom: 10, fontWeight: '600' }}>
                        Run a comprehensive LLM evaluation of your GitHub repositories, code modularity, design patterns, and commercial venture readiness.
                      </Text>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#7C3AED',
                          borderRadius: 12,
                          paddingVertical: 13,
                          paddingHorizontal: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                          gap: 8,
                          opacity: loadingLlmAudit ? 0.7 : 1,
                        }}
                        disabled={loadingLlmAudit}
                        onPress={() => handleRunLLMAudit()}
                      >
                        {loadingLlmAudit ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="magic-staff" size={18} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' }}>
                              RUN AI DEEP CODE AUDIT
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      {/* AI Scorecard Header */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : '#F5F3FF',
                        borderRadius: 12,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#DDD6FE',
                        marginBottom: 12,
                      }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: '#7C3AED', textTransform: 'uppercase' }}>
                            AI Architecture Rating
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginTop: 2 }}>
                            {llmAudit.startupFeasibility?.grade || 'Tier-1 Prototype Ready'}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 24, fontWeight: '900', color: '#7C3AED' }}>
                            {llmAudit.aiArchitectureScore || 92}<Text style={{ fontSize: 12, color: colors.textMuted }}>/100</Text>
                          </Text>
                        </View>
                      </View>

                      {/* Summary */}
                      {Boolean(llmAudit.summary) && (
                        <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: 12 }}>
                          {llmAudit.summary}
                        </Text>
                      )}

                      {/* 4-Metric Engineering Scorecard */}
                      {Boolean(llmAudit.engineeringScorecard) && (
                        <View style={{ marginBottom: 12 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                            Engineering Quality Metrics
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            <View style={{ flex: 1, minWidth: '45%', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                              <Text style={{ fontSize: 10, color: colors.textMuted }}>Modularity</Text>
                              <Text style={{ fontSize: 14, fontWeight: '800', color: '#10B981', marginTop: 2 }}>{llmAudit.engineeringScorecard.modularity || 92}%</Text>
                            </View>
                            <View style={{ flex: 1, minWidth: '45%', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                              <Text style={{ fontSize: 10, color: colors.textMuted }}>Clean Architecture</Text>
                              <Text style={{ fontSize: 14, fontWeight: '800', color: '#3B82F6', marginTop: 2 }}>{llmAudit.engineeringScorecard.cleanArchitecture || 89}%</Text>
                            </View>
                            <View style={{ flex: 1, minWidth: '45%', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                              <Text style={{ fontSize: 10, color: colors.textMuted }}>API Design</Text>
                              <Text style={{ fontSize: 14, fontWeight: '800', color: '#8B5CF6', marginTop: 2 }}>{llmAudit.engineeringScorecard.apiDesign || 94}%</Text>
                            </View>
                            <View style={{ flex: 1, minWidth: '45%', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                              <Text style={{ fontSize: 10, color: colors.textMuted }}>Scalability</Text>
                              <Text style={{ fontSize: 14, fontWeight: '800', color: '#F59E0B', marginTop: 2 }}>{llmAudit.engineeringScorecard.scalability || 88}%</Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Startup Feasibility & Commercial Angle */}
                      {Boolean(llmAudit.startupFeasibility?.commercialAngle) && (
                        <View style={{
                          backgroundColor: isDark ? 'rgba(234, 88, 12, 0.08)' : '#FFF7ED',
                          padding: 10,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(234, 88, 12, 0.2)' : '#FED7AA',
                          marginBottom: 12,
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <MaterialCommunityIcons name="rocket-launch" size={16} color="#EA580C" />
                            <Text style={{ fontSize: 11, fontWeight: '900', color: '#EA580C', textTransform: 'uppercase' }}>
                              Startup Market Angle & Monetization
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: colors.textPrimary, lineHeight: 16 }}>
                            {llmAudit.startupFeasibility.commercialAngle}
                          </Text>
                          {Boolean(llmAudit.startupFeasibility.monetization) && (
                            <Text style={{ fontSize: 10, color: '#C2410C', marginTop: 4, fontWeight: '700' }}>
                              Strategy: {llmAudit.startupFeasibility.monetization}
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Interview Talking Points */}
                      {Array.isArray(llmAudit.interviewTalkingPoints) && llmAudit.interviewTalkingPoints.length > 0 && (
                        <View style={{
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#EFF6FF',
                          padding: 10,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
                          marginBottom: 12,
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: '#2563EB', textTransform: 'uppercase', marginBottom: 4 }}>
                            🎙️ Placement Interview Talking Points:
                          </Text>
                          {llmAudit.interviewTalkingPoints.map((pt, pIdx) => (
                            <View key={pIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: pIdx === 0 ? 0 : 4 }}>
                              <Text style={{ fontSize: 11, color: '#2563EB' }}>•</Text>
                              <Text style={{ fontSize: 11, color: colors.textPrimary, flex: 1, fontWeight: '600', lineHeight: 15 }}>
                                {pt}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Cooldown Footer */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <MaterialCommunityIcons name="clock-check-outline" size={14} color={colors.textMuted} />
                          <Text style={{ fontSize: 10, color: colors.textMuted }}>
                            Next free scan in {llmAudit.daysRemaining || 7} days
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRunLLMAudit(true)}
                          disabled={loadingLlmAudit}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                            {loadingLlmAudit ? 'Re-scanning...' : 'Force Re-Scan ↻'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* SWOT Matrix Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name="shield-search" size={22} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                    SWOT Diagnostic Matrix
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View style={[styles.countBadge, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={[styles.countBadgeText, { color: '#065F46' }]}>{readiness.strengths.length} Strengths</Text>
                  </View>
                  <View style={[styles.countBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.countBadgeText, { color: '#92400E' }]}>{readiness.weaknesses.length} Gaps</Text>
                  </View>
                </View>
              </View>

              {/* Strengths */}
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <MaterialCommunityIcons name="check-decagram" size={18} color="#10B981" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#10B981', textTransform: 'uppercase' }}>
                    Key Strengths & Competitive Edge
                  </Text>
                </View>
                <View style={{ gap: 8 }}>
                  {readiness.strengths.map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.swotItem,
                        {
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
                          borderLeftColor: '#10B981',
                          borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7',
                        }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.swotItemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                        <View style={[styles.tagPill, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
                          <Text style={[styles.tagPillText, { color: '#065F46' }]}>{item.tag}</Text>
                        </View>
                      </View>
                      <Text style={[styles.swotItemDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Weaknesses / Gaps */}
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <MaterialCommunityIcons name="alert-decagram-outline" size={18} color="#F59E0B" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#D97706', textTransform: 'uppercase' }}>
                    Gaps & Actionable Weaknesses
                  </Text>
                </View>
                <View style={{ gap: 8 }}>
                  {readiness.weaknesses.map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.swotItem,
                        {
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB',
                          borderLeftColor: '#F59E0B',
                          borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
                        }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.swotItemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                        <View style={[styles.tagPill, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                          <Text style={[styles.tagPillText, { color: '#92400E' }]}>{item.tag}</Text>
                        </View>
                      </View>
                      <Text style={[styles.swotItemDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                      {Boolean(item.action) && (
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 6 }}>
                          <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color="#D97706" style={{ marginTop: 1 }} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706', flex: 1 }}>
                            Recommended Action: {item.action}
                          </Text>
                        </View>
                      )}
                      {(Boolean(item.actionUrl) || Boolean(item.actionNav) || Boolean(item.secondaryUrl)) && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginLeft: 20 }}>
                          {Boolean(item.actionUrl) && (
                            <TouchableOpacity
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7',
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(217, 119, 6, 0.4)' : '#FDE68A',
                              }}
                              onPress={() => Linking.openURL(item.actionUrl).catch(() => {})}
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons name="open-in-new" size={13} color="#D97706" />
                              <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706' }}>
                                {item.actionUrlLabel || 'Practice Now ↗'}
                              </Text>
                            </TouchableOpacity>
                          )}
                          {Boolean(item.secondaryUrl) && (
                            <TouchableOpacity
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB',
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#FDE68A',
                              }}
                              onPress={() => Linking.openURL(item.secondaryUrl).catch(() => {})}
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons name="database-search" size={13} color="#D97706" />
                              <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706' }}>
                                {item.secondaryUrlLabel || 'Practice SQL ↗'}
                              </Text>
                            </TouchableOpacity>
                          )}
                          {Boolean(item.actionNav) && (
                            <TouchableOpacity
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: isDark ? 'rgba(91, 75, 255, 0.2)' : '#EEF2FF',
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(91, 75, 255, 0.4)' : '#C7D2FE',
                              }}
                              onPress={() => navigation.navigate(item.actionNav)}
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons name="arrow-right-circle" size={13} color={colors.primary} />
                              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                                {item.actionUrlLabel || 'Open Diagnostic ↗'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Resume Builder CTA */}
            <TouchableOpacity
              style={styles.ctaBanner}
              onPress={() => navigation.navigate('ResumeBuilder')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#EA580C', '#C2410C']}
                style={styles.ctaBannerGradient}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.ctaBannerTitle}>Generate AI Tailored Resume</Text>
                  <Text style={styles.ctaBannerSub}>
                    Auto-injects your {user?.cgpa ? `${user.cgpa} CGPA` : 'verified academic grades'}, top {user?.course || 'degree'} skills, and verified GitHub code repositories.
                  </Text>
                </View>
                <View style={styles.ctaBannerBtn}>
                  <Text style={styles.ctaBannerBtnText}>BUILD NOW</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LIVE CAMPUS DRIVES                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'drives' && (
          <View>
            {/* Quick Drives Stats */}
            <View style={styles.drivesStatsRow}>
              <View style={[styles.driveStatBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.driveStatVal, { color: colors.primary }]}>{drives.length}</Text>
                <Text style={[styles.driveStatLabel, { color: colors.textSecondary }]}>Active Drives</Text>
              </View>
              <View style={[styles.driveStatBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.driveStatVal, { color: '#10B981' }]}>{registrations.length}</Text>
                <Text style={[styles.driveStatLabel, { color: colors.textSecondary }]}>My Registrations</Text>
              </View>
              <View style={[styles.driveStatBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.driveStatVal, { color: '#F59E0B' }]}>{offers.length}</Text>
                <Text style={[styles.driveStatLabel, { color: colors.textSecondary }]}>Offers Received</Text>
              </View>
            </View>

            {loadingDrives ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading campus drives from ERP...</Text>
              </View>
            ) : drives.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="briefcase-off-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Open Drives Currently</Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  New placement drives for B.Tech CS 2025/2026 batches will be announced here.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {drives.map((drive) => {
                  const isRegistered = !!registrationMap[drive.id];
                  const minCgpa = parseFloat(drive.min_cgpa) || 0;
                  const studentCgpa = parseFloat(user?.cgpa) || 0;
                  const isEligible = studentCgpa >= minCgpa;

                  return (
                    <View key={drive.id} style={[styles.driveCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.driveHeaderRow}>
                        <LinearGradient
                          colors={isDark ? ['#1E1B4B', '#312E81'] : ['#EEF2FF', '#E0E7FF']}
                          style={styles.driveIconBox}
                        >
                          <MaterialIcons name="business" size={22} color={colors.primary} />
                        </LinearGradient>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.companyName, { color: colors.textPrimary }]}>{drive.company_name}</Text>
                          <Text style={[styles.jobRole, { color: colors.textSecondary }]}>{drive.job_role}</Text>
                        </View>
                        {Boolean(drive.package_lpa) && (
                          <View style={styles.ctcBadge}>
                            <Text style={styles.ctcText}>{drive.package_lpa} LPA</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.driveMetaRow}>
                        <View style={styles.driveMetaItem}>
                          <MaterialIcons name="event" size={14} color={colors.textMuted} />
                          <Text style={[styles.driveMetaText, { color: colors.textSecondary }]}>
                            {drive.drive_date ? new Date(drive.drive_date).toLocaleDateString() : 'TBA'}
                          </Text>
                        </View>
                        <View style={styles.driveMetaItem}>
                          <MaterialIcons name="school" size={14} color={colors.textMuted} />
                          <Text style={[styles.driveMetaText, { color: isEligible ? '#10B981' : '#EF4444', fontWeight: '700' }]}>
                            Min {minCgpa > 0 ? minCgpa.toFixed(1) : 'No'} CGPA ({isEligible ? 'Eligible' : 'Not Eligible'})
                          </Text>
                        </View>
                      </View>

                      {drive.description ? (
                        <Text style={[styles.driveDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                          {drive.description}
                        </Text>
                      ) : null}

                      <TouchableOpacity
                        style={[
                          styles.driveRegisterBtn,
                          {
                            backgroundColor: isRegistered ? '#10B981' : isEligible ? colors.primary : '#6B7280',
                            opacity: registeringId === drive.id ? 0.7 : 1,
                          }
                        ]}
                        disabled={isRegistered || !isEligible || registeringId === drive.id}
                        onPress={() => handleRegisterDrive(drive.id)}
                      >
                        {registeringId === drive.id ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text style={styles.driveRegisterText}>
                            {isRegistered ? '✓ REGISTERED' : isEligible ? 'REGISTER FOR DRIVE' : 'CGPA INELIGIBLE'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: GITHUB INTELLIGENCE                                                */}
        {/* ========================================================================= */}
        {activeTab === 'github' && (
          isTech ? (
            <View>
            {/* GitHub Header & Connect Box */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MaterialCommunityIcons name="github" size={32} color={isDark ? '#FFFFFF' : '#24292F'} />
                  <View>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                      {gitHubUser ? `@${gitHubUser.login}` : 'GitHub Code Intelligence'}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      {gitHubRepos.length > 0 ? `${gitHubRepos.length} public repos analyzed` : 'Connect your developer portfolio'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {gitHubRepos.length > 0 && (
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' }]}
                      onPress={handleDisconnectGithub}
                    >
                      <Text style={[styles.smallBtnText, { color: '#EF4444' }]}>Disconnect</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setGhInput(githubUsername || user?.github_username || '');
                      setShowGhModal(true);
                    }}
                  >
                    <Text style={styles.smallBtnText}>{gitHubRepos.length > 0 ? 'Switch' : 'Connect'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Languages breakdown */}
              {readiness.languages.length > 0 && (
                <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>
                    Detected Tech Stack & Languages:
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {readiness.languages.map((lang, lIdx) => (
                      <View key={lIdx} style={{ backgroundColor: isDark ? '#1E293B' : '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }}>{lang}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Future Startup Potential Repos */}
            {readiness.startupRepos.length > 0 && (
              <View style={[styles.card, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.08)' : '#FFF7ED', borderColor: '#F97316', borderWidth: 1.5 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <MaterialCommunityIcons name="fire" size={20} color="#EA580C" />
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#EA580C', textTransform: 'uppercase', flex: 1 }} numberOfLines={1}>
                    Startup Potential Repositories ({readiness.startupRepos.length})
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
                  AI analyzed your codebases and flagged these scalable SaaS / product architectures:
                </Text>

                <ScrollView
                  style={{ maxHeight: readiness.startupRepos.length > 5 ? 360 : undefined }}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={readiness.startupRepos.length > 5}
                  contentContainerStyle={{ gap: 10 }}
                >
                  {readiness.startupRepos.map((repo, rIdx) => (
                    <View
                      key={rIdx}
                      style={{
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        borderRadius: 12,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#FED7AA',
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                          📦 {repo.name}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {Boolean(repo.language) && (
                            <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ fontSize: 10, fontWeight: '800', color: '#1E40AF' }}>{repo.language}</Text>
                            </View>
                          )}
                          {Number(repo.stargazers_count) > 0 && (
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#F59E0B' }}>★ {repo.stargazers_count}</Text>
                          )}
                        </View>
                      </View>
                      {repo.description ? (
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 16 }}>
                          {repo.description}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>

                {readiness.startupRepos.length > 5 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#FED7AA' }}>
                    <MaterialCommunityIcons name="gesture-swipe-vertical" size={13} color="#EA580C" />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#EA580C' }}>
                      Scroll to explore all {readiness.startupRepos.length} repositories ↓
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* All Repos List */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>All Repositories ({gitHubRepos.length})</Text>
              {loadingGh ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
              ) : gitHubRepos.length === 0 ? (
                <Text style={{ color: colors.textMuted, marginVertical: 12 }}>No public repositories found for this account.</Text>
              ) : (
                <>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    {(showAllGithubTabRepos ? gitHubRepos : gitHubRepos.slice(0, 5)).map((repo, idx) => (
                      <View
                        key={idx}
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                            {repo.name}
                          </Text>
                          {Number(repo.stargazers_count) > 0 && (
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>★ {repo.stargazers_count}</Text>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                          {repo.language || 'Code'} • Updated {new Date(repo.updated_at).toLocaleDateString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {gitHubRepos.length > 5 && (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        marginTop: 10,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                      onPress={() => setShowAllGithubTabRepos(prev => !prev)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={showAllGithubTabRepos ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                        {showAllGithubTabRepos
                          ? 'Show Top 5 Only'
                          : `Show All ${gitHubRepos.length} Repositories (${gitHubRepos.length - 5} More)`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
          ) : (
            <View>
                {/* Non-Tech Header & Corporate Credentials */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="certificate" size={24} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 2 }]}>
                        {track === 'commerce_management' ? 'Commerce & Finance Credentials' : 'Professional Industry Credentials'}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        Verified academic results, certified modules, and industry internships
                      </Text>
                    </View>
                  </View>

                  {/* Summary Metric Pills */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <View style={{ flex: 1, backgroundColor: isDark ? '#1F2937' : '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: colors.primary }}>
                        {parseFloat(user?.cgpa || 8.5).toFixed(1)}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, marginTop: 2 }}>ACADEMIC CGPA</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: isDark ? '#1F2937' : '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#10B981' }}>
                        {parseFloat(user?.attendance || 92).toFixed(0)}%
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, marginTop: 2 }}>ATTENDANCE</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: isDark ? '#1F2937' : '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#7C3AED' }}>
                        {(Array.isArray(user?.certsDone || user?.certificates_done) ? (user.certsDone || user.certificates_done).length : 0)}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, marginTop: 2 }}>VERIFIED CERTS</Text>
                    </View>
                  </View>
                </View>

                {/* Industry Certifications */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 10 }]}>
                    🏆 Industry Certifications
                  </Text>

                  {Array.isArray(user?.certsDone || user?.certificates_done) && (user.certsDone || user.certificates_done).length > 0 ? (
                    <View style={{ gap: 10 }}>
                      {(user.certsDone || user.certificates_done).map((cert, cIdx) => (
                        <View
                          key={cIdx}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 12,
                            borderRadius: 12,
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <MaterialCommunityIcons name="check-decagram" size={22} color="#10B981" />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>{typeof cert === 'string' ? cert : cert.title}</Text>
                              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>Verified Credential</Text>
                            </View>
                          </View>
                          <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#065F46' }}>✓ VERIFIED</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={{ backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>No verified certifications uploaded yet</Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                        Complete an industry-accredited certification below to boost your placement readiness by +15 pts.
                      </Text>
                    </View>
                  )}

                  {/* Recommended Benchmark Certifications */}
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginTop: 10, marginBottom: 8, textTransform: 'uppercase' }}>
                    Recommended Domain Certifications to Target:
                  </Text>
                  <View style={{ gap: 8 }}>
                    {(DOMAIN_CERTIFICATIONS[track] || DOMAIN_CERTIFICATIONS.commerce_management).map((cert, cIdx) => (
                      <View
                        key={cIdx}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: isDark ? '#111827' : '#FFFFFF',
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary }}>{cert.title}</Text>
                          <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>{cert.issuer} • {cert.level}</Text>
                        </View>
                        <View style={{ backgroundColor: '#E0E7FF', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#4338CA' }}>RECOMMENDED</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Corporate Internships — ERP Live Data */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                      💼 ERP Internships
                    </Text>
                    {loadingDrives && <ActivityIndicator size="small" color={colors.primary} />}
                  </View>

                  {erpInternships.length > 0 ? (
                    <View style={{ gap: 10 }}>
                      {erpInternships.map((intern, eIdx) => {
                        const isApplied = intern.applied || intern.status === 'applied' || !!intern.my_application;
                        const isAccepted = intern.status === 'accepted' || intern.my_application?.status === 'accepted';
                        return (
                          <View
                            key={intern.id || eIdx}
                            style={{
                              padding: 13,
                              borderRadius: 12,
                              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                              borderWidth: 1,
                              borderColor: isAccepted ? '#BBF7D0' : colors.border,
                              gap: 6,
                            }}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary }}>{intern.title || intern.name || 'Internship'}</Text>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: 1 }}>{intern.company || intern.organization || 'Corporate'}</Text>
                                {Boolean(intern.duration || intern.stipend) && (
                                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                                    {intern.duration ? intern.duration + ' ' : ''}{intern.stipend ? '· ₹' + intern.stipend + '/mo' : ''}
                                  </Text>
                                )}
                              </View>
                              {isAccepted ? (
                                <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#065F46' }}>✓ ACCEPTED</Text>
                                </View>
                              ) : isApplied ? (
                                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#92400E' }}>APPLIED</Text>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  onPress={async () => {
                                    setApplyingInternshipId(intern.id);
                                    try {
                                      await applyForErpInternship(accessToken, { internship_id: intern.id });
                                      Alert.alert('Applied!', 'Your application has been submitted.');
                                      loadDrives();
                                    } catch (e) {
                                      Alert.alert('Error', 'Could not apply. Please try again.');
                                    } finally {
                                      setApplyingInternshipId(null);
                                    }
                                  }}
                                  disabled={applyingInternshipId === intern.id}
                                  style={{ backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                                >
                                  {applyingInternshipId === intern.id
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Apply</Text>
                                  }
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={{ backgroundColor: isDark ? '#1F2937' : '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>No ERP internships posted yet</Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                        Check back soon — internship opportunities from the Placement Cell appear here.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Academic Repository — ERP */}
                {erpRepository.length > 0 && (
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 10 }]}>
                      📁 Academic Repository
                    </Text>
                    <View style={{ gap: 10 }}>
                      {erpRepository.slice(0, 5).map((item, idx) => (
                        <View
                          key={item.id || idx}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 10,
                            padding: 12, borderRadius: 12,
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderWidth: 1, borderColor: colors.border,
                          }}
                        >
                          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#312E81' : '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{item.title || item.name || 'Project'}</Text>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{item.subject || item.category || ''} {item.submitted_by ? '· ' + item.submitted_by : ''}</Text>
                          </View>
                          {Boolean(item.rating != null) && (
                            <View style={{ alignItems: 'center' }}>
                              <Text style={{ fontSize: 12, fontWeight: '800', color: '#F59E0B' }}>★ {item.rating}</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )
          )
        }

        {/* ========================================================================= */}
        {/* TAB 4: RECRUITMENT TIERS & PREPARATION ROADMAPS                            */}
        {/* ========================================================================= */}
        {activeTab === 'eligibility' && (
          <View style={{ gap: 14 }}>
            {/* Header Banner */}
            <View style={[
              styles.card,
              {
                backgroundColor: isDark ? 'rgba(91, 75, 255, 0.12)' : '#F5F3FF',
                borderColor: isDark ? 'rgba(91, 75, 255, 0.3)' : '#DDD6FE',
                borderWidth: 1.5,
                marginBottom: 0,
              }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <MaterialIcons name="insights" size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>
                    {track === 'commerce_management'
                      ? 'Corporate & Big 4 Recruitment Roadmaps'
                      : track === 'pharma_healthcare'
                      ? 'Pharmaceutical Recruitment Roadmaps'
                      : 'Campus Recruitment Tiers & Roadmaps'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    Recruitment rounds, minimum cutoffs, and your verified eligibility status:
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginTop: 4 }}>
                Hiring drives are structured into compensation and difficulty tiers. Below is your live eligibility based on your <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{parseFloat(user?.cgpa || 8.5).toFixed(1)} CGPA</Text> and verified credentials.
              </Text>
            </View>

            {/* Dynamic Recruitment Tier Cards */}
            {getPlacementTiers(track).map((tier, tIdx) => {
              const isEligibleCgpa = parseFloat(user?.cgpa || 8.5) >= tier.minCgpa;
              return (
                <View
                  key={tier.id || tIdx}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: isDark ? 'rgba(91, 75, 255, 0.4)' : '#E0E7FF',
                      borderWidth: 1.5,
                      marginBottom: 0,
                    }
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>{tier.title}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary, marginTop: 2 }}>{tier.packageRange}</Text>
                    </View>
                    <View style={{ backgroundColor: tier.badgeColor + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: tier.badgeColor }}>
                        {isEligibleCgpa ? `✓ ${tier.badge}` : '🎯 TARGET'}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 10 }}>
                    Target Companies: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{tier.companies}</Text>
                  </Text>

                  <View style={{ backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', marginBottom: 2 }}>
                      Eligibility & Recruitment Rounds:
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                      <MaterialIcons name="check-circle" size={14} color="#10B981" style={{ marginTop: 2 }} />
                      <Text style={{ fontSize: 11, color: colors.textPrimary, flex: 1 }}>
                        <Text style={{ fontWeight: '700' }}>CGPA Requirement:</Text> {tier.minCgpa}+ cutoff (Your CGPA: <Text style={{ fontWeight: '800', color: isEligibleCgpa ? '#10B981' : '#EF4444' }}>{parseFloat(user?.cgpa || 8.5).toFixed(1)} {isEligibleCgpa ? '✓ Met' : '⚠️ In Progress'}</Text>)
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                      <MaterialIcons name="verified" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                      <Text style={{ fontSize: 11, color: colors.textPrimary, flex: 1 }}>
                        <Text style={{ fontWeight: '700' }}>Portfolio Benchmark:</Text> {tier.portfolioCheck}
                      </Text>
                    </View>

                    {tier.rounds.map((rnd, rIdx) => (
                      <View key={rIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <MaterialCommunityIcons name="numeric-box-outline" size={14} color={colors.textMuted} style={{ marginTop: 2 }} />
                        <Text style={{ fontSize: 11, color: colors.textPrimary, flex: 1 }}>
                          <Text style={{ fontWeight: '700' }}>{rnd.name}:</Text> {rnd.desc}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* GitHub Connect Modal */}
      <Modal
        visible={showGhModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGhModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Connect GitHub Account</Text>
              <TouchableOpacity onPress={() => setShowGhModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 14 }}>
              Enter your public GitHub username. AI will fetch and index all repositories for code analysis.
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="e.g. torvalds, octocat"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              value={ghInput}
              onChangeText={setGhInput}
            />
            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
              onPress={async () => {
                const clean = ghInput.trim().replace(/^@/, '');
                if (!clean) return;
                await updateGithubUsername(clean);
                await loadGitHub(clean, true);
                setShowGhModal(false);
              }}
            >
              <Text style={styles.modalSubmitText}>SAVE & ANALYZE REPOSITORIES</Text>
            </TouchableOpacity>

            {Boolean(gitHubUser || gitHubRepos.length > 0 || githubUsername || user?.github_username) && (
              <TouchableOpacity
                style={{
                  marginTop: 10,
                  height: 44,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#EF4444',
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                }}
                onPress={() => {
                  setShowGhModal(false);
                  handleDisconnectGithub();
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#EF4444' }}>Disconnect Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
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
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
  },
  tabBarScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItemText: {
    fontSize: 13,
  },
  contentScroll: {
    padding: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroScoreTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroScoreSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  gaugeContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeScore: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  gaugeUnit: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
  },
  heroProgressBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroSummaryVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  heroSummaryLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  heroSummaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricName: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  metricBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  swotItem: {
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3.5,
    borderWidth: 1,
  },
  swotItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  swotItemDesc: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  tagPillText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  ctaBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  ctaBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  ctaBannerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
  ctaBannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 3,
  },
  ctaBannerBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ctaBannerBtnText: {
    color: '#C2410C',
    fontSize: 11,
    fontWeight: '900',
  },
  drivesStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  driveStatBox: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  driveStatVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  driveStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  driveCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  driveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driveIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 15,
    fontWeight: '800',
  },
  jobRole: {
    fontSize: 12,
    marginTop: 1,
  },
  ctcBadge: {
    backgroundColor: '#10B98120',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ctcText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  driveMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  driveMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driveMetaText: {
    fontSize: 11,
  },
  driveDesc: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
  },
  driveRegisterBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  driveRegisterText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  tierBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 16,
  },
  modalSubmitBtn: {
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default PlacementReadinessScreen;
