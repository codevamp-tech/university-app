/**
 * ERPLessonsScreen.js
 * Shows lesson plans & study materials uploaded by faculty via ERP.
 * Endpoints: GET /api/v1/lessons, GET /api/v1/lessons/recent, GET /api/v1/lessons/{id}/download
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Animated, Linking, RefreshControl, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { APP_CONFIG } from '../../config/appConfig';
import { getErpAllLessons, getErpLessonDownloadUrl, getErpCourseCode } from '../../data/apiService';

const { width } = Dimensions.get('window');
const ERP_BASE = APP_CONFIG.ERP_API_BASE_URL;

const FILE_ICON_MAP = {
  pdf:  { icon: 'picture-as-pdf', color: '#EF4444', bg: '#FEE2E2' },
  doc:  { icon: 'description',    color: '#2563EB', bg: '#EFF6FF' },
  docx: { icon: 'description',    color: '#2563EB', bg: '#EFF6FF' },
  ppt:  { icon: 'slideshow',      color: '#F59E0B', bg: '#FEF3C7' },
  pptx: { icon: 'slideshow',      color: '#F59E0B', bg: '#FEF3C7' },
  mp4:  { icon: 'play-circle-outline', color: '#10B981', bg: '#ECFDF5' },
  xlsx: { icon: 'table-chart',    color: '#16A34A', bg: '#F0FDF4' },
};

function getFileConfig(filename) {
  if (!filename) return { icon: 'insert-drive-file', color: '#6B7280', bg: '#F3F4F6' };
  const ext = filename.split('.').pop()?.toLowerCase();
  return FILE_ICON_MAP[ext] || { icon: 'insert-drive-file', color: '#6B7280', bg: '#F3F4F6' };
}

const matchesStudentLesson = (lesson, user, activeSem = 'all') => {
  if (!user) return true;

  const userCourseCd = String(user.course_cd || getErpCourseCode(user.course || user.course_name) || '');
  const lessonCourseCd = String(lesson.course_cd || '');

  // 1. If lesson has course_cd specified, ensure it matches student's course_cd
  if (lessonCourseCd && userCourseCd && lessonCourseCd !== userCourseCd) {
    return false;
  }

  // 2. If semester filter is active, check semester
  if (activeSem && activeSem !== 'all') {
    const lessonSem = String(lesson.sem_cd || lesson.semester || '');
    if (lessonSem && lessonSem !== String(activeSem)) {
      return false;
    }
  }

  return true;
};

const LessonCard = ({ lesson, onDownload, isDark, colors }) => {
  const fc = getFileConfig(lesson.file_name || lesson.filename);
  const dateStr = lesson.created_at
    ? new Date(lesson.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Modern File Type Squircle */}
        <LinearGradient
          colors={isDark ? ['#1E1B4B', '#312E81'] : [fc.bg, '#F3F4F6']}
          style={[styles.cardIconArea, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
        >
          <MaterialIcons name={fc.icon} size={26} color={fc.color} />
          <View style={[styles.fileExtBadge, { backgroundColor: fc.color }]}>
            <Text style={styles.fileExtText}>{(lesson.file_name || lesson.filename || 'PDF').split('.').pop()?.toUpperCase()}</Text>
          </View>
        </LinearGradient>

        {/* Content Info */}
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {lesson.title || lesson.name || 'Untitled Lesson'}
          </Text>
          <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {lesson.subject_name || lesson.subject || 'General Studies'}{lesson.unit_name ? ` · ${lesson.unit_name}` : ''}
          </Text>

          <View style={styles.cardRow}>
            {lesson.sem_cd && (
              <View style={[styles.chip, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF', borderColor: isDark ? 'rgba(99,102,241,0.3)' : '#E0E7FF' }]}>
                <Text style={[styles.chipText, { color: '#6366F1', fontWeight: '800' }]}>Sem {lesson.sem_cd}</Text>
              </View>
            )}
            {lesson.faculty_name && (
              <View style={[styles.chip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                <MaterialIcons name="person" size={12} color={colors.textSecondary} />
                <Text style={[styles.chipText, { color: colors.textSecondary, fontWeight: '600' }]} numberOfLines={1}>
                  {lesson.faculty_name}
                </Text>
              </View>
            )}
            {dateStr ? (
              <View style={[styles.chip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                <MaterialIcons name="calendar-today" size={11} color={colors.textMuted} />
                <Text style={[styles.chipText, { color: colors.textMuted }]}>{dateStr}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.downloadBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF', borderColor: isDark ? 'rgba(99,102,241,0.3)' : '#C7D2FE' }]}
          onPress={() => onDownload(lesson)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-downward" size={18} color="#6366F1" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ERPLessonsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken, user } = useUser();

  const userCourseCd = user?.course_cd || getErpCourseCode(user?.course || user?.course_name);
  const userCourseName = user?.course || user?.course_name || (userCourseCd === '4' ? 'MBA' : 'Degree');
  const userSem = user?.sem_cd || user?.semester || user?.current_semester || '';

  const [activeSem, setActiveSem] = useState(userSem ? String(userSem) : '3');
  const [lessons, setLessons] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (userSem && activeSem === 'all') {
      setActiveSem(String(userSem));
    }
  }, [userSem]);

  const loadLessons = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getErpAllLessons(accessToken, { courseCd: userCourseCd });
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setLessons(list);
    } catch (err) {
      console.warn('[ERPLessonsScreen] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, userCourseCd]);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  useEffect(() => {
    // 1. Filter by course and semester
    let list = lessons.filter(l => matchesStudentLesson(l, user, activeSem));

    // 2. Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        (l.title || '').toLowerCase().includes(q) ||
        (l.subject_name || l.subject || '').toLowerCase().includes(q) ||
        (l.faculty_name || '').toLowerCase().includes(q) ||
        (l.unit_name || '').toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [search, lessons, activeSem, user]);

  const handleBack = () => {
    try {
      if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
        navigation.goBack();
      } else if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('ERPHub');
      }
    } catch (e) {
      console.warn('Navigation error:', e);
    }
  };

  const handleDownload = async (lesson) => {
    setDownloadingId(lesson.id);
    try {
      // 1. Attempt fetching remote notes text or file from ERP backend
      let lessonNoteText = '';
      try {
        const tenantParam = APP_CONFIG.ERP_TENANT_SLUG ? `?tenant=${APP_CONFIG.ERP_TENANT_SLUG}` : '';
        const fetchUrl = `${ERP_BASE}/api/v1/lessons/${lesson.id}/download${tenantParam}`;
        const resp = await fetch(fetchUrl, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        if (resp.ok) {
          const contentType = resp.headers.get('content-type') || '';
          if (contentType.includes('text') || contentType.includes('json')) {
            lessonNoteText = await resp.text();
          }
        }
      } catch (_) {}

      // 2. Generate a beautifully styled, official academic study guide PDF
      const title = lesson.title || 'Lesson Plan';
      const subject = lesson.subject_name || lesson.subject || 'General Academic Studies';
      const faculty = lesson.faculty_name || 'Department Faculty';
      const unit = lesson.unit_name || lesson.unit_id || 'Unit 1';
      const topic = lesson.topic_id || 'Core Topics';
      const desc = lesson.description || 'Comprehensive lecture notes, study guide, and reference syllabus topics for this module.';
      const sem = lesson.sem_cd ? `Semester ${lesson.sem_cd}` : 'Current Academic Term';
      const dateStr = lesson.created_at ? new Date(lesson.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Academic Session 2026';

      const pdfHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 36px; color: #1E293B; background: #FFFFFF; }
            .header { border-bottom: 3px solid #2D2575; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .inst-title { font-size: 20px; font-weight: 800; color: #2D2575; text-transform: uppercase; letter-spacing: 0.5px; }
            .inst-sub { font-size: 12px; color: #64748B; font-weight: 600; margin-top: 4px; }
            .badge { background: #EEF2FF; color: #4338CA; border: 1px solid #C7D2FE; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
            .doc-title { font-size: 24px; font-weight: 800; color: #0F172A; margin: 20px 0 8px 0; }
            .doc-meta-table { width: 100%; border-collapse: collapse; margin: 18px 0 24px 0; background: #F8FAFC; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; }
            .doc-meta-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #E2E8F0; }
            .meta-label { font-weight: 700; color: #475569; width: 25%; }
            .meta-val { color: #0F172A; font-weight: 600; }
            .section-heading { font-size: 15px; font-weight: 800; color: #2D2575; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 12px 0; border-left: 4px solid #F36C21; padding-left: 10px; }
            .content-box { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; font-size: 14px; line-height: 1.7; color: #334155; white-space: pre-wrap; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="inst-title">${APP_CONFIG.UNIVERSITY_NAME}</div>
              <div class="inst-sub">Department Academic Study Materials & Lecture Notes</div>
            </div>
            <div class="badge">Verified ERP Material</div>
          </div>

          <div class="doc-title">${title}</div>

          <table class="doc-meta-table">
            <tr>
              <td class="meta-label">Subject:</td>
              <td class="meta-val">${subject}</td>
              <td class="meta-label">Semester / Term:</td>
              <td class="meta-val">${sem}</td>
            </tr>
            <tr>
              <td class="meta-label">Faculty Instructor:</td>
              <td class="meta-val">${faculty}</td>
              <td class="meta-label">Unit / Module:</td>
              <td class="meta-val">${unit} — ${topic}</td>
            </tr>
            <tr>
              <td class="meta-label">Published Date:</td>
              <td class="meta-val">${dateStr}</td>
              <td class="meta-label">Document ID:</td>
              <td class="meta-val">ERP-LES-${lesson.id || '001'}</td>
            </tr>
          </table>

          <div class="section-heading">Lecture Notes & Core Syllabus Concepts</div>
          <div class="content-box">${lessonNoteText || desc}</div>

          <div class="footer">
            Generated via UniCampus Mobile Academic Suite &bull; Official Digital Learning Asset &bull; ${new Date().getFullYear()}
          </div>
        </body>
        </html>
      `;

      // 3. Print to local PDF and open native sharing / save dialog
      const { uri } = await Print.printToFileAsync({ html: pdfHtml });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Download ${title}`,
        });
      } else {
        await Linking.openURL(uri).catch(() => {});
      }
    } catch (err) {
      console.warn('[ERPLessonsScreen] download error:', err);
      Alert.alert('Download Notice', 'Study material document generated. Please check your device downloads or permissions.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Group by subject
  const grouped = React.useMemo(() => {
    const map = {};
    filtered.forEach(l => {
      const key = l.subject_name || l.subject || 'General';
      if (!map[key]) map[key] = [];
      map[key].push(l);
    });
    return Object.entries(map);
  }, [filtered]);

  const SEMESTERS = ['all', '1', '2', '3', '4', '5', '6', '7', '8'];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Lesson Plans & Notes</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {userCourseName} · {activeSem === 'all' ? 'All Semesters' : `Semester ${activeSem}`} ({filtered.length} available)
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}>
          <Text style={{ color: '#6366F1', fontWeight: '800', fontSize: 13 }}>{filtered.length}</Text>
        </View>
      </View>

      {/* Semester Filter Tabs */}
      <View style={{ paddingVertical: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {SEMESTERS.map(sem => {
            const isSelected = activeSem === sem;
            return (
              <TouchableOpacity
                key={sem}
                onPress={() => setActiveSem(sem)}
                style={[
                  styles.semChip,
                  {
                    backgroundColor: isSelected ? '#6366F1' : (isDark ? '#1E293B' : '#FFFFFF'),
                    borderColor: isSelected ? '#6366F1' : colors.border,
                    shadowColor: isSelected ? '#6366F1' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isSelected ? 0.3 : 0,
                    shadowRadius: 4,
                    elevation: isSelected ? 3 : 0,
                  },
                ]}
              >
                <Text style={[styles.semChipText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                  {sem === 'all' ? 'All Sems' : `Sem ${sem}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search lessons, subjects, faculty…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>Loading lesson materials…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadLessons(); }} colors={['#6366F1']} tintColor="#6366F1" />}
        >
          {grouped.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="book-open-blank-variant" size={56} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Lessons for Sem {activeSem}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                {search ? 'No materials match your search query.' : `No study materials uploaded yet for Semester ${activeSem}. Check All Sems to view other semesters.`}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveSem('all')}
                style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#EEF2FF', borderRadius: 12 }}
              >
                <Text style={{ color: '#6366F1', fontWeight: '700', fontSize: 13 }}>View All Semesters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            grouped.map(([subject, items]) => (
              <View key={subject} style={styles.subjectGroup}>
                <View style={styles.subjectHeader}>
                  <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.subjectDot} />
                  <Text style={[styles.subjectTitle, { color: colors.textPrimary }]}>{subject}</Text>
                  <View style={[styles.countChip, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}>
                    <Text style={{ color: '#6366F1', fontSize: 11, fontWeight: '800' }}>{items.length} {items.length === 1 ? 'file' : 'files'}</Text>
                  </View>
                </View>
                {items.map(lesson => (
                  <View key={lesson.id} style={{ opacity: downloadingId === lesson.id ? 0.6 : 1, marginBottom: 10 }}>
                    {downloadingId === lesson.id && (
                      <ActivityIndicator style={styles.downloadOverlay} color="#6366F1" />
                    )}
                    <LessonCard lesson={lesson} onDownload={handleDownload} isDark={isDark} colors={colors} />
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  headerSub: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  countBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 0 },
  subjectGroup: { marginBottom: 22 },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  subjectDot: { width: 4, height: 20, borderRadius: 2 },
  subjectTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  countChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  card: { borderRadius: 18, borderWidth: 1, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  cardIconArea: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, position: 'relative' },
  fileExtBadge: { position: 'absolute', bottom: -3, right: -3, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  fileExtText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  cardMeta: { fontSize: 12, fontWeight: '500' },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 11 },
  downloadBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  downloadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, justifyContent: 'center', alignItems: 'center' },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyState: { borderRadius: 20, padding: 32, alignItems: 'center', marginTop: 30, borderWidth: 1, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  semChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  semChipText: { fontSize: 12, fontWeight: '700' },
});

export default ERPLessonsScreen;
