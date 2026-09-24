/**
 * ERPLessonsScreen.js
 * Shows lesson plans & study materials uploaded by faculty via ERP.
 * Endpoints: GET /api/v1/lessons, GET /api/v1/lessons/recent, GET /api/v1/lessons/{id}/download
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Animated, Linking, RefreshControl, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
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
      <LinearGradient colors={isDark ? ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)'] : [fc.bg, fc.bg + 'cc']} style={styles.cardIconArea}>
        <MaterialIcons name={fc.icon} size={32} color={fc.color} />
      </LinearGradient>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>{lesson.title || lesson.name || 'Untitled Lesson'}</Text>
        <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
          {lesson.subject_name || lesson.subject || ''}{lesson.unit_name ? ` · ${lesson.unit_name}` : ''}
        </Text>
        <View style={styles.cardRow}>
          {lesson.sem_cd && (
            <View style={[styles.chip, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}>
              <Text style={[styles.chipText, { color: '#6366F1', fontWeight: '700' }]}>Sem {lesson.sem_cd}</Text>
            </View>
          )}
          {lesson.faculty_name && (
            <View style={styles.chip}>
              <MaterialIcons name="person" size={11} color={colors.textMuted} />
              <Text style={[styles.chipText, { color: colors.textMuted }]} numberOfLines={1}>{lesson.faculty_name}</Text>
            </View>
          )}
          {dateStr ? (
            <View style={styles.chip}>
              <MaterialIcons name="schedule" size={11} color={colors.textMuted} />
              <Text style={[styles.chipText, { color: colors.textMuted }]}>{dateStr}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]} onPress={() => onDownload(lesson)}>
        <MaterialIcons name="download" size={20} color="#6366F1" />
      </TouchableOpacity>
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

  const [activeSem, setActiveSem] = useState('all');
  const [lessons, setLessons] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

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

  const handleDownload = async (lesson) => {
    setDownloadingId(lesson.id);
    try {
      const url = await getErpLessonDownloadUrl(accessToken, lesson.id);
      const finalUrl = url || `${ERP_BASE}/api/v1/lessons/${lesson.id}/download`;
      await Linking.openURL(finalUrl);
    } catch (err) {
      console.warn('[ERPLessonsScreen] download error:', err);
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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Lesson Plans & Notes</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {userCourseName} · {activeSem === 'all' ? 'All Semesters' : `Sem ${activeSem}`} ({filtered.length})
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}>
          <Text style={{ color: '#6366F1', fontWeight: '700', fontSize: 12 }}>{filtered.length}</Text>
        </View>
      </View>

      {/* Semester Filter Tabs */}
      <View style={{ paddingVertical: 8 }}>
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
                    backgroundColor: isSelected ? '#6366F1' : (isDark ? '#1E293B' : '#F1F5F9'),
                    borderColor: isSelected ? '#6366F1' : colors.border,
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
        <Feather name="search" size={16} color={colors.textMuted} />
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
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Loading lesson materials…</Text>
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
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Lessons Found</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                {search ? 'No results match your search.' : 'Faculty have not uploaded any lesson materials yet.'}
              </Text>
            </View>
          ) : (
            grouped.map(([subject, items]) => (
              <View key={subject} style={styles.subjectGroup}>
                <View style={styles.subjectHeader}>
                  <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.subjectDot} />
                  <Text style={[styles.subjectTitle, { color: colors.textPrimary }]}>{subject}</Text>
                  <View style={[styles.countChip, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}>
                    <Text style={{ color: '#6366F1', fontSize: 11, fontWeight: '700' }}>{items.length}</Text>
                  </View>
                </View>
                {items.map(lesson => (
                  <View key={lesson.id} style={{ opacity: downloadingId === lesson.id ? 0.6 : 1 }}>
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
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 0 },
  subjectGroup: { marginBottom: 20 },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  subjectDot: { width: 4, height: 20, borderRadius: 2 },
  subjectTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  countChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardIconArea: { width: 64, paddingVertical: 16, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, gap: 3 },
  cardTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  cardMeta: { fontSize: 12 },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chipText: { fontSize: 11 },
  downloadBtn: { width: 44, height: '100%', justifyContent: 'center', alignItems: 'center' },
  downloadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, justifyContent: 'center', alignItems: 'center' },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyState: { borderRadius: 20, padding: 32, alignItems: 'center', marginTop: 40, borderWidth: 1, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  semChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  semChipText: { fontSize: 12, fontWeight: '700' },
});

export default ERPLessonsScreen;
