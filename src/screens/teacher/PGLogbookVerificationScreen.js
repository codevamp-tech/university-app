import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  TextInput, Dimensions, Animated, ActivityIndicator, Alert, Modal, FlatList,
  KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform
} from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import {
  getPGStudentList,
  getPGVerificationEntries,
  updatePGLogbookVerify,
  savePGStudentAbsent,
  getDepartmentFacultyList,
} from '../../data/apiService';

const { width } = Dimensions.get('window');

const BATCH_OPTIONS = ['2023', '2024', '2025'];

const GRADE_OPTIONS = [
  { value: 'A', label: 'A Grade / 10 Exceptional Outstanding' },
  { value: 'B', label: 'B Grade / 8-9 Outstanding' },
  { value: 'C', label: 'C Grade / 6-7 Above Average' },
  { value: 'D', label: 'D Grade / 4-5 Average' },
  { value: 'E', label: 'E Grade / 2-3 Below Average' },
  { value: 'F', label: 'F Grade / 1 Poor' },
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const CalendarPickerModal = ({ visible, title, initialDateStr, onSelectDate, onClose }) => {
  const parseInitialDate = (str) => {
    if (str && str.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  };

  const [date, setDate] = useState(() => parseInitialDate(initialDateStr));
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());

  useEffect(() => {
    if (visible) {
      const d = parseInitialDate(initialDateStr);
      setDate(d);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [visible, initialDateStr]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMon = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const isSelected = (d) =>
    d && date.getDate() === d && date.getMonth() === viewMonth && date.getFullYear() === viewYear;

  const handleSelectDay = (d) => {
    if (!d) return;
    const year = viewYear;
    const month = String(viewMonth + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    onSelectDate(formatted);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={calStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={calStyles.sheet}>
          <View style={calStyles.header}>
            <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-back" size={20} color="#7C3AED" />
            </TouchableOpacity>
            <Text style={calStyles.monthLabel}>{title || 'Select Date'}: {MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
            </TouchableOpacity>
          </View>

          <View style={calStyles.dayRow}>
            {DAY_NAMES.map(d => (
              <Text key={d} style={calStyles.dayLabel}>{d}</Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={calStyles.weekRow}>
              {week.map((day, di) => {
                const sel = isSelected(day);
                return (
                  <TouchableOpacity
                    key={di}
                    style={[calStyles.dayCell, sel && calStyles.dayCellSelected]}
                    onPress={() => handleSelectDay(day)}
                    activeOpacity={day ? 0.7 : 1}
                  >
                    <Text style={[calStyles.dayCellText, sel && calStyles.dayCellTextSelected, !day && { opacity: 0 }]}>
                      {day || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const SkeletonBlock = ({ width: w, height, borderRadius = 8, style }) => {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[{ width: w, height, borderRadius, backgroundColor: '#E5E7EB', opacity: anim }, style]} />
  );
};

const PGLogbookVerificationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useUser();

  // Filter states
  const [selectedBatch, setSelectedBatch] = useState('2023');
  const [department, setDepartment] = useState(() => {
    if (user?.department && user.department !== 'Medical Faculty' && isNaN(Number(user.department))) {
      return user.department;
    }
    return 'PHYSIOLOGY';
  });
  const [pendStatus, setPendStatus] = useState('0'); // 0: Pending, 1: Verified, 2: All
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('ALL'); // 'ALL', 'A', 'B', 'C', 'D', 'E', 'F'
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL'); // Filter by PG Activity Type
  const [selectedStudent, setSelectedStudent] = useState(null); // null means All Students, or object { EmpID, EmpName, rollno, stud_name }
  const [students, setStudents] = useState([]);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Scroll Refs for keyboard auto-scroll
  const verifyScrollRef = useRef(null);
  const bulkScrollRef = useRef(null);

  // Date filters & picker modals
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showDateFilters, setShowDateFilters] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Logbook entries & status counts
  const [entries, setEntries] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Verification modal state
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [grade, setGrade] = useState('A');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk verification state
  const [selectedEntryIds, setSelectedEntryIds] = useState(new Set());
  const [showBulkVerifyModal, setShowBulkVerifyModal] = useState(false);
  const [bulkGrade, setBulkGrade] = useState('A');
  const [bulkRemarks, setBulkRemarks] = useState('');

  // Absent modal state
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [absentRemarks, setAbsentRemarks] = useState('Absent in session');

  // Dynamically resolve exact department name from SRMS faculty list if generic or unset
  useEffect(() => {
    let isMounted = true;
    async function resolveFacultyDepartment() {
      if (user?.emp_id) {
        try {
          const facList = await getDepartmentFacultyList(user.emp_id);
          if (isMounted && Array.isArray(facList) && facList.length > 0) {
            const me = facList.find(f => String(f.EmpID).toLowerCase() === String(user.emp_id).toLowerCase());
            const resolvedDept = me?.Department || facList[0]?.Department;
            if (resolvedDept) {
              setDepartment(resolvedDept);
            }
          }
        } catch (err) {
          console.warn('[PGLogbookVerification] Department resolution error:', err);
        }
      }
    }
    resolveFacultyDepartment();
    return () => { isMounted = false; };
  }, [user?.emp_id]);

  // Load PG students for batch & department via stud_name_select
  const fetchStudents = useCallback(async () => {
    try {
      const data = await getPGStudentList(selectedBatch, department);
      setStudents(data);
    } catch (err) {
      console.warn('[PGLogbookVerification] fetchStudents err:', err);
    }
  }, [selectedBatch, department]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Load logbook entries for verification via getFillterverificationByFaculty1 (fetches all for batch)
  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const basePayload = {
        sem_dept: department,
        colg_cd: '11',
        batch: selectedBatch,
        rollno: 'all',
        hodid: String(user?.emp_id || ''),
        Depart: department,
        From_Date: fromDate || '',
        to_Date: toDate || '',
      };

      const [pendingRes, verifiedRes] = await Promise.all([
        getPGVerificationEntries({ ...basePayload, pend_status: '0' }),
        getPGVerificationEntries({ ...basePayload, pend_status: '1' }),
      ]);

      const pendingList = Array.isArray(pendingRes) ? pendingRes : [];
      const allProcessed = Array.isArray(verifiedRes) ? verifiedRes : [];

      const absentList = allProcessed.filter(item => {
        const gradeVal = String(item.fac_grade || item.gradfac || '').trim().toUpperCase();
        const rem = String(item.remarks || '').trim().toLowerCase();
        const mark = String(item.Mark || item.atten || '').trim().toLowerCase();
        return gradeVal === 'F' || rem.includes('absent') || mark.includes('absent');
      });

      const verifiedList = allProcessed.filter(item => {
        const gradeVal = String(item.fac_grade || item.gradfac || '').trim().toUpperCase();
        const rem = String(item.remarks || '').trim().toLowerCase();
        const mark = String(item.Mark || item.atten || '').trim().toLowerCase();
        return !(gradeVal === 'F' || rem.includes('absent') || mark.includes('absent'));
      });

      setPendingCount(pendingList.length);
      setVerifiedCount(verifiedList.length);
      setAbsentCount(absentList.length);

      if (pendStatus === '0') {
        setEntries(pendingList);
      } else if (pendStatus === '1') {
        setEntries(verifiedList);
      } else if (pendStatus === 'ABSENT') {
        setEntries(absentList);
      } else {
        setEntries([...pendingList, ...allProcessed]);
      }
    } catch (err) {
      console.warn('[PGLogbookVerification] loadEntries err:', err);
      Alert.alert('Error', 'Failed to load PG logbook verification entries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [department, selectedBatch, user?.emp_id, pendStatus, fromDate, toDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  // Helper to format /Date(...)/ timestamp
  const formatEntryDate = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string' && dateVal.includes('/Date(')) {
      const match = dateVal.match(/\/Date\((\d+)\)\//);
      if (match && match[1]) {
        const d = new Date(parseInt(match[1], 10));
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    return String(dateVal);
  };

  // Helper to format sem_time (C# TimeSpan object or string)
  const formatSemTime = (semTime) => {
    if (!semTime) return '';
    if (typeof semTime === 'object') {
      const hours = semTime.Hours ?? semTime.hours;
      const minutes = semTime.Minutes ?? semTime.minutes;
      if (hours !== undefined && minutes !== undefined) {
        const h = Number(hours);
        const m = Number(minutes);
        if (!isNaN(h) && !isNaN(m)) {
          const ampm = h >= 12 ? 'PM' : 'AM';
          const formattedHours = h % 12 === 0 ? 12 : h % 12;
          const formattedMinutes = m < 10 ? `0${m}` : m;
          return `${formattedHours}:${formattedMinutes} ${ampm}`;
        }
      }
    }
    if (typeof semTime === 'string') {
      return semTime;
    }
    return '';
  };

  // Open Verify Modal
  const handleOpenVerify = (entry) => {
    setSelectedEntry(entry);
    setGrade(''); // Unselected by default so selection is mandatory
    setRemarks('');
    setShowVerifyModal(true);
  };

  // Submit Verification
  const handleConfirmVerify = async () => {
    if (!selectedEntry) return;
    if (!grade || grade === '0') {
      Alert.alert('Grade Required', 'Please select a grade for the student before saving.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        pgrollno: String(selectedEntry.rollno || selectedEntry.stud_rollno || selectedEntry.EmpID || ''),
        pgtype: String(selectedEntry.pgtype || selectedEntry.lb_type || ''),
        empid: String(user?.emp_id || selectedEntry.underfacid || ''),
        sem_dept: String(department),
        username: String(user?.emp_id || selectedEntry.underfacid || ''),
        pgemp: String(selectedEntry.pgsemid || selectedEntry.id || ''), // pgemp is pgsemid!
        remarks: remarks || 'Verified by Faculty',
        gradfac: grade,
      };

      await updatePGLogbookVerify(payload);
      Alert.alert('Success', 'PG Logbook entry verified successfully!');
      setShowVerifyModal(false);

      // Optimistically update counts and entry list immediately
      const entryId = getEntryId(selectedEntry);
      setEntries(prev => prev.filter(e => getEntryId(e) !== entryId));
      setPendingCount(prev => Math.max(0, prev - 1));
      setVerifiedCount(prev => prev + 1);
      loadEntries();
    } catch (err) {
      Alert.alert('Verification Failed', err.message || 'Failed to verify entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Absent Modal
  const handleOpenAbsent = (entry) => {
    setSelectedEntry(entry);
    setAbsentRemarks('Absent in session');
    setShowAbsentModal(true);
  };

  // Submit Absent
  const handleConfirmAbsent = async () => {
    if (!selectedEntry) return;
    setIsSubmitting(true);
    try {
      const payload = {
        pgrollno: String(selectedEntry.rollno || selectedEntry.stud_rollno || selectedEntry.EmpID || ''),
        pgtype: String(selectedEntry.pgtype || selectedEntry.lb_type || ''),
        empid: String(user?.emp_id || selectedEntry.underfacid || ''),
        sem_dept: String(department),
        username: String(user?.emp_id || selectedEntry.underfacid || ''),
        pgemp: String(selectedEntry.pgsemid || selectedEntry.id || ''), // pgemp is pgsemid!
        remarks: absentRemarks || 'Marked Absent',
        gradfac: 'F', // Grade F represents Absent
      };

      await updatePGLogbookVerify(payload);
      Alert.alert('Success', 'Student marked absent for this entry.');
      setShowAbsentModal(false);

      // Optimistically update counts and entry list immediately
      const entryId = getEntryId(selectedEntry);
      setEntries(prev => prev.filter(e => getEntryId(e) !== entryId));
      setPendingCount(prev => Math.max(0, prev - 1));
      setAbsentCount(prev => prev + 1);

      loadEntries();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to mark student absent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudentsForPicker = students.filter(s => {
    const q = studentSearchQuery.toLowerCase();
    const name = String(s.stud_name || s.EmpName || s.name || '').toLowerCase();
    const roll = String(s.rollno || s.EmpID || s.stud_id || '').toLowerCase();
    return name.includes(q) || roll.includes(q);
  });

  // Client & API dual filtering for selected student & grade
  const displayedEntries = entries.filter(item => {
    // 1. Student selection filter
    if (selectedStudent) {
      const targetRoll = String(selectedStudent.rollno || selectedStudent.EmpID || selectedStudent.stud_id || '').trim().toLowerCase();
      const itemRoll = String(item.rollno || item.stud_rollno || item.EmpID || item.pgrollno || '').trim().toLowerCase();
      const targetName = String(selectedStudent.stud_name || selectedStudent.EmpName || selectedStudent.name || '').trim().toLowerCase();
      const itemName = String(item.Pg_stud_name || item.stud_name || item.student_name || item.EmpName || '').trim().toLowerCase();

      const rollMatches = targetRoll && itemRoll && itemRoll === targetRoll;
      const nameMatches = targetName && itemName && (itemName.includes(targetName) || targetName.includes(itemName));
      if (!rollMatches && !nameMatches) return false;
    }

    // 2. Grade filter (when grade filter is selected and item has a grade)
    if (selectedGradeFilter !== 'ALL') {
      const itemGrade = String(item.fac_grade || item.gradfac || '').trim().toUpperCase();
      if (itemGrade !== selectedGradeFilter) return false;
    }

    // 3. Type filter (when type filter is selected)
    if (selectedTypeFilter !== 'ALL') {
      const itemType = String(item.pgtype || item.lb_type || '').trim().toLowerCase();
      const targetType = selectedTypeFilter.trim().toLowerCase();
      if (itemType !== targetType) return false;
    }

    return true;
  });

  // Extract unique activity types dynamically from entries
  const availableTypes = useMemo(() => {
    const typesSet = new Set();
    entries.forEach(item => {
      const t = String(item.pgtype || item.lb_type || '').trim();
      if (t) typesSet.add(t);
    });
    const list = Array.from(typesSet).sort();
    return ['ALL', ...list];
  }, [entries]);

  const getEntryId = (item) => {
    if (!item) return '';
    if (item.pgsemid) return String(item.pgsemid);
    if (item.id) return String(item.id);
    const roll = item.rollno || item.stud_rollno || item.EmpID || '';
    const type = item.pgtype || item.lb_type || '';
    const topic = item.sem_topic || item.topic || '';
    return `${roll}_${type}_${topic}`;
  };

  const toggleSelectEntry = (entryId) => {
    setSelectedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const pendingDisplayedEntries = displayedEntries.filter(item => {
    const gradeVal = item.fac_grade || item.gradfac || '';
    return !(item.sem_status === 1 || item.status === '1' || item.verified === true || Boolean(gradeVal));
  });

  const isAllSelected = pendingDisplayedEntries.length > 0 && pendingDisplayedEntries.every((item) => selectedEntryIds.has(getEntryId(item)));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEntryIds(new Set());
    } else {
      const allIds = new Set(pendingDisplayedEntries.map(item => getEntryId(item)));
      setSelectedEntryIds(allIds);
    }
  };

  const handleConfirmBulkVerify = async () => {
    if (selectedEntryIds.size === 0) return;
    if (!bulkGrade || bulkGrade === '0') {
      Alert.alert('Grade Required', 'Please select a grade for batch verification.');
      return;
    }

    const selectedEntriesToVerify = entries.filter(item => selectedEntryIds.has(getEntryId(item)));
    if (selectedEntriesToVerify.length === 0) {
      Alert.alert('No Selection', 'Selected items could not be found. Please try selecting again.');
      return;
    }

    setIsSubmitting(true);
    try {
      let successCount = 0;
      let failCount = 0;

      await Promise.all(selectedEntriesToVerify.map(async (item) => {
        try {
          const payload = {
            pgrollno: String(item.rollno || item.stud_rollno || item.EmpID || ''),
            pgtype: String(item.pgtype || item.lb_type || ''),
            empid: String(user?.emp_id || item.underfacid || ''),
            sem_dept: String(department),
            username: String(user?.emp_id || item.underfacid || ''),
            pgemp: String(item.pgsemid || item.id || ''), // pgemp is pgsemid!
            remarks: bulkRemarks || 'Verified by Faculty',
            gradfac: bulkGrade,
          };
          await updatePGLogbookVerify(payload);
          successCount++;
        } catch (err) {
          console.warn('[PGLogbookVerification] bulk verify item err:', err);
          failCount++;
        }
      }));

      Alert.alert('Batch Verification Complete', `Successfully verified ${successCount} entry(s).${failCount > 0 ? ` Failed: ${failCount}` : ''}`);
      setShowBulkVerifyModal(false);

      const verifiedIds = new Set(selectedEntriesToVerify.map(item => getEntryId(item)));
      setSelectedEntryIds(new Set());

      // Optimistically update counts and entry list immediately
      if (successCount > 0) {
        setPendingCount(prev => Math.max(0, prev - successCount));
        setVerifiedCount(prev => prev + successCount);
        setEntries(prev => prev.filter(item => !verifiedIds.has(getEntryId(item))));
      }

      loadEntries();
    } catch (err) {
      Alert.alert('Verification Failed', err.message || 'Failed to complete batch verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={['#7C3AED', '#6D28D9']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>PG Logbook Verification</Text>
            <Text style={styles.headerSub}>Verify PG Residents & Student Logbooks</Text>
          </View>
          <TouchableOpacity onPress={loadEntries} style={styles.refreshHeaderBtn}>
            <Ionicons name="reload" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        {/* Step 1: Batch Selection */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Batch:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {BATCH_OPTIONS.map(b => (
              <TouchableOpacity
                key={b}
                style={[styles.chip, selectedBatch === b && styles.chipActive]}
                onPress={() => {
                  setSelectedBatch(b);
                  setSelectedStudent(null); // Reset student selection when switching batch
                }}
              >
                <Text style={[styles.chipText, selectedBatch === b && styles.chipTextActive]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Step 2: Student Selection */}
        <TouchableOpacity style={styles.studentSelectorBtn} onPress={() => setShowStudentPicker(true)}>
          <Ionicons name="person-outline" size={18} color="#7C3AED" />
          <Text style={styles.studentSelectorText} numberOfLines={1}>
            {selectedStudent
              ? `${selectedStudent.stud_name || selectedStudent.EmpName || selectedStudent.name} (${selectedStudent.rollno || selectedStudent.EmpID})`
              : `All PG Students / Residents (${students.length} Loaded)`}
          </Text>
          {selectedStudent ? (
            <TouchableOpacity onPress={() => setSelectedStudent(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-down" size={18} color="#7C3AED" />
          )}
        </TouchableOpacity>

        {/* Step 3: Status & Date Filters */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {[
              { label: `Pending (${pendingCount})`, val: '0' },
              { label: `Verified (${verifiedCount})`, val: '1' },
              { label: `Absent (${absentCount})`, val: 'ABSENT' },
              { label: `All (${pendingCount + verifiedCount + absentCount})`, val: '2' },
            ].map(st => (
              <TouchableOpacity
                key={st.val}
                style={[styles.chip, pendStatus === st.val && styles.chipActive]}
                onPress={() => {
                  setPendStatus(st.val);
                  if (st.val === '0' || st.val === 'ABSENT') setSelectedGradeFilter('ALL');
                }}
              >
                <Text style={[styles.chipText, pendStatus === st.val && styles.chipTextActive]}>{st.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.chip, (fromDate || toDate) && styles.chipActive]}
            onPress={() => setShowDateFilters(prev => !prev)}
          >
            <Ionicons name="calendar-outline" size={14} color={fromDate || toDate ? '#FFF' : '#4B5563'} />
          </TouchableOpacity>
        </View>

        {/* Step 4: Grade Filter (Visible when viewing Verified or All) */}
        {(pendStatus === '1' || pendStatus === '2') && (
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Grade:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {[
                { label: 'All Grades', val: 'ALL' },
                { label: 'Grade A', val: 'A' },
                { label: 'Grade B', val: 'B' },
                { label: 'Grade C', val: 'C' },
                { label: 'Grade D', val: 'D' },
                { label: 'Grade E', val: 'E' },
                { label: 'Grade F', val: 'F' },
              ].map(g => (
                <TouchableOpacity
                  key={g.val}
                  style={[styles.chip, selectedGradeFilter === g.val && styles.chipActive]}
                  onPress={() => setSelectedGradeFilter(g.val)}
                >
                  <Text style={[styles.chipText, selectedGradeFilter === g.val && styles.chipTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Step 5: Type Filter */}
        {availableTypes.length > 1 && (
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {availableTypes.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, selectedTypeFilter === t && styles.chipActive]}
                  onPress={() => setSelectedTypeFilter(t)}
                >
                  <Text style={[styles.chipText, selectedTypeFilter === t && styles.chipTextActive]}>
                    {t === 'ALL' ? 'All Types' : t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Date Inputs expandable */}
        {showDateFilters && (
          <View style={styles.dateInputRow}>
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowFromPicker(true)}>
              <Text style={styles.dateInputLabel}>From Date:</Text>
              <View style={styles.dateBtnInner}>
                <Ionicons name="calendar-outline" size={14} color="#7C3AED" />
                <Text style={styles.dateBtnText}>{fromDate || 'Select Date'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowToPicker(true)}>
              <Text style={styles.dateInputLabel}>To Date:</Text>
              <View style={styles.dateBtnInner}>
                <Ionicons name="calendar-outline" size={14} color="#7C3AED" />
                <Text style={styles.dateBtnText}>{toDate || 'Select Date'}</Text>
              </View>
            </TouchableOpacity>

            {(fromDate || toDate) && (
              <TouchableOpacity
                style={styles.clearDateBtn}
                onPress={() => { setFromDate(''); setToDate(''); }}
              >
                <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Bulk Action Bar — only for authorised verifiers (pg_verify = 2) */}
      {user?.pg_verify === 2 && pendStatus === '0' && pendingDisplayedEntries.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <View style={styles.bulkActionBar}>
            <TouchableOpacity style={styles.selectAllBtn} onPress={toggleSelectAll} activeOpacity={0.8}>
              <Ionicons
                name={isAllSelected ? "checkbox" : "square-outline"}
                size={20}
                color="#7C3AED"
              />
              <Text style={styles.selectAllText}>Select All ({pendingDisplayedEntries.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bulkVerifyBtn,
                selectedEntryIds.size === 0 && styles.bulkVerifyBtnDisabled
              ]}
              onPress={() => {
                if (selectedEntryIds.size === 0) {
                  Alert.alert('No Selection', 'Please select at least one logbook entry to verify.');
                  return;
                }
                setBulkGrade('A');
                setBulkRemarks('');
                setShowBulkVerifyModal(true);
              }}
              disabled={selectedEntryIds.size === 0}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done-circle" size={18} color="#FFF" />
              <Text style={styles.bulkVerifyBtnText}>Verify Selected ({selectedEntryIds.size})</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main List */}
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} />}
      >
        {loading && !refreshing ? (
          <View style={{ gap: 12 }}>
            <SkeletonBlock width="100%" height={100} borderRadius={12} />
            <SkeletonBlock width="100%" height={100} borderRadius={12} />
            <SkeletonBlock width="100%" height={100} borderRadius={12} />
          </View>
        ) : displayedEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={54} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Logbook Entries Found</Text>
            <Text style={styles.emptySub}>
              {pendStatus === '0'
                ? 'No pending PG logbook entries found for verification.'
                : 'No entries match the selected filters.'}
            </Text>
          </View>
        ) : (
          displayedEntries.map((item, index) => {
            const entryId = getEntryId(item, index);
            const isSelected = selectedEntryIds.has(entryId);
            const studentName = item.Pg_stud_name || item.stud_name || item.student_name || item.EmpName || 'PG Student';
            const gradeVal = item.fac_grade || item.gradfac || '';
            const isVerified = item.sem_status === 1 || item.status === '1' || item.verified === true || Boolean(gradeVal);
            const dateDisplay = formatEntryDate(item.sem_date || item.entry_date);
            const timeDisplay = formatSemTime(item.sem_time || item.time_slot);

            return (
              <View key={entryId} style={[styles.entryCard, isSelected && styles.entryCardSelected]}>
                <View style={styles.entryHeader}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
                    onPress={() => !isVerified && toggleSelectEntry(entryId)}
                    disabled={isVerified}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.studentAvatarCircle, isSelected && styles.studentAvatarCircleSelected]}>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={20} color="#FFF" />
                      ) : (
                        <Text style={styles.studentAvatarText}>
                          {studentName[0].toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryStudentName}>{studentName}</Text>
                      <Text style={styles.entryStudentMeta}>
                        EmpID / Roll: {item.rollno || item.stud_rollno || item.EmpID || '—'} • Batch: {item.course_cd || item.batch || selectedBatch}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={[styles.statusBadge, isVerified ? styles.badgeVerified : styles.badgePending]}>
                    <Text style={[styles.statusBadgeText, isVerified ? styles.badgeTextVerified : styles.badgeTextPending]}>
                      {isVerified ? (gradeVal ? `Grade: ${gradeVal}` : 'Verified') : 'Pending'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Entry Details */}
                <View style={{ gap: 4 }}>
                  <Text style={styles.topicTitle}>{item.sem_topic || item.topic || item.activity_title || 'PG Logbook Activity'}</Text>
                  {(() => {
                    const kp = item.keypoints || item.key_points || item.KeyPoints || item.keyPoints;
                    if (kp && String(kp).trim() !== '' && String(kp).trim().toLowerCase() !== 'null') {
                      return (
                        <View style={styles.keypointsContainer}>
                          <Text style={styles.keypointsLabel}>Key Points:</Text>
                          <ScrollView style={styles.keypointsScroll} nestedScrollEnabled showsVerticalScrollIndicator>
                            <Text style={styles.keypointsText}>{String(kp).trim()}</Text>
                          </ScrollView>
                        </View>
                      );
                    }
                    return null;
                  })()}
                  <Text style={styles.topicSub}>Type: {item.pgtype || item.lb_type || 'Academic'}</Text>
                  {(dateDisplay || timeDisplay) ? (
                    <Text style={styles.topicMeta}>
                      {dateDisplay ? `Date: ${dateDisplay}` : ''}{dateDisplay && timeDisplay ? ' • ' : ''}{timeDisplay ? `Time: ${timeDisplay}` : ''}
                    </Text>
                  ) : null}
                  {item.remarks ? (
                    <Text style={styles.remarkText}>Remark: "{item.remarks}"</Text>
                  ) : null}
                </View>

                {/* Action Buttons — only visible for authorised verifiers (pg_verify = 2) */}
                {!isVerified && user?.pg_verify === 2 && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnVerify]}
                      onPress={() => handleOpenVerify(item)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                      <Text style={styles.btnVerifyText}>Verify & Grade</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnAbsent]}
                      onPress={() => handleOpenAbsent(item)}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                      <Text style={styles.btnAbsentText}>Mark Absent</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Student Picker Modal */}
      <Modal visible={showStudentPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select PG Student / Resident</Text>
              <TouchableOpacity onPress={() => setShowStudentPicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search PG student name or EmpID..."
                value={studentSearchQuery}
                onChangeText={setStudentSearchQuery}
              />
            </View>

            {/* Option to Select All Students */}
            <TouchableOpacity
              style={[styles.pickerItem, !selectedStudent && styles.pickerItemActive]}
              onPress={() => {
                setSelectedStudent(null);
                setShowStudentPicker(false);
              }}
            >
              <Ionicons name="people-circle-outline" size={28} color="#7C3AED" />
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerItemName}>All Students (Show All Entries)</Text>
                <Text style={styles.pickerItemRoll}>Batch {selectedBatch} • {students.length} PG Residents</Text>
              </View>
              {!selectedStudent && <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />}
            </TouchableOpacity>

            <View style={styles.pickerDivider} />

            <FlatList
              data={filteredStudentsForPicker}
              keyExtractor={(item, idx) => String(item.EmpID || item.stud_id || item.rollno || idx)}
              renderItem={({ item }) => {
                const isSelected = selectedStudent && String(selectedStudent.rollno || selectedStudent.EmpID) === String(item.rollno || item.EmpID);
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    onPress={() => {
                      setSelectedStudent(item);
                      setShowStudentPicker(false);
                    }}
                  >
                    <Ionicons name="person-circle-outline" size={28} color="#7C3AED" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerItemName}>{item.stud_name || item.EmpName || item.name}</Text>
                      <Text style={styles.pickerItemRoll}>EmpID / Roll: {item.EmpID || item.rollno || item.stud_id}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.pickerDivider} />}
            />
          </View>
        </View>
      </Modal>

      {/* Verify & Grade Modal */}
      <Modal visible={showVerifyModal} animationType="fade" transparent={true} onRequestClose={() => setShowVerifyModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={Keyboard.dismiss}
          />
          <View style={styles.modalContent}>
            <ScrollView
              ref={verifyScrollRef}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Verify & Assign Grade</Text>
                <TouchableOpacity onPress={() => setShowVerifyModal(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              {selectedEntry && (
                <View style={styles.selectedEntryPreview}>
                  <Text style={styles.previewStudent}>
                    {selectedEntry.Pg_stud_name || selectedEntry.stud_name || selectedEntry.student_name || selectedEntry.EmpName || 'PG Student'}
                  </Text>
                  <Text style={styles.previewTopic}>
                    {selectedEntry.sem_topic || selectedEntry.topic || selectedEntry.activity_title || 'Logbook Activity'}
                  </Text>
                  {(() => {
                    const kp = selectedEntry.keypoints || selectedEntry.key_points || selectedEntry.KeyPoints || selectedEntry.keyPoints;
                    if (kp && String(kp).trim() !== '' && String(kp).trim().toLowerCase() !== 'null') {
                      return (
                        <View style={styles.keypointsContainerModal}>
                          <Text style={styles.keypointsLabel}>Key Points:</Text>
                          <ScrollView style={{ maxHeight: 80 }} nestedScrollEnabled showsVerticalScrollIndicator>
                            <Text style={styles.keypointsText}>{String(kp).trim()}</Text>
                          </ScrollView>
                        </View>
                      );
                    }
                    return null;
                  })()}
                </View>
              )}

              <Text style={styles.inputLabel}>Select Grade <Text style={{ color: '#DC2626' }}>*</Text></Text>
              <View style={styles.gradeChipModalRow}>
                {GRADE_OPTIONS.map(g => {
                  const isSelected = grade === g.value;
                  return (
                    <TouchableOpacity
                      key={g.value}
                      style={[styles.gradeChipModal, isSelected && styles.gradeChipModalActive]}
                      onPress={() => setGrade(g.value)}
                    >
                      <Text style={[styles.gradeChipModalText, isSelected && styles.gradeChipModalTextActive]}>
                        Grade {g.value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.gradeSelectedDesc}>
                {GRADE_OPTIONS.find(g => g.value === grade)?.label || 'Please select a grade'}
              </Text>

              <Text style={styles.inputLabel}>Faculty Remarks (Optional):</Text>
              <TextInput
                style={styles.remarkInput}
                placeholder="Enter remarks for the student (optional)..."
                value={remarks}
                onChangeText={setRemarks}
                onFocus={() => {
                  setTimeout(() => verifyScrollRef.current?.scrollToEnd({ animated: true }), 100);
                }}
                multiline
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleConfirmVerify}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Confirm Verification</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Mark Absent Modal */}
      <Modal visible={showAbsentModal} animationType="fade" transparent={true} onRequestClose={() => setShowAbsentModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={Keyboard.dismiss}
          />
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: '#DC2626' }]}>Mark Student Absent</Text>
                <TouchableOpacity onPress={() => setShowAbsentModal(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              {selectedEntry && (
                <View style={styles.selectedEntryPreview}>
                  <Text style={styles.previewStudent}>{selectedEntry.stud_name || selectedEntry.Pg_stud_name || 'PG Student'}</Text>
                  <Text style={styles.previewTopic}>{selectedEntry.topic || selectedEntry.sem_topic || 'Logbook Activity'}</Text>
                  {(() => {
                    const kp = selectedEntry.keypoints || selectedEntry.key_points || selectedEntry.KeyPoints || selectedEntry.keyPoints;
                    if (kp && String(kp).trim() !== '' && String(kp).trim().toLowerCase() !== 'null') {
                      return (
                        <View style={styles.keypointsContainerModal}>
                          <Text style={styles.keypointsLabel}>Key Points:</Text>
                          <ScrollView style={{ maxHeight: 80 }} nestedScrollEnabled showsVerticalScrollIndicator>
                            <Text style={styles.keypointsText}>{String(kp).trim()}</Text>
                          </ScrollView>
                        </View>
                      );
                    }
                    return null;
                  })()}
                </View>
              )}

              <Text style={styles.inputLabel}>Reason / Remarks:</Text>
              <TextInput
                style={styles.remarkInput}
                placeholder="Reason for marking absent..."
                value={absentRemarks}
                onChangeText={setAbsentRemarks}
                multiline
              />

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#DC2626' }]}
                onPress={handleConfirmAbsent}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Confirm Mark Absent</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bulk Verify & Grade Modal */}
      <Modal visible={showBulkVerifyModal} animationType="fade" transparent={true} onRequestClose={() => setShowBulkVerifyModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={Keyboard.dismiss}
          />
          <View style={styles.modalContent}>
            <ScrollView
              ref={bulkScrollRef}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Batch Verify ({selectedEntryIds.size} Selected)</Text>
                <TouchableOpacity onPress={() => setShowBulkVerifyModal(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Select Grade for All Selected <Text style={{ color: '#DC2626' }}>*</Text></Text>
              <View style={styles.gradeChipModalRow}>
                {GRADE_OPTIONS.map(g => {
                  const isSel = bulkGrade === g.value;
                  return (
                    <TouchableOpacity
                      key={g.value}
                      style={[styles.gradeChipModal, isSel && styles.gradeChipModalActive]}
                      onPress={() => setBulkGrade(g.value)}
                    >
                      <Text style={[styles.gradeChipModalText, isSel && styles.gradeChipModalTextActive]}>
                        Grade {g.value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.gradeSelectedDesc}>
                {GRADE_OPTIONS.find(g => g.value === bulkGrade)?.label || 'Please select a grade'}
              </Text>

              <Text style={styles.inputLabel}>Faculty Remarks (Optional):</Text>
              <TextInput
                style={styles.remarkInput}
                placeholder="Enter optional remarks for all selected entries..."
                value={bulkRemarks}
                onChangeText={setBulkRemarks}
                onFocus={() => {
                  setTimeout(() => bulkScrollRef.current?.scrollToEnd({ animated: true }), 100);
                }}
                multiline
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleConfirmBulkVerify}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Confirm Batch Verification ({selectedEntryIds.size})</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Pickers */}
      <CalendarPickerModal
        visible={showFromPicker}
        title="From Date"
        initialDateStr={fromDate}
        onSelectDate={(d) => setFromDate(d)}
        onClose={() => setShowFromPicker(false)}
      />

      <CalendarPickerModal
        visible={showToPicker}
        title="To Date"
        initialDateStr={toDate}
        onSelectDate={(d) => setToDate(d)}
        onClose={() => setShowToPicker(false)}
      />
    </View>
  );
};

const calStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: { padding: 6, borderRadius: 8, backgroundColor: '#F5F3FF' },
  monthLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayLabel: {
    flex: 1, textAlign: 'center',
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
  },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  dayCell: {
    flex: 1, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCellSelected: { backgroundColor: '#7C3AED' },
  dayCellText: { fontSize: 13, color: '#1F2937', fontWeight: '500' },
  dayCellTextSelected: { color: '#FFFFFF', fontWeight: '800' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  refreshHeaderBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  filterSection: { backgroundColor: '#FFF', padding: 12, borderBottomWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#374151', width: 50 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  chipTextActive: { color: '#FFF' },

  studentSelectorBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#DDD6FE' },
  studentSelectorText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#6D28D9' },

  bulkActionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F3FF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#DDD6FE' },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectAllText: { fontSize: 13, fontWeight: '700', color: '#6D28D9' },
  bulkVerifyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#7C3AED', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  bulkVerifyBtnDisabled: { backgroundColor: '#9CA3AF' },
  bulkVerifyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },

  entryCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2, gap: 10 },
  entryCardSelected: { borderColor: '#7C3AED', borderWidth: 2, backgroundColor: '#FAF5FF' },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  studentAvatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  studentAvatarCircleSelected: { backgroundColor: '#7C3AED' },
  studentAvatarText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  entryStudentName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  entryStudentMeta: { fontSize: 11, color: '#6B7280' },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeVerified: { backgroundColor: '#D1FAE5' },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextPending: { color: '#D97706' },
  badgeTextVerified: { color: '#059669' },

  divider: { height: 1, backgroundColor: '#F3F4F6' },
  topicTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  keypointsContainer: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 4,
    maxHeight: 120,
    borderLeftWidth: 3,
    borderLeftColor: '#EA580C',
  },
  keypointsContainerModal: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
    maxHeight: 110,
    borderLeftWidth: 3,
    borderLeftColor: '#EA580C',
  },
  keypointsScroll: {
    maxHeight: 90,
  },
  keypointsText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
    textAlign: 'justify',
  },
  previewKeypoints: {
    fontSize: 12,
    color: '#EA580C',
    marginTop: 4,
    fontStyle: 'italic',
  },
  topicSub: { fontSize: 12, color: '#6B7280' },
  topicMeta: { fontSize: 11, color: '#9CA3AF' },
  remarkText: { fontSize: 12, fontStyle: 'italic', color: '#4B5563', backgroundColor: '#F9FAFB', padding: 6, borderRadius: 6, marginTop: 4 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
  btnVerify: { backgroundColor: '#7C3AED' },
  btnVerifyText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  btnAbsent: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  btnAbsentText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 30, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', paddingHorizontal: 12, borderRadius: 10, marginBottom: 12 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#1F2937' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  pickerItemActive: { backgroundColor: '#F5F3FF' },
  pickerItemName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  pickerItemRoll: { fontSize: 12, color: '#6B7280' },
  pickerDivider: { height: 1, backgroundColor: '#F3F4F6' },

  dateInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  datePickerBtn: { flex: 1, gap: 2 },
  dateInputLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  dateBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
  dateBtnText: { fontSize: 12, fontWeight: '600', color: '#111827' },
  clearDateBtn: { padding: 6, alignItems: 'center', justifyContent: 'center' },

  selectedEntryPreview: { backgroundColor: '#F5F3FF', padding: 12, borderRadius: 10, marginBottom: 14 },
  previewStudent: { fontSize: 14, fontWeight: '700', color: '#6D28D9' },
  previewTopic: { fontSize: 12, color: '#4B5563', marginTop: 2 },

  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  gradeRowActive: { backgroundColor: '#F5F3FF', borderColor: '#7C3AED' },
  gradeRowText: { fontSize: 13, color: '#374151', flex: 1, fontWeight: '500' },
  gradeRowTextActive: { color: '#6D28D9', fontWeight: '700' },
  gradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gradeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  gradeChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  gradeChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  gradeChipTextActive: { color: '#FFF' },

  gradeChipModalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  gradeChipModal: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  gradeChipModalActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  gradeChipModalText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  gradeChipModalTextActive: { color: '#FFF' },
  gradeSelectedDesc: { fontSize: 12, fontWeight: '600', color: '#6D28D9', marginTop: 2, marginBottom: 12, fontStyle: 'italic' },

  remarkInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', minHeight: 80, textAlignVertical: 'top' },
  modalSubmitBtn: { backgroundColor: '#7C3AED', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  modalSubmitText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});

export default PGLogbookVerificationScreen;
