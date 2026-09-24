/**
 * ERPNoticesScreen.js
 * Shows ERP-sourced notices and circulars targeted to the student.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Animated, Linking, RefreshControl, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { APP_CONFIG } from '../../config/appConfig';
import {
  getErpNotices, getErpNoticeById, markErpNoticeRead,
  getErpNoticesUnreadCount, acknowledgeErpNotice,
} from '../../data/apiService';
import { getStudentPlacementTrack } from '../../utils/placementReadiness';

const { width } = Dimensions.get('window');
const ERP_BASE = APP_CONFIG.ERP_API_BASE_URL;
const TENANT  = APP_CONFIG.ERP_TENANT_SLUG;

const FILTER_TABS = [
  { key: 'all',           label: 'All',        icon: 'inbox' },
  { key: 'unread',        label: 'Unread',     icon: 'mark-email-unread' },
  { key: 'urgent',        label: 'Urgent',     icon: 'notification-important' },
  { key: 'announcements', label: 'Announce',   icon: 'campaign' },
  { key: 'deadlines',     label: 'Deadlines',  icon: 'event-busy' },
];

const PRIORITY_STYLE = {
  urgent: { bg: '#FEE2E2', color: '#DC2626', icon: 'warning', label: 'URGENT' },
  high:   { bg: '#FEF3C7', color: '#D97706', icon: 'priority-high', label: 'HIGH' },
  normal: { bg: '#EFF6FF', color: '#2563EB', icon: 'info', label: 'INFO' },
  low:    { bg: '#F0FDF4', color: '#16A34A', icon: 'low-priority', label: 'LOW' },
};

const NoticeCard = ({ notice, onPress, isDark, colors }) => {
  const p = PRIORITY_STYLE[notice.priority] || PRIORITY_STYLE.normal;
  const isUnread = !notice.is_read;
  const dateStr = notice.created_at
    ? new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: isUnread ? '#6366F1' : colors.border, borderWidth: isUnread ? 1.5 : 1 }]}
      onPress={() => onPress(notice)}
      activeOpacity={0.85}
    >
      <View style={[styles.priorityStrip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : p.bg }]}>
        <MaterialIcons name={p.icon} size={14} color={p.color} />
        <Text style={[styles.priorityLabel, { color: p.color }]}>{p.label}</Text>
        {isUnread && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary, fontWeight: isUnread ? '700' : '600' }]} numberOfLines={2}>{notice.title}</Text>
        <Text style={[styles.cardDate, { color: colors.textMuted }]}>{dateStr}</Text>
        {(notice.summary || notice.content) ? (
          <Text style={[styles.cardPreview, { color: colors.textSecondary }]} numberOfLines={2}>{notice.summary || notice.content}</Text>
        ) : null}
        {notice.category ? (
          <View style={[styles.categoryChip, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}>
            <Text style={[styles.categoryText]}>{notice.category}</Text>
          </View>
        ) : null}
        {notice.attachments?.length > 0 && (
          <View style={styles.attachBadge}>
            <MaterialIcons name="attach-file" size={12} color={colors.textMuted} />
            <Text style={[styles.attachText, { color: colors.textMuted }]}>{notice.attachments.length} attachment{notice.attachments.length > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>
      <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

const normalizeString = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const matchesStudentNotice = (notice, user) => {
  if (!user) return true;

  const studentName = (user.name || user.full_name || '').toLowerCase().trim();
  const studentFirst = studentName.split(' ')[0] || '';
  const track = getStudentPlacementTrack(user);

  // 1. Explicit target identifiers on the notice
  const targetStudentId = notice.target_student_id || notice.student_id || notice.student_reg_no || notice.target_user_id;
  if (targetStudentId) {
    const normTargetId = normalizeString(targetStudentId);
    const userIds = [user.id, user.user_id, user.username, user.rollno, user.registration_no, user.emp_id].filter(Boolean).map(normalizeString);
    if (!userIds.includes(normTargetId)) {
      return false; // Specifically targeted to another student
    }
  }

  // 2. Structured targets array (target_type == 'student' or 'user' or 'rollno')
  if (Array.isArray(notice.targets) && notice.targets.length > 0) {
    const studentSpecificTargets = notice.targets.filter(t => ['student', 'user', 'rollno', 'individual'].includes((t.target_type || '').toLowerCase()));
    if (studentSpecificTargets.length > 0) {
      const userIds = [user.id, user.user_id, user.username, user.rollno, user.registration_no, user.emp_id].filter(Boolean).map(normalizeString);
      const isTargetedToMe = studentSpecificTargets.some(t => userIds.includes(normalizeString(t.target_value)));
      if (!isTargetedToMe) return false;
    }

    // Check course-specific targets if present
    const courseTargets = notice.targets.filter(t => ['course', 'branch', 'dept', 'department'].includes((t.target_type || '').toLowerCase()));
    if (courseTargets.length > 0) {
      const userCourses = [user.course, user.course_name, user.course_cd, user.department, user.department_name, user.branch].filter(Boolean).map(normalizeString);
      const isCourseMatch = courseTargets.some(t => {
        const val = normalizeString(t.target_value);
        return val === 'all' || val === 'any' || userCourses.some(c => c === val || (c.length >= 3 && (c.includes(val) || val.includes(c))));
      });
      if (!isCourseMatch) return false;
    }
  }

  // 3. Career / Placement Drive notice domain filtering
  const category = (notice.category || '').toLowerCase().trim();
  const noticeTitle = (notice.title || '').toLowerCase().trim();
  if (category === 'career' || noticeTitle.includes('placement drive') || noticeTitle.includes('campus placement')) {
    if (track === 'commerce_management') {
      const isTechNotice = noticeTitle.includes('cloud engineer') ||
                           noticeTitle.includes('software developer') ||
                           noticeTitle.includes('tech mahindra') ||
                           noticeTitle.includes('wipro');
      if (isTechNotice) return false;
    } else if (track === 'tech') {
      const isManagementNotice = noticeTitle.includes('financial audit') ||
                                 noticeTitle.includes('marketing research') ||
                                 noticeTitle.includes('equity analyst');
      if (isManagementNotice) return false;
    } else if (track === 'pharma_healthcare') {
      const isTechOrMgmt = noticeTitle.includes('software developer') ||
                           noticeTitle.includes('cloud engineer') ||
                           noticeTitle.includes('financial audit');
      if (isTechOrMgmt) return false;
    }
  }

  // 4. Personalized Individual Congratulatory / Disciplinary / Award text filter:
  // If notice title or body contains explicit personalized greeting like "Congratulations <NAME>"
  const bodyText = `${notice.title || ''} ${notice.summary || ''} ${notice.body || ''} ${notice.content || ''}`;
  const congratsMatch = bodyText.match(/congratulations\s+([A-Z\s]{3,35})[!,\.]/i);
  if (congratsMatch && congratsMatch[1]) {
    const mentionedName = congratsMatch[1].toLowerCase().trim();
    if (
      mentionedName.length > 3 &&
      !['all', 'team', 'students', 'winners', 'batch', 'class', 'everyone', 'all students'].includes(mentionedName)
    ) {
      const isMyName = (studentName && (studentName.includes(mentionedName) || mentionedName.includes(studentName))) ||
                       (studentFirst && studentFirst.length >= 3 && mentionedName.includes(studentFirst));
      if (!isMyName) {
        return false; // Personalized for another specific student
      }
    }
  }

  return true;
};

const ERPNoticesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken, user } = useUser();
  const [activeFilter, setActiveFilter] = useState('all');
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (unreadCount > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [unreadCount]);

  const loadNotices = useCallback(async () => {
    if (!accessToken) return;
    try {
      const studentId = user?.id || user?.username || user?.rollno || user?.emp_id || '';
      const [data, count] = await Promise.all([
        getErpNotices(accessToken, studentId),
        getErpNoticesUnreadCount(accessToken, studentId),
      ]);
      let list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      // Filter notices according to logged-in student
      list = list.filter(n => matchesStudentNotice(n, user));
      if (activeFilter === 'unread') list = list.filter(n => !n.is_read);
      else if (activeFilter !== 'all') list = list.filter(n => (n.priority === activeFilter) || (n.category?.toLowerCase().includes(activeFilter)));

      // Strict descending chronological sorting (most recent notice on top)
      list.sort((a, b) => {
        const timeA = new Date(a.created_at || a.date || a.published_at || 0).getTime();
        const timeB = new Date(b.created_at || b.date || b.published_at || 0).getTime();
        return timeB - timeA;
      });

      setNotices(list);
      const unreadFiltered = list.filter(n => !n.is_read).length;
      setUnreadCount(typeof count === 'number' && count > 0 ? Math.min(count, unreadFiltered) : unreadFiltered);
    } catch (err) {
      console.warn('[ERPNoticesScreen] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, user, activeFilter]);

  useEffect(() => { setLoading(true); loadNotices(); }, [loadNotices]);

  const handleOpenNotice = async (notice) => {
    setDetailLoading(true);
    setSelectedNotice(notice);
    try {
      const detail = await getErpNoticeById(accessToken, notice.id);
      if (detail) setSelectedNotice(detail);
      if (!notice.is_read) {
        markErpNoticeRead(accessToken, notice.id).catch(() => {});
        setNotices(prev => prev.map(n => n.id === notice.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (_) {} finally { setDetailLoading(false); }
  };

  const handleOpenAttachment = async (filename) => {
    const url = `${ERP_BASE}/api/v1/notices/attachments/${encodeURIComponent(filename)}?tenant=${TENANT}`;
    try { await Linking.openURL(url); } catch {}
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notices & Circulars</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>ERP-issued official notices</Text>
        </View>
        {unreadCount > 0 && (
          <Animated.View style={[styles.unreadBadge, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.filterBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
        >
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.7}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: isActive ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF'),
                    borderColor: isActive ? '#6366F1' : colors.border,
                  }
                ]}
                onPress={() => setActiveFilter(tab.key)}
              >
                <MaterialIcons
                  name={tab.icon}
                  size={14}
                  color={isActive ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    {
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isActive ? '700' : '600',
                    }
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={[{ color: colors.textSecondary, fontSize: 14 }]}>Loading notices…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotices(); }} colors={['#6366F1']} tintColor="#6366F1" />}
        >
          {notices.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="bell-sleep-outline" size={56} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Notices</Text>
              <Text style={[{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }]}>
                {activeFilter === 'unread' ? 'All caught up! No unread notices.' : 'No notices have been sent to you yet.'}
              </Text>
            </View>
          ) : (
            notices.map(notice => (
              <NoticeCard key={notice.id} notice={notice} onPress={handleOpenNotice} isDark={isDark} colors={colors} />
            ))
          )}
        </ScrollView>
      )}

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedNotice(null)}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSelectedNotice(null)} style={[styles.modalBack, { backgroundColor: colors.card }]}>
                <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalHeaderTitle, { color: colors.textPrimary }]} numberOfLines={1}>Notice Detail</Text>
              {selectedNotice.requires_acknowledgement && !selectedNotice.is_acknowledged && (
                <TouchableOpacity style={[styles.ackBtn]} onPress={async () => {
                  await acknowledgeErpNotice(accessToken, selectedNotice.id);
                  setSelectedNotice(prev => ({ ...prev, is_acknowledged: true }));
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Acknowledge</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
              {detailLoading && <ActivityIndicator style={{ marginVertical: 20 }} color="#6366F1" />}
              {(() => {
                const p = PRIORITY_STYLE[selectedNotice.priority] || PRIORITY_STYLE.normal;
                return (
                  <>
                    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : p.bg }]}>
                      <MaterialIcons name={p.icon} size={18} color={p.color} />
                      <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1, color: p.color }}>{p.label}</Text>
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '800', lineHeight: 30, marginBottom: 6, color: colors.textPrimary }}>{selectedNotice.title}</Text>
                    <Text style={{ fontSize: 12, marginBottom: 16, color: colors.textMuted }}>
                      {selectedNotice.created_at ? new Date(selectedNotice.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                    <Text style={{ fontSize: 15, lineHeight: 24, color: colors.textSecondary }}>{selectedNotice.content || selectedNotice.body || 'No content available.'}</Text>
                    {selectedNotice.attachments?.length > 0 && (
                      <View style={{ marginTop: 24 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', marginBottom: 10, color: colors.textPrimary }}>Attachments</Text>
                        {selectedNotice.attachments.map((file, idx) => (
                          <TouchableOpacity key={idx} style={[styles.attachItem, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleOpenAttachment(file.filename || file)}>
                            <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={{ width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                              <MaterialIcons name="picture-as-pdf" size={20} color="#4338CA" />
                            </LinearGradient>
                            <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: colors.textPrimary }} numberOfLines={1}>{file.filename || file}</Text>
                            <MaterialIcons name="open-in-new" size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </Modal>
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
  unreadBadge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  filterBarWrapper: { paddingVertical: 10 },
  tabContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  filterTabText: { fontSize: 13, lineHeight: 16 },
  listContent: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: 0 },
  priorityStrip: { flexDirection: 'column', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 6, borderRadius: 10, minWidth: 36 },
  priorityLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6366F1', marginTop: 2 },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 14, lineHeight: 20 },
  cardDate: { fontSize: 11, marginTop: 2 },
  cardPreview: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  categoryChip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#6366F1' },
  attachBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  attachText: { fontSize: 11 },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyState: { borderRadius: 20, padding: 32, alignItems: 'center', marginTop: 40, borderWidth: 1, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  modalBack: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  modalHeaderTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  ackBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: '#6366F1' },
  attachItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
});

export default ERPNoticesScreen;
