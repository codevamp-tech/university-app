import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  TextInput, Dimensions, Animated, ActivityIndicator, Alert, Modal, Image
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getFoundationData, updateFoundationLogbook } from '../../data/apiService';

const { width } = Dimensions.get('window');

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

const StudentAvatar = ({ url, name }) => {
  const [error, setError] = useState(false);
  const displayInitial = (name || 'S').charAt(0).toUpperCase();

  if (error || !url) {
    return (
      <LinearGradient
        colors={['#7C3AED', '#5B21B6']}
        style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>{displayInitial}</Text>
      </LinearGradient>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E2E8F0' }}
      onError={() => setError(true)}
    />
  );
};

const FacultyStudentFoundationDetailScreen = ({ route, navigation }) => {
  const { student } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useUser();

  const rollNo = student.Roll_No || student.rollno || student.stud_roll_no;
  const studentName = student.Student_Name || student.stud_name || student.student_name;
  const avatarUrl = `https://myportal.srms.ac.in/srMSERP/Registration/StudentDocument/11/${rollNo}/${rollNo}.jpg`;

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [verifyForms, setVerifyForms] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending' | 'verified'
  const [expandedLogs, setExpandedLogs] = useState({}); // { [idx]: boolean }

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getFoundationData(studentName, rollNo);
      const list = Array.isArray(data) ? data : [];

      const getLogTimestamp = (logObj) => {
        try {
          const dStr = logObj.date || logObj.fd_date;
          const dObj = parseMicrosoftDate(dStr);
          if (dObj && !isNaN(dObj.getTime())) {
            return dObj.getTime();
          }
        } catch (_) {}
        return 0;
      };

      // Sort descending (latest first)
      const sorted = [...list].sort((a, b) => getLogTimestamp(b) - getLogTimestamp(a));
      setLogs(sorted);
      setExpandedLogs({}); // default closed

      const formsObj = {};
      sorted.forEach((log, idx) => {
        formsObj[`${rollNo}_${idx}`] = { remarks: '' };
      });
      setVerifyForms(formsObj);
    } catch (err) {
      console.warn('[FacultyStudentFoundationDetail] fetch error:', err);
      Alert.alert('Error', 'Failed to load foundation entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const updateRemarks = (idx, val) => {
    const formKey = `${rollNo}_${idx}`;
    setVerifyForms(prev => ({
      ...prev,
      [formKey]: { ...prev[formKey], remarks: val }
    }));
  };

  const handleVerifyEntry = async (log, idx) => {
    const formKey = `${rollNo}_${idx}`;
    const form = verifyForms[formKey] || {};

    if (!form.remarks || form.remarks.trim() === '') {
      Alert.alert('Remarks Required', 'Please add remarks before verifying.');
      return;
    }

    setSubmitting(formKey);
    try {
      const verPayload = {
        rollno: String(rollNo),
        depart: 'Foundation',
        fdid: String(log.ugfdid || log.id || log.fd_id || ''),
        remarks: form.remarks.trim(),
        empid: String(user?.emp_id || ''),
      };
      
      const res = await updateFoundationLogbook(verPayload);
      if (res === '1') {
        Alert.alert('Success', `Entry verified successfully!`);
        
        // Update locally
        setLogs(prev => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            fd_status: '1',
            fd_verfiedby: user?.name || 'Faculty',
            fd_remarks: form.remarks.trim(),
          };
          return next;
        });
      } else {
        throw new Error('Verification failed.');
      }
    } catch (err) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  const filteredLogs = logs.filter(log => {
    const isVer = log.fd_status === '1' || log.fd_status === 1 || !!log.fd_verfiedby;
    if (filterTab === 'pending') return !isVer;
    if (filterTab === 'verified') return isVer;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Foundation Logs</Text>
        <TouchableOpacity onPress={fetchLogs} style={styles.syncBtn}>
          <Ionicons name="refresh" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Student Banner */}
      <View style={[styles.studentBanner, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <StudentAvatar url={avatarUrl} name={studentName} />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[styles.studentName, { color: colors.textPrimary }]}>{studentName}</Text>
          <Text style={[styles.studentRoll, { color: colors.textSecondary }]}>Roll No: {rollNo}</Text>
        </View>
      </View>

      {/* Mini Segment Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {['all', 'pending', 'verified'].map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilterTab(tab)}
            style={[
              styles.tabBtn,
              filterTab === tab && { borderBottomColor: '#7C3AED' }
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: filterTab === tab ? '#7C3AED' : colors.textSecondary },
                filterTab === tab && { fontWeight: '800' }
              ]}
            >
              {tab.toUpperCase()} ({
                tab === 'all' ? logs.length :
                tab === 'pending' ? logs.filter(l => !(l.fd_status === '1' || l.fd_status === 1 || !!l.fd_verfiedby)).length :
                logs.filter(l => (l.fd_status === '1' || l.fd_status === 1 || !!l.fd_verfiedby)).length
              })
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 10 }}>Loading foundation logs...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}>
          {filteredLogs.map((log, lIdx) => {
            const formKey = `${rollNo}_${lIdx}`;
            const form = verifyForms[formKey] || { remarks: '' };
            const isSub = submitting === formKey;
            const isExpanded = !!expandedLogs[lIdx];
            const isVerified = log.fd_status === '1' || log.fd_status === 1 || !!log.fd_verfiedby;

            return (
              <View key={lIdx} style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Entry Header Info (Accordion Trigger) */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setExpandedLogs(prev => ({ ...prev, [lIdx]: !prev[lIdx] }))}
                  style={styles.entryHeader}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.topicText, { color: colors.textPrimary }]}>Topic: {log.fd_topic || log.topic}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
                      <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {formatMicrosoftDate(log.date || log.fd_date)} · {formatMicrosoftTime(log.time || log.fd_time)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6, marginLeft: 8 }}>
                    {isVerified ? (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#FFF" style={{ marginRight: 3 }} />
                        <Text style={styles.verifiedBadgeText}>Verified</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Pending</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700' }}>
                        {isExpanded ? 'Hide Info' : 'Read Info'}
                      </Text>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={15} color={colors.textSecondary} />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Question & Answer Sections (Collapsible Accordion) */}
                {isExpanded && (
                  <View style={styles.questionsContainer}>
                    {[
                      { q: 'WHAT HAPPENED? (Describe the session/experience)', a: log.fd_reflection || log.reflection },
                      { q: 'SO WHAT? (Your learnings, insights and feelings)', a: log.reflection1 },
                      { q: 'WHAT NEXT? (Action points and future application)', a: log.reflection2 },
                    ].map(({ q, a }, qIdx) => a ? (
                      <View key={qIdx} style={[styles.qBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderColor: colors.border }]}>
                        <Text style={[styles.questionLabel, { color: '#7C3AED' }]}>{q}</Text>
                        <Text style={[styles.answerText, { color: colors.textPrimary }]}>{a}</Text>
                      </View>
                    ) : null)}
                  </View>
                )}

                {/* Selected/Assigned Faculty Info */}
                {log.fd_faculty_name || log.facultyName ? (
                  <View style={styles.assignedFacultyBox}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>Assigned Faculty: </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }}>
                      {log.fd_faculty_name || log.facultyName}
                    </Text>
                  </View>
                ) : null}

                {/* Verification Actions */}
                {isVerified ? (
                  <View style={[styles.remarksContainer, { borderTopColor: colors.border }]}>
                    <Text style={[styles.remarksHeader, { color: colors.textSecondary }]}>FACULTY REMARKS</Text>
                    <View style={[styles.remarksBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : '#F9FAFB', borderColor: colors.border }]}>
                      <Text style={{ fontSize: 13, color: colors.textPrimary, fontStyle: 'italic' }}>
                        "{log.fd_remarks || 'No remarks provided'}"
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 }}>
                      Verified by {log.fd_verfiedby || 'Faculty'}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.actionContainer, { borderTopColor: colors.border }]}>
                    <Text style={[styles.remarksHeader, { color: colors.textSecondary }]}>FACULTY REMARKS *</Text>
                    <TextInput
                      value={form.remarks}
                      onChangeText={v => updateRemarks(lIdx, v)}
                      placeholder="Add remarks for verification..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      style={[styles.remarksInput, { borderColor: form.remarks.trim() ? colors.border : '#FCA5A5', color: colors.textPrimary }]}
                    />
                    <TouchableOpacity
                      onPress={() => handleVerifyEntry(log, lIdx)}
                      disabled={isSub}
                      style={[styles.verifyBtn, { opacity: isSub ? 0.7 : 1 }]}
                    >
                      {isSub ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.verifyBtnText}>Verify Entry</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          {!loading && filteredLogs.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 80, gap: 8 }}>
              <Ionicons name="documents-outline" size={48} color={colors.textMuted} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>No Entries</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
                No foundation logbook entries match this tab.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  syncBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '900' },
  studentBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  studentName: { fontSize: 15, fontWeight: '900' },
  studentRoll: { fontSize: 12, marginTop: 2 },
  tabBar: { flexDirection: 'row', height: 42, borderBottomWidth: 1 },
  tabBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '600' },
  entryCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, elevation: 1, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  topicText: { fontSize: 14, fontWeight: '900', flex: 1, paddingRight: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  verifiedBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  pendingBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pendingBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  questionsContainer: { marginVertical: 12, gap: 10 },
  qBox: { borderLeftWidth: 3, borderLeftColor: '#7C3AED', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 0.5 },
  questionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  answerText: { fontSize: 13, lineHeight: 19 },
  assignedFacultyBox: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)', marginBottom: 8 },
  remarksContainer: { borderTopWidth: 1, paddingTop: 12 },
  remarksHeader: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  remarksBox: { borderWidth: 1, borderRadius: 10, padding: 10 },
  actionContainer: { borderTopWidth: 1, paddingTop: 12 },
  remarksInput: { borderWidth: 1.5, borderRadius: 10, padding: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  verifyBtn: { backgroundColor: '#7C3AED', height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  verifyBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' }
});

const ddStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
  title: { fontSize: 16, fontWeight: '900', marginBottom: 12 },
  optionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  optionText: { fontSize: 14 }
});

export default FacultyStudentFoundationDetailScreen;
