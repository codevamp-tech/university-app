import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, Platform,
  FlatList, Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { getStudentAvatar } from '../../utils/studentAvatarCache';
import {
  getLogbookActivities,
  getLogbookStudents,
  getLogbookVerifiedStudents,
  submitLogbookVerification,
} from '../../data/apiService';

// ─── Constants ───────────────────────────────────────────────────────────────

// ─── In-memory cache ────────────────────────────────────────────────────────
const ACTIVITY_CACHE_TTL = 15 * 60 * 1000; // 15 minutes – activity list rarely changes
const STUDENTS_CACHE_TTL =  5 * 60 * 1000; //  5 minutes – student list is date-specific
const _activityCache = {};  // key: `${event}_${subCode}_${batchyear}`
const _studentsCache = {};  // key: `${subCode}_${compcode}_${date}_${gcd}_${phase}_${event}`

const PHASE_OPTIONS = [
  { label: 'Phase 1  (2025 Batch)', value: '1' },
  { label: 'Phase 2  (2024 Batch)', value: '2' },
  { label: 'Phase 3  (2023 Batch)', value: '3' },
];

const EVENT_OPTIONS = [
  { value: 'PracticalStudentLab', label: 'Practicals (Student Lab.)' },
  { value: 'CertificationSkills', label: 'Certification Skills' },
  { value: 'VerticalIntegration', label: 'Vertical Integration' },
  { value: 'EarlyClinicalExposure', label: 'Early Clinical Exposure' },
  { value: 'SelfDirectedLearning', label: 'Self Directed Learning' },
  { value: 'Seminar', label: 'Seminar' },
  { value: 'ClinicalVisitDepartment', label: 'Visit to Clinical Department' },
];

const GROUP_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' },
  { value: 'ALL', label: 'ALL' },
];

const A1_OPTIONS = [
  { value: 'F', label: 'Attempt at Activity First or only' },
  { value: 'R', label: 'Repeat' },
  { value: 'Re', label: 'Remedial' },
  { value: 'Absent', label: 'Absent' },
];

const A2_OPTIONS = [
  { value: 'B', label: 'Rating Below Expectations' },
  { value: 'M', label: 'Meets Expectations' },
  { value: 'E', label: 'Exceeds Expectations' },
  { value: 'Absent', label: 'Absent' },
];

const A3_OPTIONS = [
  { value: 'C', label: 'Completed' },
  { value: 'R', label: 'Repeat' },
  { value: 'Re', label: 'Remedial' },
  { value: 'Absent', label: 'Absent' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDateISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateDisplay = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// ─── DropdownModal ────────────────────────────────────────────────────────────

const DropdownModal = ({ visible, title, options, selectedValue, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={ddStyles.overlay} activeOpacity={1} onPress={onClose}>
      <View style={ddStyles.sheet}>
        <View style={ddStyles.header}>
          <Text style={ddStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={options}
          keyExtractor={item => item.value}
          renderItem={({ item }) => {
            const isSelected = item.value === selectedValue;
            return (
              <TouchableOpacity
                style={[ddStyles.option, isSelected && ddStyles.optionSelected]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={[ddStyles.optionText, isSelected && ddStyles.optionTextSelected]}>
                  {item.label}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={18} color="#EA580C" />}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </TouchableOpacity>
  </Modal>
);

// ─── FilterRow ────────────────────────────────────────────────────────────────

const FilterRow = ({ label, value, onPress, loading }) => (
  <View style={styles.filterFieldWrap}>
    <Text style={styles.filterLabel}>{label}</Text>
    <TouchableOpacity style={styles.filterBtn} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.filterBtnText} numberOfLines={1}>{value}</Text>
      {loading
        ? <ActivityIndicator size="small" color="#EA580C" />
        : <Ionicons name="chevron-down" size={16} color="#6B7280" />
      }
    </TouchableOpacity>
  </View>
);

// ─── CalendarModal ───────────────────────────────────────────────────────────

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const CalendarModal = ({ visible, date, onSelect, onClose }) => {
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());

  React.useEffect(() => {
    if (visible) {
      setViewYear(date.getFullYear());
      setViewMonth(date.getMonth());
    }
  }, [visible]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build day grid
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
  const isToday = (d) => {
    const t = new Date();
    return d && t.getDate() === d && t.getMonth() === viewMonth && t.getFullYear() === viewYear;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={calStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={calStyles.sheet}>
          {/* Month nav */}
          <View style={calStyles.header}>
            <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-back" size={20} color="#EA580C" />
            </TouchableOpacity>
            <Text style={calStyles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color="#EA580C" />
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={calStyles.dayRow}>
            {DAY_NAMES.map(d => (
              <Text key={d} style={calStyles.dayLabel}>{d}</Text>
            ))}
          </View>

          {/* Date grid */}
          {weeks.map((week, wi) => (
            <View key={wi} style={calStyles.weekRow}>
              {week.map((day, di) => {
                const sel = isSelected(day);
                const tod = isToday(day);
                return (
                  <TouchableOpacity
                    key={di}
                    style={[calStyles.dayCell, sel && calStyles.dayCellSelected, tod && !sel && calStyles.dayCellToday]}
                    onPress={() => {
                      if (day) { onSelect(new Date(viewYear, viewMonth, day)); onClose(); }
                    }}
                    activeOpacity={day ? 0.7 : 1}
                  >
                    <Text style={[
                      calStyles.dayCellText,
                      sel && calStyles.dayCellTextSelected,
                      tod && !sel && calStyles.dayCellTextToday,
                      !day && { opacity: 0 },
                    ]}>
                      {day || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* Today shortcut */}
          <TouchableOpacity
            style={calStyles.todayBtn}
            onPress={() => { onSelect(new Date()); onClose(); }}
          >
            <Text style={calStyles.todayBtnText}>Today</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── DatePicker ───────────────────────────────────────────────────────────────

const DatePicker = ({ date, onChange }) => {
  const [calOpen, setCalOpen] = useState(false);
  const addDays = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    onChange(d);
  };
  return (
    <View style={styles.filterFieldWrap}>
      <Text style={styles.filterLabel}>DATE</Text>
      <View style={styles.datePicker}>
        <TouchableOpacity onPress={() => addDays(-1)} style={styles.dateArrow}>
          <Ionicons name="chevron-back" size={18} color="#EA580C" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateTextWrap} onPress={() => setCalOpen(true)} activeOpacity={0.8}>
          <Ionicons name="calendar-outline" size={14} color="#EA580C" style={{ marginRight: 5 }} />
          <Text style={styles.dateText}>{formatDateDisplay(date)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => addDays(1)} style={styles.dateArrow}>
          <Ionicons name="chevron-forward" size={18} color="#EA580C" />
        </TouchableOpacity>
      </View>
      <CalendarModal
        visible={calOpen}
        date={date}
        onSelect={onChange}
        onClose={() => setCalOpen(false)}
      />
    </View>
  );
};


// ─── Main Screen ─────────────────────────────────────────────────────────────

const UGLogbookScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, accessToken } = useUser();

  const subCode = user?.sub_code || 'PY';

  // Filters
  const [selectedPhase, setSelectedPhase] = useState(PHASE_OPTIONS[0]);
  const [selectedEvent, setSelectedEvent] = useState(EVENT_OPTIONS[0]);
  const [selectedGroup, setSelectedGroup] = useState(GROUP_OPTIONS[3]); // A1
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Activities from ERP
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Students from ERP
  const [studentList, setStudentList] = useState([]);
  const [verifiedStudentList, setVerifiedStudentList] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  // Verification state
  const [expandedRoll, setExpandedRoll] = useState(null);
  const [verifyForms, setVerifyForms] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [verifiedRolls, setVerifiedRolls] = useState(new Set());
  const [selectedRolls, setSelectedRolls] = useState(new Set());
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = React.useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Tab
  const [activeTab, setActiveTab] = useState('pending');

  const [modalType, setModalType] = useState(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [activeDropdownConfig, setActiveDropdownConfig] = useState(null);



  // ── Load Activities ───────────────────────────────────────────────────────

  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    setSelectedActivity(null);
    try {
      const batchyear = selectedPhase.value === '3' ? '2023' : '2024';
      const cacheKey = `${selectedEvent.value}_${subCode}_${batchyear}`;
      const now = Date.now();
      const cached = _activityCache[cacheKey];
      let list;
      if (cached && (now - cached.timestamp) < ACTIVITY_CACHE_TTL) {
        list = cached.data;
      } else {
        const data = await getLogbookActivities(accessToken, selectedEvent.value, subCode, batchyear);
        list = Array.isArray(data) ? data : [];
        _activityCache[cacheKey] = { data: list, timestamp: now };
      }
      setActivities(list);
      if (list.length > 0) setSelectedActivity(list[0]);
    } catch (e) {
      console.warn('[UGLogbook] activities error:', e);
    } finally {
      setActivitiesLoading(false);
    }
  }, [accessToken, selectedEvent.value, selectedPhase.value, subCode]);

  // Load on mount
  React.useEffect(() => { loadActivities(); }, [loadActivities]);

  // ── Load Students ─────────────────────────────────────────────────────────

  const loadStudents = useCallback(async () => {
    if (!selectedActivity) return;

    let compcode = selectedActivity.comp_code || selectedActivity.CompCode || selectedActivity.compcode || selectedActivity.value || '';
    if (compcode && compcode.includes('_')) {
      compcode = compcode.split('_')[0];
    }
    const activityName = selectedActivity.ActivityName || selectedActivity.comp_name || selectedActivity.label || '';
    const dateStr = formatDateISO(selectedDate);
    const cacheKey = `${subCode}_${compcode}_${dateStr}_${selectedGroup.value}_${selectedPhase.value}_${selectedEvent.value}`;

    // ─ Cache hit: restore state instantly without any loading flash ────────────────
    const now = Date.now();
    const cached = _studentsCache[cacheKey];
    if (cached && (now - cached.timestamp) < STUDENTS_CACHE_TTL) {
      setStudentList(cached.pending);
      setVerifiedStudentList(cached.verified);
      setVerifiedRolls(new Set());
      setExpandedRoll(null);
      setStudentsLoaded(true);
      return;
    }

    // ─ Cache miss: fetch from ERP ──────────────────────────────────────────
    setStudentsLoading(true);
    setStudentsLoaded(false);
    setStudentList([]);
    setVerifiedStudentList([]);
    setExpandedRoll(null);
    setVerifiedRolls(new Set());
    try {
      const [pendingData, verifiedData] = await Promise.all([
        getLogbookStudents(accessToken, {
          subCode,
          compcode,
          verifiedDt: dateStr,
          gcd: selectedGroup.value,
          phase: selectedPhase.value,
        }),
        getLogbookVerifiedStudents(accessToken, {
          subCode,
          compcode,
          activityName,
          verifiedDt: dateStr,
          phase: selectedPhase.value,
          lbtype: selectedEvent.value,
        })
      ]);

      const pending = Array.isArray(pendingData) ? pendingData : [];

      // Map verified students to uniform shape
      const mappedVerified = (Array.isArray(verifiedData) ? verifiedData : []).map(item => {
        const vBy = item.VerifiedBy || item.verifiedBy || item.verified_by || item.Verified_By || '';
        console.log(`[UGLogbook] mapping verified student: ${item.rollno || item.stud_roll_no} | VerifiedBy: ${vBy}`);
        return {
          Roll_No: item.rollno || item.stud_roll_no || item.Roll_No,
          Student_Name: item.stud_name || item.Student_Name || item.student_name || 'Unknown Student',
          department: item.Department || item.department || 'Physiology',
          isAlreadyVerified: true,
          A1: item.A1,
          A2: item.A2,
          A3: item.A3,
          remarks: item.remarks || '',
          verifiedBy: vBy,
          received: item.received,
        };
      });

      // Store in cache
      _studentsCache[cacheKey] = { pending, verified: mappedVerified, timestamp: Date.now() };

      setStudentList(pending);
      setVerifiedStudentList(mappedVerified);
      setStudentsLoaded(true);
    } catch (e) {
      console.warn('[UGLogbook] students load error:', e);
      Alert.alert('Error', 'Failed to load students. Please try again.');
    } finally {
      setStudentsLoading(false);
    }
  }, [accessToken, selectedActivity, selectedDate, selectedGroup.value, selectedPhase.value, selectedEvent.value, subCode]);

  // Auto-load students when selectedActivity is set
  React.useEffect(() => {
    if (selectedActivity) {
      loadStudents();
    }
  }, [selectedActivity, loadStudents]);

  // ── Accordion ─────────────────────────────────────────────────────────────

  const toggleExpand = (rollNo) => {
    if (expandedRoll === rollNo) {
      setExpandedRoll(null);
    } else {
      setExpandedRoll(rollNo);
      if (!verifyForms[rollNo]) {
        setVerifyForms(prev => ({
          ...prev,
          [rollNo]: { a1: 'F', a2: 'M', a3: 'C', remarks: '' },
        }));
      }
    }
  };

  const updateForm = (rollNo, key, value) => {
    setVerifyForms(prev => {
      const current = prev[rollNo] || {};
      const updated = { ...current, [key]: value };
      if (key === 'a1') {
        if (value === 'Absent') {
          updated.a2 = 'Absent';
          updated.a3 = 'Absent';
        } else if (current.a1 === 'Absent') {
          updated.a2 = 'M';
          updated.a3 = 'C';
        }
      }
      return {
        ...prev,
        [rollNo]: updated,
      };
    });
  };

  // Clear multi-select when list of students changes
  useEffect(() => {
    setSelectedRolls(new Set());
  }, [studentList]);

  const toggleSelectStudent = (rollNo) => {
    setSelectedRolls(prev => {
      const next = new Set(prev);
      if (next.has(rollNo)) {
        next.delete(rollNo);
      } else {
        next.add(rollNo);
      }
      return next;
    });
  };



  const handleSubmit = async (student) => {
    const rollNo = student.Roll_No;
    const form = verifyForms[rollNo] || {};
    let compcode = selectedActivity?.comp_code || selectedActivity?.CompCode || selectedActivity?.compcode || selectedActivity?.value || '';
    if (compcode && compcode.includes('_')) {
      compcode = compcode.split('_')[0];
    }
    const activityName = selectedActivity?.ActivityName || selectedActivity?.comp_name || selectedActivity?.label || '';

    setSubmitting(rollNo);

    try {
      await submitLogbookVerification(accessToken, {
        roll_no: rollNo,
        sub_code: subCode,
        comp_code: compcode,
        activity_name: activityName,
        a1: form.a1 || 'F',
        a2: form.a2 || 'M',
        a3: form.a3 || 'C',
        remarks: form.remarks || '',
        verified_dt: formatDateISO(selectedDate),
        phase: selectedPhase.value,
        lbtype: selectedEvent.value,
      });
      setVerifiedRolls(prev => new Set([...prev, rollNo]));
      setExpandedRoll(null);
      
      // Invalidate cache so that re-opening shows fresh count from ERP
      const dateStr = formatDateISO(selectedDate);
      const cacheKey = `${subCode}_${compcode}_${dateStr}_${selectedGroup.value}_${selectedPhase.value}_${selectedEvent.value}`;
      delete _studentsCache[cacheKey];

      showToast(`${student.Student_Name} verified successfully.`);
    } catch (e) {
      console.warn('[UGLogbook] verify error:', e);
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const pendingStudents = studentList
    .filter(s => !verifiedRolls.has(s.Roll_No))
    .sort((a, b) => {
      const nameA = (a.Student_Name || '').trim().toLowerCase();
      const nameB = (b.Student_Name || '').trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const justVerifiedStudents = studentList
    .filter(s => verifiedRolls.has(s.Roll_No))
    .map(s => {
      const form = verifyForms[s.Roll_No] || { a1: 'F', a2: 'M', a3: 'C', remarks: '' };
      return {
        ...s,
        isAlreadyVerified: true,
        A1: form.a1,
        A2: form.a2,
        A3: form.a3,
        remarks: form.remarks,
        verifiedBy: user?.name || 'Faculty',
        received: 0,
      };
    });

  const verifiedStudents = [...justVerifiedStudents, ...verifiedStudentList]
    .sort((a, b) => {
      const nameA = (a.Student_Name || '').trim().toLowerCase();
      const nameB = (b.Student_Name || '').trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const verifiedPresentStudents = verifiedStudents.filter(s => s.A1 !== 'Absent' && s.a1 !== 'Absent');
  const verifiedAbsentStudents = verifiedStudents.filter(s => s.A1 === 'Absent' || s.a1 === 'Absent');

  const displayedList = activeTab === 'pending'
    ? pendingStudents
    : activeTab === 'verified'
      ? verifiedPresentStudents
      : verifiedAbsentStudents;

  const toggleSelectAll = () => {
    setSelectedRolls(prev => {
      const pending = pendingStudents.map(s => s.Roll_No);
      const allSelected = pending.every(r => prev.has(r));
      if (allSelected) {
        const next = new Set(prev);
        pending.forEach(r => next.delete(r));
        return next;
      } else {
        return new Set([...prev, ...pending]);
      }
    });
  };

  const isAllSelected = pendingStudents.length > 0 && pendingStudents.every(s => selectedRolls.has(s.Roll_No));

  const handleBulkSubmit = async () => {
    if (selectedRolls.size === 0) {
      Alert.alert('No Selection', 'Please select at least one student to verify.');
      return;
    }

    Alert.alert(
      'Verify Selected',
      `Are you sure you want to sign off logbooks for ${selectedRolls.size} selected students with default options (Attempt first/only, Meets Expectations, Completed)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async () => {
            setSubmittingBulk(true);
            const rollArray = Array.from(selectedRolls);
            let compcode = selectedActivity?.comp_code || selectedActivity?.CompCode || selectedActivity?.compcode || selectedActivity?.value || '';
            if (compcode && compcode.includes('_')) {
              compcode = compcode.split('_')[0];
            }
            const activityName = selectedActivity?.ActivityName || selectedActivity?.comp_name || selectedActivity?.label || '';
            
            let successCount = 0;
            let failCount = 0;
            
            const promises = rollArray.map(async (rollNo) => {
              const form = verifyForms[rollNo] || {};
              try {
                await submitLogbookVerification(accessToken, {
                  roll_no: rollNo,
                  sub_code: subCode,
                  comp_code: compcode,
                  activity_name: activityName,
                  a1: form.a1 || 'F',
                  a2: form.a2 || 'M',
                  a3: form.a3 || 'C',
                  remarks: form.remarks || '',
                  verified_dt: formatDateISO(selectedDate),
                  phase: selectedPhase.value,
                  lbtype: selectedEvent.value,
                });
                successCount++;
                setVerifiedRolls(prev => new Set([...prev, rollNo]));
              } catch (e) {
                console.warn(`[UGLogbook] bulk verify error for ${rollNo}:`, e);
                failCount++;
              }
            });
            
            await Promise.all(promises);
            setSubmittingBulk(false);
            setSelectedRolls(new Set());

            // Invalidate cache so that re-opening shows fresh count from ERP
            const dateStr = formatDateISO(selectedDate);
            const cacheKey = `${subCode}_${compcode}_${dateStr}_${selectedGroup.value}_${selectedPhase.value}_${selectedEvent.value}`;
            delete _studentsCache[cacheKey];
            
            if (failCount === 0) {
              showToast(`Successfully verified logbooks for all ${successCount} students.`);
            } else {
              Alert.alert('Bulk Verification Result', `Successfully verified: ${successCount}\nFailed: ${failCount}`);
            }
          }
        }
      ]
    );
  };

  const activityLabel = selectedActivity
    ? (selectedActivity.ActivityName || selectedActivity.comp_name || selectedActivity.label || 'Selected')
    : (activitiesLoading ? 'Loading…' : 'Select activity');

  const activityOptions = activities.map(a => ({
    value: a.comp_code || a.CompCode || a.compcode || '',
    label: a.ActivityName || a.comp_name || a.label || a.comp_code || '',
    _raw: a,
  }));

  const openModal = (type) => setModalType(type);
  const closeModal = () => setModalType(null);

  const renderDropdown = (rollNo, key, opts, title) => {
    const val = verifyForms[rollNo]?.[key] || opts[0].value;
    const found = opts.find(o => o.value === val);
    return (
      <TouchableOpacity
        style={styles.accordionDropdown}
        onPress={() => {
          setActiveDropdownConfig({
            title,
            options: opts,
            selectedValue: val,
            onSelect: (item) => updateForm(rollNo, key, item.value)
          });
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.accordionDropdownText} numberOfLines={1}>
          {found ? found.label : 'Select'}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#6B7280" />
      </TouchableOpacity>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {toast && (
        <View style={[
          styles.toastContainer,
          toast.type === 'error' && { backgroundColor: '#EF4444' }
        ]}>
          <Ionicons 
            name={toast.type === 'success' ? "checkmark-circle" : "alert-circle"} 
            size={18} 
            color="#FFFFFF" 
            style={{ marginRight: 8 }} 
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Header */}
      <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('TeacherMain')} style={styles.backButton}>
          <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.backButtonBg}>
            <Ionicons name="arrow-back" size={20} color="#EA580C" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>UG Logbook Verifier</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Collapsed Filter Bar */}
      <TouchableOpacity
        style={styles.collapsedFilterBar}
        onPress={() => setShowFiltersModal(true)}
        activeOpacity={0.9}
      >
        <View style={styles.collapsedFilterBarLeft}>
          <Ionicons name="funnel" size={14} color="#EA580C" style={{ marginRight: 8 }} />
          <Text style={styles.collapsedFilterText} numberOfLines={1}>
            Phase {selectedPhase.value} · {selectedGroup.value} · {formatDateDisplay(selectedDate)}
          </Text>
        </View>
        <View style={styles.collapsedFilterBarRight}>
          <Text style={styles.filterSummaryActivity} numberOfLines={1}>
            {activityLabel}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#9CA3AF" style={{ marginLeft: 6 }} />
        </View>
      </TouchableOpacity>

      {/* Filters Modal Sheet */}
      {showFiltersModal && (
        <View style={styles.absoluteFiltersOverlay}>
          <TouchableOpacity
            style={ddStyles.overlay}
            activeOpacity={1}
            onPress={() => setShowFiltersModal(false)}
          >
            <View style={styles.filtersModalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Set Search Filters</Text>
                <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                  <Ionicons name="close-circle" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.filterGridModal} showsVerticalScrollIndicator={false}>
                <FilterRow label="BATCH / PHASE" value={selectedPhase.label} onPress={() => openModal('phase')} />
                <FilterRow label="EVENT TYPE" value={selectedEvent.label} onPress={() => openModal('event')} />
                <FilterRow label="GROUP" value={selectedGroup.label} onPress={() => openModal('group')} />
                <FilterRow label="ACTIVITY" value={activityLabel} onPress={() => openModal('activity')} loading={activitiesLoading} />
                <DatePicker date={selectedDate} onChange={setSelectedDate} />
              </ScrollView>

              <TouchableOpacity
                style={[styles.applyBtn, studentsLoading && { opacity: 0.7 }]}
                onPress={async () => {
                  setShowFiltersModal(false);
                  await loadStudents();
                }}
                activeOpacity={0.85}
                disabled={studentsLoading}
              >
                {studentsLoading
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.applyBtnText}>Apply & Load Students</Text>
                  </>
                }
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}


      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending ({pendingStudents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'verified' && styles.tabActive]}
          onPress={() => setActiveTab('verified')}
        >
          <Text style={[styles.tabText, activeTab === 'verified' && styles.tabTextActive]}>
            Verified ({verifiedPresentStudents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'absent' && styles.tabActive]}
          onPress={() => setActiveTab('absent')}
        >
          <Text style={[styles.tabText, activeTab === 'absent' && styles.tabTextActive]}>
            Absent ({verifiedAbsentStudents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {!studentsLoaded ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="filter-outline" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>Set filters and tap Load Students</Text>
          <Text style={styles.emptySub}>Select an activity and date to fetch the student list from ERP.</Text>
        </View>
      ) : displayedList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={activeTab === 'pending' ? 'checkbox-multiple-marked-outline' : activeTab === 'verified' ? 'history' : 'account-minus-outline'}
            size={48}
            color="#D1D5DB"
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.emptyText}>
            {activeTab === 'pending' ? 'All caught up!' : activeTab === 'verified' ? 'No verified entries yet' : 'No absent entries yet'}
          </Text>
          <Text style={styles.emptySub}>
            {activeTab === 'pending'
              ? 'No students are pending verification for these filters.'
              : activeTab === 'verified'
                ? 'Sign off students to see their records here.'
                : 'Any students marked as Absent will appear here.'}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {activeTab === 'pending' && pendingStudents.length > 0 && (
            <View style={styles.actionBar}>
              <TouchableOpacity 
                style={styles.checkboxRow} 
                onPress={toggleSelectAll}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.checkboxField,
                  isAllSelected && { backgroundColor: '#EA580C', borderColor: '#EA580C' }
                ]}>
                  {isAllSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Select All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.bulkVerifyBtn,
                  selectedRolls.size === 0 && { backgroundColor: '#E5E7EB', borderColor: '#E5E7EB' }
                ]}
                onPress={handleBulkSubmit}
                disabled={selectedRolls.size === 0 || submittingBulk}
                activeOpacity={0.8}
              >
                {submittingBulk ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons 
                      name="shield-checkmark" 
                      size={16} 
                      color={selectedRolls.size === 0 ? '#9CA3AF' : '#FFFFFF'} 
                      style={{ marginRight: 6 }} 
                    />
                    <Text style={[
                      styles.bulkVerifyBtnText,
                      selectedRolls.size === 0 && { color: '#9CA3AF' }
                    ]}>
                      Verify Selected ({selectedRolls.size})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {displayedList.map(student => {
            const rollNo = student.Roll_No;
            const isExpanded = expandedRoll === rollNo;
            const isVerified = student.isAlreadyVerified || verifiedRolls.has(rollNo);
            const form = verifyForms[rollNo] || {
              a1: student.A1 || 'F',
              a2: student.A2 || 'M',
              a3: student.A3 || 'C',
              remarks: student.remarks || ''
            };
            const isSub = submitting === rollNo;

            return (
              <View key={rollNo} style={styles.studentCard}>
                {/* Row Wrapper */}
                <View style={styles.studentRow}>
                  {/* Pressable Avatar for selection (sibling on the left) */}
                  <TouchableOpacity
                    onPress={() => toggleSelectStudent(rollNo)}
                    disabled={isVerified}
                    activeOpacity={0.7}
                    style={styles.avatarTouchArea}
                  >
                    <View style={styles.avatarWrapper}>
                      <View style={styles.avatarCircle}>
                        {(() => {
                          const photoUrl = getStudentAvatar(rollNo);
                          const initial = (student.Student_Name || 'S').charAt(0).toUpperCase();
                          return photoUrl ? (
                            <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
                          ) : (
                            <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.avatarGradient}>
                              <Text style={styles.avatarInitial}>{initial}</Text>
                            </LinearGradient>
                          );
                        })()}

                        {/* Selected Checkmark Translucent Overlay */}
                        {activeTab === 'pending' && !isVerified && selectedRolls.has(rollNo) && (
                          <View style={styles.avatarSelectedOverlay}>
                            <View style={styles.selectedCheckCircle}>
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            </View>
                          </View>
                        )}
                      </View>
                      {isVerified && (
                        <View style={styles.avatarVerifiedBadge}>
                          <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                        </View>
                      )}
                      {isExpanded && !isVerified && (
                        <View style={styles.avatarEditBadge}>
                          <Ionicons name="pencil" size={9} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Pressable Card Body for expansion (sibling on the right) */}
                  <TouchableOpacity
                    style={styles.studentRowRight}
                    onPress={() => toggleExpand(rollNo)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.Student_Name}</Text>
                      <Text style={styles.studentRoll}>{rollNo}  ·  {student.department}</Text>
                      {isVerified && (
                        <View style={{ marginTop: 4 }}>
                          {student.verifiedBy ? (
                            <Text style={styles.cardVerifyByText} numberOfLines={1}>
                              Verified by: {student.verifiedBy}
                            </Text>
                          ) : null}
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                            <View style={[
                              styles.studentStatusDot,
                              { backgroundColor: student.received === 1 ? '#10B981' : '#F59E0B' }
                            ]} />
                            <Text style={styles.studentStatusText}>
                              Student Verification: {student.received === 1 ? 'Completed' : 'Pending'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {isVerified
                      ? <View style={styles.verifiedBadge}><Text style={styles.verifiedBadgeText}>Verified</Text></View>
                      : <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
                    }
                  </TouchableOpacity>
                </View>

                {/* Accordion */}
                {isExpanded && (
                  <View style={styles.accordion}>
                    <View style={styles.accordionDivider} />

                    <Text style={styles.accordionSectionLabel}>ATTEMPT TYPE</Text>
                    {isVerified ? (
                      <View style={[styles.accordionDropdown, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                        <Text style={[styles.accordionDropdownText, { color: '#4B5563' }]}>
                          {A1_OPTIONS.find(o => o.value === form.a1)?.label || form.a1}
                        </Text>
                      </View>
                    ) : (
                      renderDropdown(rollNo, 'a1', A1_OPTIONS, 'Attempt Type')
                    )}

                    <Text style={[styles.accordionSectionLabel, { marginTop: 12 }]}>PERFORMANCE RATING</Text>
                    {isVerified ? (
                      <View style={[styles.accordionDropdown, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                        <Text style={[styles.accordionDropdownText, { color: '#4B5563' }]}>
                          {A2_OPTIONS.find(o => o.value === form.a2)?.label || form.a2}
                        </Text>
                      </View>
                    ) : (
                      renderDropdown(rollNo, 'a2', A2_OPTIONS, 'Performance Rating')
                    )}

                    <Text style={[styles.accordionSectionLabel, { marginTop: 12 }]}>COMPLETION STATUS</Text>
                    {isVerified ? (
                      <View style={[styles.accordionDropdown, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                        <Text style={[styles.accordionDropdownText, { color: '#4B5563' }]}>
                          {A3_OPTIONS.find(o => o.value === form.a3)?.label || form.a3}
                        </Text>
                      </View>
                    ) : (
                      renderDropdown(rollNo, 'a3', A3_OPTIONS, 'Completion Status')
                    )}

                    {isVerified ? (
                      form.remarks ? (
                        <>
                          <Text style={[styles.accordionSectionLabel, { marginTop: 12 }]}>REMARKS</Text>
                          <View style={[styles.remarksInput, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                            <Text style={{ fontSize: 13, color: '#4B5563' }}>{form.remarks}</Text>
                          </View>
                        </>
                      ) : null
                    ) : (
                      <>
                        <Text style={[styles.accordionSectionLabel, { marginTop: 12 }]}>REMARKS (optional)</Text>
                        <TextInput
                          style={styles.remarksInput}
                          placeholder="Add remarks..."
                          placeholderTextColor="#9CA3AF"
                          value={form.remarks}
                          onChangeText={v => updateForm(rollNo, 'remarks', v)}
                          multiline
                        />
                      </>
                    )}

                    {!isVerified && (
                      <TouchableOpacity
                        style={[styles.submitBtn, isSub && { opacity: 0.7 }]}
                        onPress={() => handleSubmit(student)}
                        disabled={isSub}
                        activeOpacity={0.8}
                      >
                        {isSub
                          ? <ActivityIndicator size="small" color="#FFFFFF" />
                          : <>
                            <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={styles.submitBtnText}>Submit Verification</Text>
                          </>
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
      )}

      {/* Filter Modals */}
      <DropdownModal
        visible={modalType === 'phase'}
        title="Select Batch / Phase"
        options={PHASE_OPTIONS}
        selectedValue={selectedPhase.value}
        onSelect={item => { setSelectedPhase(item); setStudentsLoaded(false); setStudentList([]); }}
        onClose={closeModal}
      />
      <DropdownModal
        visible={modalType === 'event'}
        title="Select Event Type"
        options={EVENT_OPTIONS}
        selectedValue={selectedEvent.value}
        onSelect={item => { setSelectedEvent(item); setStudentsLoaded(false); setStudentList([]); }}
        onClose={closeModal}
      />
      <DropdownModal
        visible={modalType === 'group'}
        title="Select Group"
        options={GROUP_OPTIONS}
        selectedValue={selectedGroup.value}
        onSelect={item => { setSelectedGroup(item); setStudentsLoaded(false); setStudentList([]); }}
        onClose={closeModal}
      />
      <DropdownModal
        visible={modalType === 'activity'}
        title="Select Activity"
        options={activityOptions}
        selectedValue={selectedActivity?.comp_code || selectedActivity?.CompCode || selectedActivity?.value || ''}
        onSelect={item => { setSelectedActivity(item._raw || item); setStudentsLoaded(false); setStudentList([]); }}
        onClose={closeModal}
      />

      {/* Dynamic Dropdown Modal */}
      {activeDropdownConfig && (
        <DropdownModal
          visible={!!activeDropdownConfig}
          title={activeDropdownConfig.title}
          options={activeDropdownConfig.options}
          selectedValue={activeDropdownConfig.selectedValue}
          onSelect={(item) => {
            activeDropdownConfig.onSelect(item);
            setActiveDropdownConfig(null);
          }}
          onClose={() => setActiveDropdownConfig(null)}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  backButtonBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },

  collapsedFilterBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  collapsedFilterBarLeft: { flexDirection: 'row', alignItems: 'center', flex: 0.5 },
  collapsedFilterBarRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flex: 0.5 },
  collapsedFilterText: { fontSize: 13, fontWeight: '800', color: '#1F2937' },
  filterSummaryActivity: { fontSize: 12, fontWeight: '600', color: '#EA580C', textAlign: 'right', flex: 1 },

  absoluteFiltersOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1000,
  },
  filtersModalSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20, width: '100%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#111827', letterSpacing: -0.3 },
  filterGridModal: { gap: 12, paddingBottom: 16 },

  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EA580C', borderRadius: 14, paddingVertical: 14,
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  filterFieldWrap: { gap: 4 },
  filterLabel: { fontSize: 8, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterBtnText: { fontSize: 13, fontWeight: '700', color: '#EA580C', flex: 1, marginRight: 6 },

  datePicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  dateArrow: { padding: 4 },
  dateTextWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 13, fontWeight: '700', color: '#EA580C' },


  loadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EA580C', borderRadius: 12, paddingVertical: 13,
  },
  loadBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  tabContainer: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#EA580C' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '700' },
  tabTextActive: { color: '#EA580C' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: '800', color: '#4B5563', marginBottom: 4, textAlign: 'center' },
  emptySub: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },

  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },

  studentCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14 },
  avatarTouchArea: { paddingVertical: 14, paddingRight: 4 },
  studentRowRight: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingRight: 14, paddingLeft: 8, gap: 12 },
  avatarSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(234, 88, 12, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  checkboxField: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
    marginLeft: 8,
  },
  bulkVerifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkVerifyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  avatarWrapper: {
    width: 44, height: 44, position: 'relative',
    // No overflow:hidden here — lets the corner badges render outside the circle
  },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, overflow: 'hidden',
  },
  avatarImage: {
    width: '100%', height: '100%',
  },
  avatarGradient: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF', fontSize: 18, fontWeight: '800',
  },
  avatarVerifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 17, height: 17, borderRadius: 9,
    backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 17, height: 17, borderRadius: 9,
    backgroundColor: '#EA580C', borderWidth: 2, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2 },
  studentRoll: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  cardVerifyByText: { fontSize: 11, color: '#4B5563', fontWeight: '600', marginTop: 2 },
  studentStatusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  studentStatusText: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  verifiedBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  verifiedBadgeText: { fontSize: 10, fontWeight: '800', color: '#065F46' },

  accordion: { paddingHorizontal: 14, paddingBottom: 14, backgroundColor: '#FAFAFA' },
  accordionDivider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  accordionSectionLabel: { fontSize: 8, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.8, marginBottom: 5 },
  accordionDropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  accordionDropdownText: { fontSize: 13, color: '#EA580C', fontWeight: '700', flex: 1, marginRight: 6 },

  remarksInput: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EA580C',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 13, color: '#1F2937', minHeight: 64, textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#10B981', borderRadius: 10, paddingVertical: 12, marginTop: 14,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});

const ddStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24, maxHeight: '60%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  optionSelected: { backgroundColor: '#FFF7ED' },
  optionText: { fontSize: 14, color: '#374151', fontWeight: '500', flex: 1, marginRight: 8 },
  optionTextSelected: { color: '#EA580C', fontWeight: '700' },
});

const calStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: { padding: 6, borderRadius: 8, backgroundColor: '#FFF7ED' },
  monthLabel: { fontSize: 16, fontWeight: '800', color: '#111827' },
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayLabel: {
    flex: 1, textAlign: 'center',
    fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.3,
  },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  dayCell: {
    flex: 1, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCellSelected: { backgroundColor: '#EA580C' },
  dayCellToday: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#EA580C' },
  dayCellText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  dayCellTextSelected: { color: '#FFFFFF', fontWeight: '800' },
  dayCellTextToday: { color: '#EA580C', fontWeight: '700' },
  todayBtn: {
    marginTop: 12, alignSelf: 'center',
    paddingVertical: 10, paddingHorizontal: 32,
    backgroundColor: '#FFF7ED', borderRadius: 12,
    borderWidth: 1, borderColor: '#FDBA74',
  },
  todayBtnText: { fontSize: 14, fontWeight: '800', color: '#EA580C' },
});

export default UGLogbookScreen;

