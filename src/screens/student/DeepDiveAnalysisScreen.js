import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Share, Linking, Alert, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { computeSkillGap, generateLearningPath } from '../../data/aiEngine';
import { TimelineSkeleton, SkeletonBlock } from '../../components/SkeletonLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getResults, getCompetencyGaps, fetchGitHubRepos } from '../../data/apiService';

const { width } = Dimensions.get('window');

const DeepDiveAnalysisScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const { user, accessToken } = useUser();
  const isMed = user && (
    user.course?.replace(/\./g, '').toLowerCase().includes('mbbs') ||
    user.course?.toLowerCase().includes('medicine') ||
    user.category?.toLowerCase().includes('medical')
  );

  // Fetch academic results, ERP competency gaps, and GitHub repos
  const [academicResults, setAcademicResults] = useState([]);
  const [erpCompetencies, setErpCompetencies] = useState(null);
  const [gitHubRepos, setGitHubRepos] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const studentKey = user?.id || user?.user_id || user?.rollno || 'default';

        if (isMed) {
          const cachedGaps = await AsyncStorage.getItem(`@erp_competency_gaps_cache_${studentKey}`);
          const cachedResults = await AsyncStorage.getItem(`@erp_academic_results_cache_${studentKey}`);

          let loadedGaps = null;
          let loadedResults = [];

          if (cachedGaps) {
            loadedGaps = JSON.parse(cachedGaps);
            setErpCompetencies(loadedGaps);
          }
          if (cachedResults) {
            loadedResults = JSON.parse(cachedResults);
            setAcademicResults(loadedResults);
          }

          if (!loadedGaps && accessToken) {
            const gapsData = await getCompetencyGaps(accessToken);
            if (gapsData) {
              setErpCompetencies(gapsData);
              await AsyncStorage.setItem(`@erp_competency_gaps_cache_${studentKey}`, JSON.stringify(gapsData));
            }
          }
          if ((!loadedResults || loadedResults.length === 0) && accessToken) {
            const resultsData = await getResults(accessToken);
            if (resultsData && resultsData.length > 0) {
              setAcademicResults(resultsData);
              await AsyncStorage.setItem(`@erp_academic_results_cache_${studentKey}`, JSON.stringify(resultsData));
            }
          }
          setGitHubRepos([]);
        } else {
          // Non-medical student: reset medical ERP state
          setErpCompetencies(null);
          setAcademicResults([]);

          // Fetch GitHub repos ONLY if current student has a linked github handle
          const ghHandle = user?.github_username || user?.github || user?.social_links?.github;
          if (ghHandle) {
            const cachedRepos = await AsyncStorage.getItem(`@github_repos_cache_${ghHandle}`);
            if (cachedRepos) {
              setGitHubRepos(JSON.parse(cachedRepos));
            } else {
              const fetchedRepos = await fetchGitHubRepos(ghHandle);
              if (fetchedRepos && fetchedRepos.length > 0) {
                setGitHubRepos(fetchedRepos);
                await AsyncStorage.setItem(`@github_repos_cache_${ghHandle}`, JSON.stringify(fetchedRepos));
              } else {
                setGitHubRepos([]);
              }
            }
          } else {
            setGitHubRepos([]);
          }
        }
      } catch (e) {
        console.warn('Error loading data in DeepDive:', e);
      }
    }
    loadData();
  }, [accessToken, user, isMed]);

  // Compute gap data reactively
  const gapData = useMemo(() => {
    if (!user) return { matchPct: 0, missingSkills: [], expectedSkills: [], academicExpectedSkills: [], academicMissingSkills: [], academicMatchPct: 0, industryExpectedSkills: [], industryMissingSkills: [], industryMatchPct: 0, skillScores: {}, completedPhases: [] };
    return computeSkillGap(user, academicResults, erpCompetencies, gitHubRepos);
  }, [user, academicResults, erpCompetencies, gitHubRepos]);

  const isTech = Boolean(gapData?.isTechnical);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'missing' | 'verified'
  const [activeSkill, setActiveSkill] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewedSkills, setViewedSkills] = useState({});

  React.useEffect(() => {
    AsyncStorage.getItem('@viewed_syllabus_gaps').then(val => {
      if (val) setViewedSkills(JSON.parse(val));
    });
  }, []);

  const handleExplorePath = async (skillName) => {
    setActiveSkill(skillName);
    setLoading(true);
    setLearningPath(null);
    try {
      const cacheKey = `@deepdive_path_${skillName.replace(/\s+/g, '_')}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setLearningPath(JSON.parse(cached));
      } else {
        const path = await generateLearningPath(user, skillName, accessToken);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(path));
        setLearningPath(path);
      }
      
      const updated = { ...viewedSkills, [skillName]: true };
      setViewedSkills(updated);
      await AsyncStorage.setItem('@viewed_syllabus_gaps', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Compile list of skills
  const allSkills = useMemo(() => {
    if (isTech) {
      return gapData.expectedSkills && gapData.expectedSkills.length > 0
        ? gapData.expectedSkills
        : ['Generative AI & LLMs', 'System Architecture', 'Database Engineering', 'API Design'];
    }
    return [
      ...(gapData.academicExpectedSkills || []),
      ...(gapData.industryExpectedSkills || [])
    ];
  }, [isTech, gapData]);

  const missingSkills = useMemo(() => {
    if (isTech) {
      return gapData.missingSkills || [];
    }
    return [
      ...(gapData.academicMissingSkills || []),
      ...(gapData.industryMissingSkills || [])
    ];
  }, [isTech, gapData]);

  const verifiedSkills = useMemo(() => {
    return allSkills.filter(s => !missingSkills.includes(s));
  }, [allSkills, missingSkills]);

  // Dynamic domain-adaptive titles & terminology
  const screenTitle = isMed
    ? 'Clinical Competency Analysis'
    : isTech
      ? 'Tech Skill Gap Analysis'
      : 'Career Skill Gap Analysis';

  const heroCategoryTitle = isMed
    ? 'CLINICAL READINESS BENCHMARK'
    : isTech
      ? 'INDUSTRY TECH BENCHMARK MATCH'
      : 'PROFESSIONAL CAREER BENCHMARK';

  const sectionSubTitle = isMed
    ? 'Clinical Competencies vs Target Specialization'
    : isTech
      ? 'Modern Must-Have Skills vs Your Stack'
      : 'Industry-Expected Skills vs Your Profile';

  const heroIconName = isMed
    ? 'stethoscope'
    : isTech
      ? 'code-tags'
      : 'briefcase-outline';

  // Curated external practice problem links for skills
  const getCuratedPracticeLink = (skill) => {
    if (isMed) return null;
    const s = (skill || '').toLowerCase();
    if (s.includes('dsa') || s.includes('data structure') || s.includes('algorithm') || s.includes('tree') || s.includes('graph') || s.includes('dynamic programming') || s.includes('leetcode')) {
      return {
        label: 'Practice LeetCode Top 150',
        url: 'https://leetcode.com/studyplan/top-interview-150/',
        icon: 'code-tags',
      };
    }
    if (s.includes('sql') || s.includes('database') || s.includes('dbms') || s.includes('postgres') || s.includes('mysql') || s.includes('query')) {
      return {
        label: 'Practice LeetCode SQL 50',
        url: 'https://leetcode.com/studyplan/top-sql-50/',
        icon: 'database-outline',
      };
    }
    if (s.includes('system design') || s.includes('distributed') || s.includes('architecture') || s.includes('scalab')) {
      return {
        label: 'System Design Primer',
        url: 'https://github.com/donnemartin/system-design-primer',
        icon: 'server-network',
      };
    }
    if (s.includes('javascript') || s.includes('typescript') || s.includes('react') || s.includes('node') || s.includes('web') || s.includes('frontend')) {
      return {
        label: 'LeetCode 30 Days of JS',
        url: 'https://leetcode.com/studyplan/30-days-of-javascript/',
        icon: 'language-javascript',
      };
    }
    if (s.includes('python')) {
      return {
        label: 'LeetCode Python Problemset',
        url: 'https://leetcode.com/problemset/all/?topicSlugs=python',
        icon: 'language-python',
      };
    }
    if (s.includes('cloud') || s.includes('aws') || s.includes('docker') || s.includes('kubernetes')) {
      return {
        label: 'AWS Cloud Practitioner Guide',
        url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/',
        icon: 'cloud-outline',
      };
    }
    if (s.includes('finance') || s.includes('nism') || s.includes('tax') || s.includes('accounting') || s.includes('equity') || s.includes('portfolio') || s.includes('banking')) {
      return {
        label: 'NISM Certifications Guide',
        url: 'https://www.nism.ac.in/certifications/',
        icon: 'finance',
      };
    }
    if (isTech) {
      return {
        label: 'Practice on LeetCode',
        url: 'https://leetcode.com/problemset/all/',
        icon: 'code-tags',
      };
    }
    return null;
  };

  // Filtered skills based on active filter tab
  const displayList = useMemo(() => {
    if (filterTab === 'missing') return allSkills.filter(s => missingSkills.includes(s));
    if (filterTab === 'verified') return verifiedSkills;
    return allSkills;
  }, [filterTab, allSkills, missingSkills, verifiedSkills]);

  // ── Share Skill Gap on WhatsApp ──
  const shareSkillGapWhatsApp = async () => {
    const studentName = user?.name || user?.full_name || 'Student';
    const course = user?.course || 'Undergraduate';
    const text = `🎯 *UniCampus AI • ${screenTitle}*\n` +
      `👤 *Student:* ${studentName} (${user?.rollno || user?.username || ''})\n` +
      `📚 *Course:* ${course}\n` +
      `📊 *Readiness Benchmark Match:* ${gapData.matchPct}%\n` +
      `✅ *Verified Skills (${verifiedSkills.length}):* ${verifiedSkills.slice(0, 6).join(', ')}${verifiedSkills.length > 6 ? '...' : ''}\n` +
      `⚠️ *Identified Growth Gaps (${missingSkills.length}):* ${missingSkills.slice(0, 6).join(', ')}${missingSkills.length > 6 ? '...' : ''}\n\n` +
      `🚀 Generated via UniCampus AI Autonomous Career & Placement Engine`;

    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Share.share({ message: text, title: screenTitle });
    }
  };

  // ── Download Skill Gap as PDF ──
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const exportSkillGapPDF = async () => {
    try {
      setIsExportingPDF(true);
      const studentName = user?.name || user?.full_name || 'Student';
      const rollNo = user?.rollno || user?.username || 'N/A';
      const course = user?.course || 'Undergraduate';
      const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      const verifiedHtml = verifiedSkills.map(s => {
        const score = gapData.skillScores?.[s] ?? 90;
        return `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 10px; font-weight: 600; color: #1F2937;">${s}</td>
            <td style="padding: 10px; text-align: center;"><span style="background: #D1FAE5; color: #065F46; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 11px;">✓ VERIFIED (${score}%)</span></td>
          </tr>
        `;
      }).join('');

      const missingHtml = missingSkills.map(s => {
        const score = gapData.skillScores?.[s] ?? 25;
        const priority = score < 40 ? 'HIGH PRIORITY' : 'MEDIUM PRIORITY';
        const badgeBg = score < 40 ? '#FEE2E2' : '#FEF3C7';
        const badgeColor = score < 40 ? '#991B1B' : '#92400E';
        return `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 10px; font-weight: 600; color: #1F2937;">${s}</td>
            <td style="padding: 10px; text-align: center;"><span style="background: ${badgeBg}; color: ${badgeColor}; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 11px;">${priority} (${score}%)</span></td>
          </tr>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #1F2937; background: #FFFFFF; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4338CA; padding-bottom: 16px; margin-bottom: 24px; }
            .logo { font-size: 22px; font-weight: 900; color: #4338CA; }
            .meta { font-size: 12px; color: #6B7280; text-align: right; }
            .hero { background: linear-gradient(135deg, #4338CA, #312E81); color: #FFFFFF; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
            .hero h1 { margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; }
            .hero .score { font-size: 42px; font-weight: 900; margin: 8px 0; }
            .pill-row { display: flex; gap: 12px; margin-top: 12px; }
            .pill { background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 12px; border-left: 4px solid #4338CA; padding-left: 8px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
            th { background: #F3F4F6; padding: 10px; text-align: left; font-weight: 700; color: #4B5563; font-size: 11px; text-transform: uppercase; }
            .footer { text-align: center; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 32px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">UniCampus AI • Diagnostic Report</div>
              <div style="font-size: 14px; font-weight: 800; color: #111827; margin-top: 4px;">${studentName} (${rollNo})</div>
              <div style="font-size: 12px; color: #6B7280;">${course} • Academic & Industry Benchmark</div>
            </div>
            <div class="meta">
              <div>Report Date: ${dateStr}</div>
              <div>Generated by UniCampus AI</div>
            </div>
          </div>

          <div class="hero">
            <h1>${heroCategoryTitle}</h1>
            <div class="score">${gapData.matchPct}%</div>
            <div class="pill-row">
              <div class="pill">✓ ${verifiedSkills.length} Verified Competencies</div>
              <div class="pill">⚠️ ${missingSkills.length} Target Growth Gaps</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Verified Skills & Benchmarks</div>
            <table>
              <thead>
                <tr>
                  <th>Skill / Competency Area</th>
                  <th style="text-align: center; width: 180px;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${verifiedHtml || '<tr><td colspan="2" style="padding: 10px; color: #6B7280;">No verified competencies recorded yet.</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Identified Skill Gaps & Recommended Focus Areas</div>
            <table>
              <thead>
                <tr>
                  <th>Target Industry Skill</th>
                  <th style="text-align: center; width: 180px;">Priority & Gap Level</th>
                </tr>
              </thead>
              <tbody>
                ${missingHtml || '<tr><td colspan="2" style="padding: 10px; color: #6B7280;">All required skills successfully verified!</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="footer">
            Confidential Diagnostic Report • UniCampus Intelligent ERP & Placement Platform
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      setIsExportingPDF(false);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Download Skill Gap Report PDF' });
      } else {
        await Print.printAsync({ html });
      }
    } catch (error) {
      setIsExportingPDF(false);
      Alert.alert('PDF Export Error', error.message || 'Unable to generate PDF report.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // ── Share Learning Roadmap on WhatsApp ──
  const shareRoadmapWhatsApp = async (path) => {
    if (!path) return;
    const studentName = user?.name || user?.full_name || 'Student';
    let text = `🧭 *UniCampus AI • Structured Learning Roadmap*\n` +
      `🎯 *Topic:* ${path.skill}\n` +
      `👤 *Prepared For:* ${studentName}\n` +
      `📝 *Summary:* ${path.summary}\n\n` +
      `*MODULES & TIMELINE:*\n`;

    path.steps.forEach(s => {
      text += `\n📍 *Step ${s.step}: ${s.title}* (${s.timeframe})\n` +
        `• *Topics:* ${s.topics.join(', ')}\n` +
        `• *Resources:* ${s.resources.join(' | ')}\n`;
    });

    text += `\n🚀 Generated by UniCampus AI Autonomous Career Engine`;

    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Share.share({ message: text, title: `${path.skill} Learning Roadmap` });
    }
  };

  // ── Download Learning Roadmap as PDF ──
  const [isExportingRoadmapPDF, setIsExportingRoadmapPDF] = useState(false);
  const exportRoadmapPDF = async (path) => {
    if (!path) return;
    try {
      setIsExportingRoadmapPDF(true);
      const studentName = user?.name || user?.full_name || 'Student';
      const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      const stepsHtml = path.steps.map(s => `
        <div style="margin-bottom: 20px; padding: 16px; border-radius: 12px; background: #F9FAFB; border: 1px solid #E5E7EB;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 15px; font-weight: 800; color: #4338CA;">Step ${s.step}: ${s.title}</div>
            <div style="font-size: 12px; font-weight: 700; color: #EA580C; background: #FFF7ED; padding: 4px 8px; border-radius: 6px;">⏱️ ${s.timeframe}</div>
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #4B5563; margin-top: 10px; text-transform: uppercase;">Core Topics:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
            ${s.topics.map(t => `<span style="background: #EEF2FF; color: #3730A3; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">${t}</span>`).join('')}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #4B5563; margin-top: 10px; text-transform: uppercase;">Recommended Resources & Textbooks:</div>
          <ul style="margin: 6px 0 0 0; padding-left: 20px; font-size: 12px; color: #1F2937;">
            ${s.resources.map(r => `<li style="margin-bottom: 4px;">${r}</li>`).join('')}
          </ul>
        </div>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #1F2937; background: #FFFFFF; }
            .header { border-bottom: 2px solid #EA580C; padding-bottom: 14px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: 900; color: #111827; }
            .summary { font-size: 13px; color: #4B5563; line-height: 1.5; margin-top: 8px; }
            .footer { text-align: center; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 32px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 11px; font-weight: 800; color: #EA580C; text-transform: uppercase; letter-spacing: 0.5px;">UniCampus AI • Structured Learning Roadmap</div>
            <div class="title">${path.skill}</div>
            <div class="summary">${path.summary}</div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 8px;">Prepared for: <strong>${studentName}</strong> • Generated on ${dateStr}</div>
          </div>

          <div>
            ${stepsHtml}
          </div>

          <div class="footer">
            Generated with UniCampus AI Autonomous Career & Curriculum Engine
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      setIsExportingRoadmapPDF(false);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: `Download ${path.skill} Roadmap PDF` });
      } else {
        await Print.printAsync({ html });
      }
    } catch (error) {
      setIsExportingRoadmapPDF(false);
      Alert.alert('PDF Export Error', error.message || 'Unable to generate Roadmap PDF.');
    } finally {
      setIsExportingRoadmapPDF(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, flex: 1, marginHorizontal: 8 }]} numberOfLines={1}>
          {screenTitle}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            onPress={shareSkillGapWhatsApp}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(37, 211, 102, 0.15)' : '#DCFCE7',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(37, 211, 102, 0.3)' : '#86EFAC',
            }}
            accessibilityLabel="Share on WhatsApp"
          >
            <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={exportSkillGapPDF}
            disabled={isExportingPDF}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
            }}
            accessibilityLabel="Download PDF Report"
          >
            {isExportingPDF ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <MaterialCommunityIcons name="file-pdf-box" size={22} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Clean, Premium Hero Card */}
        <LinearGradient
          colors={isDark ? ['#1E1B4B', '#312E81'] : ['#4338CA', '#312E81']}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>
                {heroCategoryTitle}
              </Text>
              <Text style={styles.readinessScore}>{gapData.matchPct}%</Text>
            </View>
            <View style={styles.heroIconBox}>
              <MaterialCommunityIcons name={heroIconName} size={30} color="#FFFFFF" />
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.heroProgressBarBg}>
            <LinearGradient
              colors={gapData.matchPct >= 75 ? ['#10B981', '#059669'] : gapData.matchPct >= 50 ? ['#F59E0B', '#D97706'] : ['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.heroProgressBarFill, { width: `${Math.max(gapData.matchPct, 6)}%` }]}
            />
          </View>

          {/* Summary Metric Pills */}
          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetricPill}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#10B981" />
              <Text style={styles.heroMetricPillText}>
                {verifiedSkills.length} / {allSkills.length} Verified
              </Text>
            </View>

            <View style={styles.heroMetricPill}>
              <MaterialCommunityIcons name="alert-circle" size={14} color="#F59E0B" />
              <Text style={styles.heroMetricPillText}>
                {missingSkills.length} Identified Gaps
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Filter Pills (All / Missing Gaps / Verified) */}
        <View style={styles.filterPillsContainer}>
          {[
            { id: 'all', label: `All (${allSkills.length})` },
            { id: 'missing', label: `Missing Gaps (${missingSkills.length})` },
            { id: 'verified', label: `Verified (${verifiedSkills.length})` },
          ].map((tab) => {
            const isSelected = filterTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setFilterTab(tab.id)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : (isDark ? colors.card : '#F1F5F9'),
                    borderColor: isSelected ? colors.primary : colors.border,
                  }
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {sectionSubTitle}
        </Text>

        {displayList.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="shield-check-outline" size={48} color="#10B981" />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>All Clear!</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              No matching skills found for this filter.
            </Text>
          </View>
        ) : (
          displayList.map((skill, index) => {
            const isMissing = missingSkills.includes(skill);
            const score = gapData.skillScores?.[skill] ?? (isMissing ? 25 : 90);
            const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
            const priority = isMissing ? (score < 40 ? 'HIGH' : 'MEDIUM') : 'VERIFIED';
            const isViewed = viewedSkills[skill];

            return (
              <View key={index} style={[styles.skillCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header: Title + Tag + Score Box */}
                <View style={styles.skillHeader}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.skillTitle, { color: colors.textPrimary }]}>{skill}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <View style={[styles.priorityBadge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
                        <Text style={[styles.priorityText, { color: color }]}>
                          {priority} {priority === 'VERIFIED' ? '' : 'PRIORITY'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.scoreBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC', borderColor: colors.border }]}>
                    <Text style={[styles.scoreVal, { color: color }]}>{score}%</Text>
                  </View>
                </View>

                {/* Score Progress Bar */}
                <View style={[styles.progressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEF2F6' }]}>
                  <View style={[styles.progressFill, { width: `${Math.max(score, 6)}%`, backgroundColor: color }]} />
                </View>

                {/* Status Section */}
                <View style={styles.gapSection}>
                  <View style={styles.gapItem}>
                    <MaterialCommunityIcons 
                      name={isMissing ? "alert-circle-outline" : "check-circle-outline"} 
                      size={16} 
                      color={color} 
                    />
                    <Text style={[styles.gapText, { color: colors.textSecondary }]}>
                      {isTech
                        ? (gapData.skillEvidences?.[skill] || (isMissing ? "Missing must-have skill in current stack." : "Verified skill in profile & coursework."))
                        : (isMissing 
                            ? (isMed ? "Identified gap in clinical preparation." : "Identified gap in modern career readiness.") 
                            : (isMed ? "Verified proficiency in competency." : "Verified proficiency in curriculum."))
                      }
                    </Text>
                  </View>
                </View>

                {/* Action CTA */}
                {isMissing ? (
                  <View style={{ gap: 8 }}>
                    {Boolean(getCuratedPracticeLink(skill)) && (() => {
                      const pLink = getCuratedPracticeLink(skill);
                      return (
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 12,
                            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#DBEAFE',
                          }}
                          onPress={() => Linking.openURL(pLink.url).catch(() => {})}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <MaterialCommunityIcons name={pLink.icon} size={16} color="#3B82F6" />
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#2563EB' }}>
                              {pLink.label} ↗
                            </Text>
                          </View>
                          <MaterialCommunityIcons name="open-in-new" size={14} color="#3B82F6" />
                        </TouchableOpacity>
                      );
                    })()}

                    <TouchableOpacity
                      style={[styles.learnBtn, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.12)' : '#FFF7ED', borderColor: '#EA580C' }]}
                      onPress={() => handleExplorePath(skill)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="compass-outline" size={16} color="#EA580C" style={{ marginRight: 6 }} />
                      <Text style={styles.learnBtnText}>
                        {isViewed
                          ? "Review Learning Roadmap"
                          : (isMed 
                              ? "Explore Clinical Case Path & Study"
                              : (isTech ? "Explore Tech Roadmap & Practice" : "Explore Career Roadmap & Study Guide"))}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.verifiedPill, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5', borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0' }]}>
                    <MaterialCommunityIcons name="check-decagram" size={14} color="#10B981" />
                    <Text style={styles.verifiedPillText}>Skill Benchmark Verified</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Learning Path Modal */}
      <Modal
        visible={activeSkill !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveSkill(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                {isMed ? 'Clinical Learning Path' : 'AI Learning Roadmap'}
              </Text>
              {learningPath && !loading && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 }}>
                  <TouchableOpacity
                    onPress={() => shareRoadmapWhatsApp(learningPath)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: isDark ? 'rgba(37, 211, 102, 0.15)' : '#DCFCE7',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(37, 211, 102, 0.3)' : '#86EFAC',
                    }}
                    accessibilityLabel="Share Roadmap on WhatsApp"
                  >
                    <MaterialCommunityIcons name="whatsapp" size={19} color="#25D366" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => exportRoadmapPDF(learningPath)}
                    disabled={isExportingRoadmapPDF}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
                    }}
                    accessibilityLabel="Download Roadmap PDF"
                  >
                    {isExportingRoadmapPDF ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <MaterialCommunityIcons name="file-pdf-box" size={20} color="#EF4444" />
                    )}
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity onPress={() => setActiveSkill(null)} style={styles.modalCloseBtn}>
                <Feather name="x" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.modalLoading}>
                <SkeletonBlock width={'60%'} height={24} borderRadius={10} style={{ marginBottom: 8 }} />
                <SkeletonBlock width={'80%'} height={13} borderRadius={6} style={{ marginBottom: 24 }} />
                <TimelineSkeleton steps={3} />
              </View>
            ) : learningPath ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <Text style={[styles.skillSubject, { color: colors.textPrimary }]}>{learningPath.skill}</Text>
                <Text style={[styles.skillSummary, { color: colors.textSecondary }]}>{learningPath.summary}</Text>

                {/* Direct Curated Practice Link in Roadmap */}
                {Boolean(getCuratedPracticeLink(learningPath.skill)) && (() => {
                  const pLink = getCuratedPracticeLink(learningPath.skill);
                  return (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(234, 88, 12, 0.35)' : '#FED7AA',
                        marginBottom: 16,
                      }}
                      onPress={() => Linking.openURL(pLink.url).catch(() => {})}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <MaterialCommunityIcons name={pLink.icon} size={20} color="#EA580C" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>{pLink.label}</Text>
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>Direct practice problems & curated study plan</Text>
                        </View>
                      </View>
                      <MaterialCommunityIcons name="open-in-new" size={16} color="#EA580C" />
                    </TouchableOpacity>
                  );
                })()}

                <View style={styles.timeline}>
                  {learningPath.steps.map((step, idx) => (
                    <View key={idx} style={styles.timelineStep}>
                      <View style={styles.timelineLeft}>
                        <View style={styles.timelineNode}>
                          <Text style={styles.nodeText}>{step.step}</Text>
                        </View>
                        {idx < learningPath.steps.length - 1 && <View style={styles.timelineLine} />}
                      </View>

                      <View style={styles.timelineRight}>
                        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>{step.title}</Text>
                        <View style={styles.timeBadge}>
                          <Feather name="clock" size={12} color="#EA580C" />
                          <Text style={styles.timeText}>{step.timeframe}</Text>
                        </View>

                        <Text style={[styles.subTitleLabel, { color: colors.textSecondary }]}>{isMed ? 'Clinical Topics / High-yield Points:' : 'Core Topics:'}</Text>
                        <View style={styles.topicsGrid}>
                          {step.topics.map((topic, i) => (
                            <View key={i} style={[styles.topicChip, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                              <Text style={[styles.topicChipText, { color: colors.textPrimary }]}>{topic}</Text>
                            </View>
                          ))}
                        </View>

                        <Text style={[styles.subTitleLabel, { color: colors.textSecondary }]}>{isMed ? 'Standard Textbooks & Clinical Guides:' : 'Recommended Resources:'}</Text>
                        {step.resources.map((res, i) => (
                          <View key={i} style={styles.resourceItem}>
                            <Feather name="book-open" size={14} color="#4338CA" />
                            <Text style={[styles.resourceText, { color: colors.textPrimary }]}>{res}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                {/* ── Roadmap Share & PDF Download Action Bar ── */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 16 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#25D366',
                      paddingVertical: 12,
                      borderRadius: 14,
                      gap: 6,
                    }}
                    onPress={() => shareRoadmapWhatsApp(learningPath)}
                  >
                    <MaterialCommunityIcons name="whatsapp" size={18} color="#FFFFFF" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>Share WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.primary,
                      paddingVertical: 12,
                      borderRadius: 14,
                      gap: 6,
                    }}
                    disabled={isExportingRoadmapPDF}
                    onPress={() => exportRoadmapPDF(learningPath)}
                  >
                    {isExportingRoadmapPDF ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="file-pdf-box" size={18} color="#FFFFFF" />
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>Download PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.modalLoading}>
                <Text style={{ color: colors.textPrimary }}>Failed to load learning roadmap.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scroll: { padding: 16 },

  // Hero Card
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  readinessScore: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    marginTop: 2,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroProgressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 14,
  },
  heroProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroMetricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heroMetricPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Filter Pills
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '800',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  // Skill Card
  skillCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  skillTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  scoreBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  scoreVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  gapSection: {
    marginBottom: 14,
  },
  gapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gapText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  learnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  learnBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  verifiedPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
    marginLeft: 4,
  },

  // Empty Card
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 20,
    maxHeight: '85%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalLoading: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingVertical: 20,
  },
  skillSubject: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  skillSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  timeline: {
    paddingLeft: 2,
  },
  timelineStep: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: 'center',
  },
  timelineNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 6,
    marginBottom: -6,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 12,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(234,88,12,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  timeText: {
    color: '#EA580C',
    fontSize: 10,
    fontWeight: '800',
  },
  subTitleLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  topicChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  topicChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  resourceText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default DeepDiveAnalysisScreen;
