import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  TextInput, Dimensions, Animated, ActivityIndicator, Alert, Modal, Image
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getFoundationStudentList, getFoundationData, saveFoundationData } from '../../data/apiService';

const { width } = Dimensions.get('window');

const PHASE_OPTIONS = [
  { value: '1', label: 'Phase 1 (1st Year)' },
  { value: '2', label: 'Phase 2 (2nd Year)' },
  { value: '3', label: 'Phase 3 Part 1 (3rd Year)' },
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const formatDateISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};



const parseMicrosoftDate = (str) => {
  if (!str) return null;
  if (typeof str === 'string' && str.startsWith('/Date(')) {
    const num = parseInt(str.substring(6, str.length - 2), 10);
    if (!isNaN(num)) {
      return new Date(num);
    }
  }
  return new Date(str);
};

const formatMicrosoftDate = (str) => {
  if (!str) return '—';
  try {
    const d = parseMicrosoftDate(str);
    if (d && !isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const mm = months[d.getMonth()];
      const yyyy = d.getFullYear();
      return `${dd} ${mm} ${yyyy}`;
    }
  } catch (_) {}
  return String(str);
};

const formatMicrosoftTime = (str) => {
  if (!str) return '—';
  try {
    const d = parseMicrosoftDate(str);
    if (d && !isNaN(d.getTime())) {
      let h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, '0');
      const per = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${m} ${per}`;
    }
  } catch (_) {}
  return String(str);
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

const SkeletonCard = ({ colors }) => (
  <View style={[styles.studentCard, { borderColor: colors.border, padding: 16, gap: 10, flexDirection: 'row', alignItems: 'center' }]}>
    <SkeletonBlock width={40} height={40} borderRadius={20} />
    <View style={{ flex: 1, gap: 6 }}>
      <SkeletonBlock width="40%" height={12} />
      <SkeletonBlock width="60%" height={14} />
    </View>
  </View>
);

const StudentAvatar = ({ url, name, colors }) => {
  const [error, setError] = useState(false);
  const displayInitial = (name || 'S').charAt(0).toUpperCase();

  if (error || !url) {
    return (
      <LinearGradient
        colors={['#7C3AED', '#5B21B6']}
        style={{ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF' }}>{displayInitial}</Text>
      </LinearGradient>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0' }}
      onError={() => setError(true)}
    />
  );
};

const DropdownModal = ({ visible, title, options, selectedValue, onSelect, onClose, colors }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={ddStyles.overlay} activeOpacity={1} onPress={onClose}>
      <View style={[ddStyles.sheet, { backgroundColor: colors.card }]}>
        <Text style={[ddStyles.title, { color: colors.textPrimary }]}>{title}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {options.map(item => {
            const isSelected = item.value === selectedValue;
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => { onSelect(item); onClose(); }}
                style={[ddStyles.optionBtn, isSelected && { backgroundColor: 'rgba(124,58,237,0.1)' }]}
              >
                <Text style={[ddStyles.optionText, { color: colors.textPrimary }, isSelected && { fontWeight: '800', color: '#7C3AED' }]}>
                  {item.label}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={18} color="#7C3AED" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </TouchableOpacity>
  </Modal>
);


const FacultyFoundationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();

  const [selectedPhase, setSelectedPhase] = useState(PHASE_OPTIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [studentList, setStudentList] = useState([]);
  const [modalType, setModalType] = useState(null);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const batchcd = selectedPhase.value === '1' ? 66 : selectedPhase.value === '2' ? 63 : 60;
      const phaseNum = parseInt(selectedPhase.value, 10);
      const cbmeyNum = phaseNum;

      const data = await getFoundationStudentList(accessToken, {
        colg_cd: 11,
        course_cd: 1,
        batch_cd: batchcd,
        phase: phaseNum,
        sub_code: "F",
        compcode: "",
        verified_dt: "",
        cbmey: cbmeyNum,
        gcd: ""
      });

      const list = Array.isArray(data) ? data : [];
      setStudentList(list);
    } catch (err) {
      console.warn('[FacultyFoundation] load students failed:', err);
      Alert.alert('Error', 'Failed to load student list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPhase]);

  const handleStudentClick = (student) => {
    navigation.navigate('FacultyStudentFoundationDetail', { student });
  };



  const filteredStudents = studentList.filter(s => {
    const name = (s.Student_Name || s.stud_name || s.student_name || '').toLowerCase();
    const roll = (s.Roll_No || s.rollno || s.stud_roll_no || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || roll.includes(q);
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Foundation Verification</Text>
        <TouchableOpacity onPress={() => loadData(true)} style={styles.syncBtn}>
          <Ionicons name="refresh" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => setModalType('phase')} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.chipText, { color: colors.textPrimary }]}>{selectedPhase.label}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search Input */}
      <View style={{ paddingHorizontal: 16, marginVertical: 8 }}>
        <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by student name or roll no..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, fontSize: 13, color: colors.textPrimary, paddingVertical: 6 }}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonCard colors={colors} />
          <SkeletonCard colors={colors} />
          <SkeletonCard colors={colors} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(false); }} colors={['#7C3AED']} tintColor="#7C3AED" />}
        >
          {filteredStudents.map(student => {
            const rollNo = student.Roll_No || student.rollno || student.stud_roll_no;
            const name = student.Student_Name || student.stud_name || student.student_name;
            
            // Build profile pic URL
            const avatarUrl = `https://myportal.srms.ac.in/srMSERP/Registration/StudentDocument/11/${rollNo}/${rollNo}.jpg`;

            return (
              <TouchableOpacity
                key={rollNo}
                onPress={() => handleStudentClick(student)}
                activeOpacity={0.8}
                style={[styles.studentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.studentCardHeader}>
                  <StudentAvatar url={avatarUrl} name={name} colors={colors} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.studentName, { color: colors.textPrimary }]}>{name}</Text>
                    <Text style={[styles.studentRoll, { color: colors.textSecondary }]}>Roll No: {rollNo}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}

          {!loading && filteredStudents.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 60, gap: 10 }}>
              <MaterialIcons name="fact-check" size={52} color={colors.textMuted} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>No Students Found</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
                There are no students matching your query.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <DropdownModal visible={modalType === 'phase'} title="Select Batch / Phase" options={PHASE_OPTIONS} selectedValue={selectedPhase.value} onSelect={setSelectedPhase} onClose={() => setModalType(null)} colors={colors} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  syncBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '900' },
  filterBar: { paddingVertical: 10, borderBottomWidth: 1 },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 4 },
  chipText: { fontSize: 12, fontWeight: '600' },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 10, height: 40 },
  studentCard: { borderRadius: 14, marginHorizontal: 16, marginTop: 12, borderWidth: 1, overflow: 'hidden' },
  studentCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  studentName: { fontSize: 14, fontWeight: '800' },
  studentRoll: { fontSize: 12, marginTop: 2 },
  cardContent: { padding: 12, paddingTop: 0 },
  logBox: { borderRadius: 10, padding: 10, borderWidth: 1, marginTop: 4 },
  remarksInput: { borderWidth: 1.5, borderRadius: 10, padding: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  remarksView: { borderWidth: 1, borderRadius: 10, padding: 10 },
  verifyBtn: { backgroundColor: '#7C3AED', height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  verifyBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' }
});

const ddStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
  title: { fontSize: 16, fontWeight: '900', marginBottom: 12 },
  optionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  optionText: { fontSize: 14 }
});

export default FacultyFoundationScreen;
