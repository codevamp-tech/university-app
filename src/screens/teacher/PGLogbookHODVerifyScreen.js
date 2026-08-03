import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  TextInput, Dimensions, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import {
  getPGStudentList,
  getPGHODVerifyList,
  verifyPGHOD,
  getDepartmentFacultyList,
} from '../../data/apiService';

const { width } = Dimensions.get('window');

const BATCH_OPTIONS = ['2023', '2024', '2025'];

const EVENT_OPTIONS = [
  { label: 'All Events', value: '1' },
  { label: 'PG Lecture', value: 'PGLECTURE' },
  { label: 'PG Seminar', value: 'PGSEMINAR' },
  { label: 'PG Tutorial', value: 'PGTUTORIAL' },
  { label: 'PG Clinic', value: 'PGCLINICAL' },
];

const STATUS_OPTIONS = [
  { label: 'Pending', value: '0' },
  { label: 'Verified', value: '1' },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatEntryDate(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && dateVal.includes('/Date(')) {
    const match = dateVal.match(/\/Date\((\d+)\)\//);
    if (match && match[1]) {
      const d = new Date(parseInt(match[1], 10));
      return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    }
  }
  return String(dateVal);
}

function formatSemTime(semTime) {
  if (!semTime) return '';
  if (typeof semTime === 'object') {
    const h = Number(semTime.Hours ?? semTime.hours ?? 0);
    const m = Number(semTime.Minutes ?? semTime.minutes ?? 0);
    if (!isNaN(h) && !isNaN(m)) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const fh = h % 12 === 0 ? 12 : h % 12;
      const fm = m < 10 ? `0${m}` : m;
      return `${fh}:${fm} ${ampm}`;
    }
  }
  return typeof semTime === 'string' ? semTime : '';
}

const PGLogbookHODVerifyScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useUser();

  // ── Filter State ─────────────────────────────────────────────────────────────
  const [selectedBatch, setSelectedBatch] = useState('2023');
  const [department, setDepartment] = useState(() => {
    if (user?.department && user.department !== 'Medical Faculty' && isNaN(Number(user.department))) {
      return user.department;
    }
    return 'MCA';
  });

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  const [selectedEvent, setSelectedEvent] = useState('1');   // 'All' by default
  const [selectedStatus, setSelectedStatus] = useState('1'); // Faculty Verified by default
  const [selectedHodStatus, setSelectedHodStatus] = useState('0'); // HOD Pending by default

  // ── Entries & Loading ─────────────────────────────────────────────────────────
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Verify State ──────────────────────────────────────────────────────────────
  const [selectedEntryIds, setSelectedEntryIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Resolve department from faculty list ──────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function resolveDepart() {
      if (user?.emp_id) {
        try {
          const facList = await getDepartmentFacultyList(user.emp_id);
          if (isMounted && Array.isArray(facList) && facList.length > 0) {
            const me = facList.find(f => String(f.EmpID).toLowerCase() === String(user.emp_id).toLowerCase());
            const resolved = me?.Department || facList[0]?.Department;
            if (resolved) setDepartment(resolved);
          }
        } catch (_) {}
      }
    }
    resolveDepart();
    return () => { isMounted = false; };
  }, [user?.emp_id]);

  // ── Fetch PG Students (same API as PGLogbookVerificationScreen) ──────────────
  const fetchStudents = useCallback(async () => {
    try {
      const data = await getPGStudentList(selectedBatch, department);
      // Deduplicate by roll number to prevent repeated entries
      const seen = new Set();
      const unique = data.filter(s => {
        const key = String(s.EmpID || s.rollno || s.stud_id || '');
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setStudents(unique);
    } catch (err) {
      console.warn('[PGLogbookHOD] fetchStudents err:', err);
    }
  }, [selectedBatch, department]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Load HOD Logbook Entries ──────────────────────────────────────────────────
  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const rollNo = selectedStudent
        ? String(selectedStudent.EmpID || selectedStudent.rollno || '1')
        : '1';

      const payload = {
        sem_type: selectedEvent,
        sem_dept: department,
        colg_cd: '11',
        empid: String(user?.emp_id || ''),
        Roll_No: rollNo,
        Depart: department,
        pend_status: selectedStatus,
        from_date: '0',
        to_date: '0',
        batch: selectedBatch,
      };

      const data = await getPGHODVerifyList(payload);
      setEntries(data);
    } catch (err) {
      console.warn('[PGLogbookHOD] loadEntries err:', err);
      Alert.alert('Error', 'Failed to load HOD logbook verification entries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [department, selectedBatch, user?.emp_id, selectedEvent, selectedStatus, selectedStudent]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const onRefresh = () => { setRefreshing(true); loadEntries(); };

  // ── Entry ID ──────────────────────────────────────────────────────────────────
  const getEntryId = (item) => {
    if (item.pgsemid) return String(item.pgsemid);
    return `${item.rollno}_${item.pgtype}_${item.sem_topic}`;
  };

  // ── Student Picker filtered list ──────────────────────────────────────────────
  const filteredStudents = students.filter(s => {
    const q = studentSearchQuery.toLowerCase();
    const name = String(s.EmpName || s.stud_name || s.name || '').toLowerCase();
    const roll = String(s.EmpID || s.rollno || '').toLowerCase();
    return name.includes(q) || roll.includes(q);
  });

  // ── Selection ─────────────────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedEntryIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Helper to check if entry is verified by HOD: Hod_varification_cd === 1 AND Hod_verify_id has value
  const isEntryHodVerified = (e) => {
    const cd = Number(e.Hod_varification_cd ?? e.Hod_verification_cd ?? 0);
    const id = String(e.Hod_verify_id || '').trim();
    return cd === 1 && id.length > 0;
  };

  // HOD can only act on entries faculty has already verified (sem_status === 1)
  // and that HOD hasn't yet verified
  const hodSelectableEntries = entries.filter(e => e.sem_status === 1 && !isEntryHodVerified(e));

  const hodPendingCount = entries.filter(e => !isEntryHodVerified(e)).length;
  const hodVerifiedCount = entries.filter(e => isEntryHodVerified(e)).length;

  // Client-side filter by HOD verification status:
  // - '0' (HOD Pending): Hod_varification_cd === 0 & no Hod_verify_id
  // - '1' (HOD Verified): Hod_varification_cd === 1 & has Hod_verify_id
  const displayedEntries = selectedHodStatus === '1'
    ? entries.filter(e => isEntryHodVerified(e))
    : entries.filter(e => !isEntryHodVerified(e));

  const isAllSelected = hodSelectableEntries.length > 0 && hodSelectableEntries.every(e => selectedEntryIds.has(getEntryId(e)));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEntryIds(new Set());
    } else {
      setSelectedEntryIds(new Set(hodSelectableEntries.map(e => getEntryId(e))));
    }
  };

  // ── HOD Verify Now ────────────────────────────────────────────────────────────
  const handleVerifyNow = async () => {
    if (selectedEntryIds.size === 0) {
      Alert.alert('No Selection', 'Please select at least one entry to verify.');
      return;
    }

    const toVerify = entries.filter(e => selectedEntryIds.has(getEntryId(e)));
    if (toVerify.length === 0) return;

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      await Promise.all(toVerify.map(async (item) => {
        try {
          const payload = {
            roll_no: String(item.rollno || item.sem_attempt || ''),
            semType: String(item.pgtype || ''),
            HodId: String(user?.emp_id || ''),
            depart: String(department),
            pend_Verf_status: '1',
          };
          await verifyPGHOD(payload);
          successCount++;
        } catch (_) {
          failCount++;
        }
      }));

      Alert.alert(
        'HOD Verification Complete',
        `✅ Verified: ${successCount}${failCount > 0 ? `  ❌ Failed: ${failCount}` : ''}`,
      );

      setSelectedEntryIds(new Set());
      loadEntries();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to complete HOD verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={['#16A34A', '#15803D']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>HOD PG Logbook Verify</Text>
            <Text style={styles.headerSub}>Head of Department Verification</Text>
          </View>
          <TouchableOpacity onPress={loadEntries} style={styles.refreshHeaderBtn}>
            <Ionicons name="reload" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Filter Section ──────────────────────────────────────────────────── */}
      <View style={styles.filterSection}>

        {/* Step 1: Batch Selection */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Batch:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {BATCH_OPTIONS.map(b => (
              <TouchableOpacity
                key={b}
                style={[styles.chip, selectedBatch === b && styles.chipActive]}
                onPress={() => { setSelectedBatch(b); setSelectedStudent(null); }}
              >
                <Text style={[styles.chipText, selectedBatch === b && styles.chipTextActive]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Step 2: Student Selection */}
        <TouchableOpacity style={styles.studentSelectorBtn} onPress={() => setShowStudentPicker(true)}>
          <Ionicons name="person-outline" size={18} color="#16A34A" />
          <Text style={styles.studentSelectorText} numberOfLines={1}>
            {selectedStudent
              ? `${selectedStudent.EmpName || selectedStudent.stud_name} (${selectedStudent.EmpID || selectedStudent.rollno})`
              : `All PG Students (${students.length} Loaded)`}
          </Text>
          {selectedStudent ? (
            <TouchableOpacity onPress={() => setSelectedStudent(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-down" size={18} color="#16A34A" />
          )}
        </TouchableOpacity>

        {/* Step 3: Select Event (sem_type) */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Event:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {EVENT_OPTIONS.map(ev => (
              <TouchableOpacity
                key={ev.value}
                style={[styles.chip, selectedEvent === ev.value && styles.chipActive]}
                onPress={() => setSelectedEvent(ev.value)}
              >
                <Text style={[styles.chipText, selectedEvent === ev.value && styles.chipTextActive]}>{ev.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Step 4: Faculty Verification Status */}
        <View style={[styles.filterRow, { flexWrap: 'wrap' }]}>
          <Text style={[styles.filterLabel, { width: 'auto', marginRight: 4 }]}>Faculty Verification Status:</Text>
          {STATUS_OPTIONS.map(st => (
            <TouchableOpacity
              key={st.value}
              style={[styles.chip, selectedStatus === st.value && styles.chipActive]}
              onPress={() => { setSelectedStatus(st.value); setSelectedEntryIds(new Set()); }}
            >
              <Text style={[styles.chipText, selectedStatus === st.value && styles.chipTextActive]}>{st.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 5: HOD Verification Status (client-side filter) */}
        <View style={[styles.filterRow, { flexWrap: 'wrap' }]}>
          <Text style={[styles.filterLabel, { width: 'auto', marginRight: 4 }]}>HOD Verification Status:</Text>
          {[
            { label: `HOD Pending (${hodPendingCount})`, value: '0' },
            { label: `HOD Verified (${hodVerifiedCount})`, value: '1' }
          ].map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, selectedHodStatus === opt.value && styles.chipActiveHod]}
              onPress={() => { setSelectedHodStatus(opt.value); setSelectedEntryIds(new Set()); }}
            >
              <Text style={[styles.chipText, selectedHodStatus === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bulk Action Bar — only when viewing HOD-pending entries that are faculty-verified */}
      {hodSelectableEntries.length > 0 && selectedStatus === '1' && selectedHodStatus !== '1' && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <View style={styles.bulkActionBar}>
            <TouchableOpacity style={styles.selectAllBtn} onPress={toggleSelectAll} activeOpacity={0.8}>
              <Ionicons
                name={isAllSelected ? 'checkbox' : 'square-outline'}
                size={20}
                color="#16A34A"
              />
              <Text style={styles.selectAllText}>Select All ({hodSelectableEntries.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.verifyNowBtn, selectedEntryIds.size === 0 && styles.verifyNowBtnDisabled]}
              onPress={handleVerifyNow}
              disabled={selectedEntryIds.size === 0 || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="ribbon" size={16} color="#FFF" />
                  <Text style={styles.verifyNowBtnText}>Verify Now ({selectedEntryIds.size})</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Main List ───────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} />}
      >
        {loading && !refreshing ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color="#16A34A" size="large" />
            <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 13 }}>Loading entries...</Text>
          </View>
        ) : displayedEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={54} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Entries Found</Text>
            <Text style={styles.emptySub}>
              No PG logbook entries match the selected filters.
            </Text>
          </View>
        ) : (
          displayedEntries.map((item, index) => {
            const entryId = getEntryId(item);
            const isSelected = selectedEntryIds.has(entryId);
            const isHodVerified = isEntryHodVerified(item);
            const isFacVerified = item.sem_status === 1;
            // HOD can only select entries that faculty has verified and HOD hasn't yet
            const isSelectable = isFacVerified && !isHodVerified;
            const studentName = item.Pg_stud_name || item.EmpName || 'PG Student';
            const dateDisplay = formatEntryDate(item.sem_date);
            const timeDisplay = formatSemTime(item.sem_time);

            return (
              <TouchableOpacity
                key={entryId}
                activeOpacity={isSelectable ? 0.85 : 1}
                onPress={() => isSelectable && toggleSelect(entryId)}
                style={[
                  styles.entryCard,
                  isSelected && styles.entryCardSelected,
                  isHodVerified && styles.entryCardVerified,
                ]}
              >
                {/* Card Header */}
                <View style={styles.entryHeader}>
                  <View style={[styles.avatarCircle, isSelected && styles.avatarCircleSelected]}>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={18} color="#FFF" />
                    ) : (
                      <Text style={styles.avatarText}>
                        {studentName[0]?.toUpperCase() || '?'}
                      </Text>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{studentName}</Text>
                    <Text style={styles.studentMeta}>
                      Roll: {item.rollno || '—'} · Batch: {item.course_cd || selectedBatch}
                    </Text>
                  </View>

                  <View style={styles.badgeRow}>
                    {/* Faculty verification badge */}
                    <View style={[styles.badge, isFacVerified ? styles.badgeFacDone : styles.badgeFacPending]}>
                      <Text style={styles.badgeText}>{isFacVerified ? 'Fac ✓' : 'Fac Pend'}</Text>
                    </View>
                    {/* HOD verification badge */}
                    <View style={[styles.badge, isHodVerified ? styles.badgeHodDone : styles.badgeHodPending]}>
                      <Text style={styles.badgeText}>{isHodVerified ? 'HOD ✓' : 'HOD Pend'}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Entry Details */}
                <View style={{ gap: 3 }}>
                  <Text style={styles.topicTitle}>{item.sem_topic || 'PG Logbook Activity'}</Text>
                  <Text style={styles.topicSub}>
                    Type: {item.pgtype || 'Academic'}
                    {item.fac_grade ? `  ·  Grade: ${item.fac_grade}` : ''}
                  </Text>
                  {(dateDisplay || timeDisplay) ? (
                    <Text style={styles.topicMeta}>
                      {dateDisplay ? `Date: ${dateDisplay}` : ''}
                      {dateDisplay && timeDisplay ? '  ·  ' : ''}
                      {timeDisplay ? `Time: ${timeDisplay}` : ''}
                    </Text>
                  ) : null}
                  {item.remarks ? (
                    <Text style={styles.remarkText}>"{item.remarks}"</Text>
                  ) : null}
                  {item.sem_verified_by ? (
                    <Text style={styles.topicMeta}>Verified by: {item.sem_verified_by}</Text>
                  ) : null}
                  {item.Hod_verify_id ? (
                    <Text style={styles.topicMeta}>HOD: {item.Hod_verify_id}</Text>
                  ) : null}
                </View>

                {/* Tap hint for pending entries */}
                {!isHodVerified && (
                  <Text style={styles.tapHint}>
                    {isSelected ? '✓ Selected for verification' : 'Tap to select'}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ── Student Picker Modal ─────────────────────────────────────────────── */}
      <Modal visible={showStudentPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select PG Student</Text>
              <TouchableOpacity onPress={() => setShowStudentPicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search student name or roll..."
                value={studentSearchQuery}
                onChangeText={setStudentSearchQuery}
              />
            </View>

            <TouchableOpacity
              style={[styles.pickerItem, !selectedStudent && styles.pickerItemActive]}
              onPress={() => { setSelectedStudent(null); setShowStudentPicker(false); }}
            >
              <Ionicons name="people-circle-outline" size={28} color="#16A34A" />
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerItemName}>All Students</Text>
                <Text style={styles.pickerItemRoll}>Batch {selectedBatch} · {students.length} students</Text>
              </View>
              {!selectedStudent && <Ionicons name="checkmark-circle" size={20} color="#16A34A" />}
            </TouchableOpacity>

            <View style={styles.pickerDivider} />

            <FlatList
              data={filteredStudents}
              keyExtractor={(item, idx) => `${String(item.EmpID || item.rollno || item.stud_id || 'u')}_${idx}`}
              renderItem={({ item }) => {
                const isSel = selectedStudent &&
                  String(selectedStudent.EmpID || selectedStudent.rollno) === String(item.EmpID || item.rollno);
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, isSel && styles.pickerItemActive]}
                    onPress={() => { setSelectedStudent(item); setShowStudentPicker(false); }}
                  >
                    <Ionicons name="person-circle-outline" size={28} color="#16A34A" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerItemName}>{item.EmpName || item.stud_name}</Text>
                      <Text style={styles.pickerItemRoll}>Roll: {item.EmpID || item.rollno}</Text>
                    </View>
                    {isSel && <Ionicons name="checkmark-circle" size={20} color="#16A34A" />}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.pickerDivider} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  refreshHeaderBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  filterSection: { backgroundColor: '#FFF', padding: 12, borderBottomWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  filterRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#374151', width: 50 },

  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  chipActiveHod: { backgroundColor: '#D97706', borderColor: '#D97706' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  chipTextActive: { color: '#FFF' },

  studentSelectorBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  studentSelectorText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#16A34A' },

  bulkActionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectAllText: { fontSize: 13, fontWeight: '700', color: '#15803D' },
  verifyNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#16A34A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  verifyNowBtnDisabled: { backgroundColor: '#9CA3AF' },
  verifyNowBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },

  entryCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2, gap: 10 },
  entryCardSelected: { borderColor: '#16A34A', borderWidth: 2, backgroundColor: '#F0FDF4' },
  entryCardVerified: { backgroundColor: '#F9FAFB', borderColor: '#D1FAE5' },

  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  avatarCircleSelected: { backgroundColor: '#15803D' },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  studentMeta: { fontSize: 11, color: '#6B7280' },

  badgeRow: { gap: 4, alignItems: 'flex-end' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeFacDone: { backgroundColor: '#D1FAE5' },
  badgeFacPending: { backgroundColor: '#FEF3C7' },
  badgeHodDone: { backgroundColor: '#DCFCE7' },
  badgeHodPending: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#374151' },

  divider: { height: 1, backgroundColor: '#F3F4F6' },
  topicTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  topicSub: { fontSize: 12, color: '#6B7280' },
  topicMeta: { fontSize: 11, color: '#9CA3AF' },
  remarkText: { fontSize: 12, fontStyle: 'italic', color: '#4B5563', backgroundColor: '#F9FAFB', padding: 6, borderRadius: 6 },
  tapHint: { fontSize: 11, color: '#16A34A', fontWeight: '600', textAlign: 'right', marginTop: 4 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 30, marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', paddingHorizontal: 12, borderRadius: 10, marginBottom: 12 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#1F2937' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  pickerItemActive: { backgroundColor: '#F0FDF4' },
  pickerItemName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  pickerItemRoll: { fontSize: 12, color: '#6B7280' },
  pickerDivider: { height: 1, backgroundColor: '#F3F4F6' },
});

export default PGLogbookHODVerifyScreen;
