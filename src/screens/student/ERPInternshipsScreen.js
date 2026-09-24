/**
 * ERPInternshipsScreen.js
 * Student internship portal — browse, apply, and track applications via ERP.
 * Endpoints: GET /api/v1/internships/list, POST /api/v1/internships/apply,
 *            GET /api/v1/internships/applications/me,
 *            GET /api/v1/internships/applications/{id}/certificate
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Alert, RefreshControl, Linking, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getErpInternships, applyForErpInternship, getInternshipCertificateUrl } from '../../data/apiService';
import { getStudentPlacementTrack } from '../../utils/placementReadiness';

const { width } = Dimensions.get('window');

const STATUS_META = {
  open:      { color: '#10B981', bg: '#ECFDF5', label: 'OPEN' },
  closed:    { color: '#6B7280', bg: '#F3F4F6', label: 'CLOSED' },
  approved:  { color: '#6366F1', bg: '#EEF2FF', label: 'APPROVED' },
  pending:   { color: '#F59E0B', bg: '#FEF3C7', label: 'PENDING' },
  rejected:  { color: '#EF4444', bg: '#FEE2E2', label: 'REJECTED' },
  completed: { color: '#8B5CF6', bg: '#F5F3FF', label: 'DONE' },
};

const normalizeCourse = (c) => (c || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const matchesStudentCourse = (item, user) => {
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

  const track = getStudentPlacementTrack(user);

  // 1. Check explicit target course fields
  const itemTarget = item.courses || item.eligible_courses || item.eligibility_course_cd || item.course_cd || item.target_courses;
  if (itemTarget) {
    let targetList = [];
    if (Array.isArray(itemTarget)) {
      targetList = itemTarget.flatMap(t => (t || '').split(/[,;/|]+/));
    } else if (typeof itemTarget === 'string') {
      targetList = itemTarget.split(/[,;/|]+/);
    }
    const normTargets = targetList.map(normalizeCourse).filter(Boolean);
    if (
      normTargets.length > 0 &&
      !normTargets.includes('all') &&
      !normTargets.includes('any') &&
      !normTargets.includes('allcourses') &&
      !normTargets.includes('open')
    ) {
      return normTargets.some(t =>
        userCourses.some(c => t === c || (t.length >= 3 && c.length >= 3 && (t.includes(c) || c.includes(t))))
      );
    }
  }

  // 2. Check domain category and content keywords
  const category = (item.category || '').toUpperCase().trim();
  const fullText = `${item.category || ''} ${item.title || ''} ${item.role || ''} ${item.description || ''} ${item.organization_name || ''} ${item.company || ''} ${item.company_name || ''}`.toLowerCase();

  // Medical student
  if (track === 'medical') {
    if (category === 'MEDICAL' || category === 'HEALTHCARE' || category === 'CLINICAL') return true;
    return fullText.includes('hospital') || fullText.includes('clinical') || fullText.includes('diagnostics') || fullText.includes('mbbs');
  }

  // Pharmacy student (B.Pharm, M.Pharm)
  if (track === 'pharma_healthcare') {
    if (category === 'PHARMA' || category === 'PHARMACY' || category === 'HEALTHCARE') return true;
    return fullText.includes('pharmacy') || fullText.includes('pharma') || fullText.includes('drug') || fullText.includes('formulation') || fullText.includes('clinical');
  }

  // Commerce & Management student (MBA, BBA, B.Com)
  if (track === 'commerce_management') {
    if (
      category === 'MANAGEMENT' ||
      category === 'COMMERCE' ||
      category === 'BUSINESS' ||
      category === 'FINANCE' ||
      category === 'MARKETING' ||
      category === 'HR'
    ) {
      return true;
    }
    const hasManagementKeyword =
      fullText.includes('financial') ||
      fullText.includes('finance') ||
      fullText.includes('audit') ||
      fullText.includes('accounting') ||
      fullText.includes('marketing') ||
      fullText.includes('brand research') ||
      fullText.includes('deloitte') ||
      fullText.includes('nielsen') ||
      fullText.includes('business analyst') ||
      fullText.includes('consulting') ||
      fullText.includes('equity');

    const isExplicitlyTechOrPharma =
      category === 'TECH' ||
      category === 'IT' ||
      category === 'PHARMA' ||
      fullText.includes('dot net') ||
      fullText.includes('c#') ||
      fullText.includes('embedded systems') ||
      fullText.includes('robotics') ||
      fullText.includes('microcontroller') ||
      fullText.includes('pharmacy') ||
      fullText.includes('bio-medical');

    return hasManagementKeyword && !isExplicitlyTechOrPharma;
  }

  // Tech student (B.Tech CS/IT, BCA, MCA)
  if (track === 'tech') {
    if (category === 'TECH' || category === 'IT' || category === 'CSE' || category === 'SOFTWARE' || category === 'AI') return true;
    const isTechKeyword =
      fullText.includes('software') ||
      fullText.includes('developer') ||
      fullText.includes('dot net') ||
      fullText.includes('c#') ||
      fullText.includes('java') ||
      fullText.includes('python') ||
      fullText.includes('cloud') ||
      fullText.includes('aws') ||
      fullText.includes('full stack') ||
      fullText.includes('web development') ||
      fullText.includes('data science') ||
      fullText.includes('embedded') ||
      fullText.includes('robotics') ||
      fullText.includes('iot');

    const isExplicitlyManagementOrPharma =
      category === 'MANAGEMENT' ||
      category === 'COMMERCE' ||
      category === 'PHARMA' ||
      fullText.includes('clinical pharmacy') ||
      fullText.includes('financial audit') ||
      fullText.includes('brand research') ||
      fullText.includes('bio-medical');

    return isTechKeyword && !isExplicitlyManagementOrPharma;
  }

  return true;
};

const InternshipCard = ({ item, isApplied, onApply, onCertificate, isDark, colors }) => {
  const sm = STATUS_META[item.status?.toLowerCase()] || STATUS_META.open;
  const deadline = item.deadline ? new Date(item.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Company / Role header */}
      <View style={styles.cardHeader}>
        <LinearGradient colors={isDark ? ['#1E1B4B', '#312E81'] : ['#EEF2FF', '#E0E7FF']} style={styles.companyIcon}>
          <MaterialIcons name="business" size={22} color={isDark ? '#818CF8' : '#4338CA'} />
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.companyName, { color: colors.textPrimary }]}>{item.company || item.company_name || 'Company'}</Text>
          <Text style={[styles.roleText, { color: colors.textSecondary }]}>{item.role || item.title || 'Internship'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : sm.bg }]}>
          <Text style={[styles.statusText, { color: sm.color }]}>{sm.label}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailRow}>
        {item.duration && (
          <View style={styles.detailChip}>
            <MaterialIcons name="schedule" size={12} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.duration}</Text>
          </View>
        )}
        {item.stipend && (
          <View style={styles.detailChip}>
            <MaterialIcons name="currency-rupee" size={12} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.stipend}</Text>
          </View>
        )}
        {item.location && (
          <View style={styles.detailChip}>
            <MaterialIcons name="location-on" size={12} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.location}</Text>
          </View>
        )}
        {deadline && (
          <View style={styles.detailChip}>
            <MaterialIcons name="event" size={12} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>Deadline: {deadline}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {item.description && (
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>{item.description}</Text>
      )}

      {/* Min CGPA */}
      {item.min_cgpa && (
        <View style={[styles.cgpaChip, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
          <MaterialIcons name="school" size={12} color="#6366F1" />
          <Text style={[styles.cgpaText]}>Min CGPA: {item.min_cgpa}</Text>
        </View>
      )}

      {/* Action row */}
      <View style={styles.actionRow}>
        {isApplied ? (
          <View style={[styles.appliedBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' }]}>
            <MaterialIcons name="check-circle" size={16} color="#10B981" />
            <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 13 }}>Applied</Text>
          </View>
        ) : item.status?.toLowerCase() === 'open' && (
          <TouchableOpacity style={styles.applyBtn} onPress={() => onApply(item)}>
            <MaterialIcons name="send" size={16} color="#fff" />
            <Text style={styles.applyBtnText}>Apply Now</Text>
          </TouchableOpacity>
        )}
        {item.status?.toLowerCase() === 'completed' && (
          <TouchableOpacity style={styles.certBtn} onPress={() => onCertificate(item)}>
            <MaterialIcons name="workspace-premium" size={16} color="#8B5CF6" />
            <Text style={styles.certBtnText}>View Certificate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const ERPInternshipsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken, user } = useUser();

  const [internships, setInternships] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'mine'
  const [applying, setApplying] = useState(null);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const studentCourse = user?.course || user?.course_name || (user?.rollno?.startsWith('20251074') ? 'MBA' : '');
      const studentRegNo = user?.username || user?.rollno || user?.emp_id || user?.id || '';
      const data = await getErpInternships(accessToken, studentCourse, studentRegNo);
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      // Filter opportunities according to logged-in student's course
      const filtered = list.filter(i => matchesStudentCourse(i, user));
      setInternships(filtered);
      // Mark applied ones
      const applied = new Set(filtered.filter(i => i.has_applied || i.my_application).map(i => i.id));
      setAppliedIds(applied);
    } catch (err) {
      console.warn('[ERPInternshipsScreen] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApply = (item) => {
    Alert.alert(
      'Apply for Internship',
      `Apply to ${item.company || 'this company'} for ${item.role || item.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            setApplying(item.id);
            try {
              await applyForErpInternship(accessToken, {
                internship_id: item.id,
                cgpa: user?.cgpa || null,
                reason: `Applying for ${item.role || item.title} at ${item.company || ''}`,
              });
              Alert.alert('✅ Applied!', 'Your application has been submitted successfully.');
              setAppliedIds(prev => new Set([...prev, item.id]));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to apply. Please try again.');
            } finally {
              setApplying(null);
            }
          },
        },
      ]
    );
  };

  const handleCertificate = async (item) => {
    try {
      const url = await getInternshipCertificateUrl(accessToken, item.application_id || item.id);
      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Not Available', 'Certificate is not yet available for this internship.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch certificate URL.');
    }
  };

  const browseList = internships.filter(i => i.status?.toLowerCase() !== 'my_application');
  const myList = internships.filter(i => appliedIds.has(i.id));

  const displayList = activeTab === 'browse' ? browseList : myList;
  const courseLabel = user?.course || user?.course_name || (user?.rollno?.startsWith('20251074') ? 'MBA' : null);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={isDark ? ['#1A1A2E', '#16213E'] : ['#4338CA', '#6366F1']} style={[styles.headerGrad, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Internship Portal</Text>
            <Text style={styles.headerSub}>
              {courseLabel ? `Opportunities for ${courseLabel} · ${browseList.length} listed` : `Opportunities from ERP · ${browseList.length} listed`}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {[
          { key: 'browse', label: 'Browse Opportunities', icon: 'search' },
          { key: 'mine', label: `My Applications (${myList.length})`, icon: 'assignment-turned-in' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && { borderBottomColor: '#6366F1', borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialIcons name={tab.icon} size={16} color={activeTab === tab.key ? '#6366F1' : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === tab.key ? '#6366F1' : colors.textMuted }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Loading internships…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={['#6366F1']} tintColor="#6366F1" />}
        >
          {displayList.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name={activeTab === 'mine' ? 'clipboard-text-outline' : 'briefcase-search-outline'} size={56} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {activeTab === 'mine' ? 'No Applications Yet' : 'No Internships Listed'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                {activeTab === 'mine' ? 'Apply to internships in the Browse tab to see your applications here.' : 'The placement team will post internship opportunities here soon.'}
              </Text>
            </View>
          ) : (
            displayList.map(item => (
              <View key={item.id} style={{ opacity: applying === item.id ? 0.7 : 1 }}>
                {applying === item.id && <ActivityIndicator style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }} color="#6366F1" />}
                <InternshipCard
                  item={item}
                  isApplied={appliedIds.has(item.id)}
                  onApply={handleApply}
                  onCertificate={handleCertificate}
                  isDark={isDark}
                  colors={colors}
                />
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
  headerGrad: { paddingHorizontal: 16, paddingBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '600' },
  listContent: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  companyIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  companyName: { fontSize: 15, fontWeight: '700' },
  roleText: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12 },
  description: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  cgpaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  cgpaText: { fontSize: 12, fontWeight: '600', color: '#6366F1' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  appliedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  certBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#8B5CF6' },
  certBtnText: { color: '#8B5CF6', fontWeight: '700', fontSize: 13 },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyState: { borderRadius: 20, padding: 32, alignItems: 'center', marginTop: 40, borderWidth: 1, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
});

export default ERPInternshipsScreen;
