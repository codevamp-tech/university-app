import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { STUDENTS_LIST } from '../../constants/data';
import { APP_CONFIG } from '../../config/appConfig';

const MarkAttendanceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState(STUDENTS_LIST);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;

  const markAll = (status) => {
    setStudents(students.map(s => ({ ...s, status })));
  };

  const toggleStudent = (id, status) => {
    setStudents(students.map(s => s.id === id ? { ...s, status: s.status === status ? null : status } : s));
  };

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.includes(search);
    if (activeFilter === 'All') return matchSearch;
    if (activeFilter === 'Present') return matchSearch && s.status === 'present';
    if (activeFilter === 'Absent') return matchSearch && s.status === 'absent';
    return matchSearch;
  });

  const handleSubmit = () => {
    Alert.alert('Attendance Submitted', `Present: ${presentCount}, Absent: ${absentCount}`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Session Info */}
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTag}>SESSION IN PROGRESS</Text>
        <Text style={styles.sessionTitle}>Attendance: AI & ML</Text>
        <Text style={styles.sessionClass}>
          B.Tech CSE - 3rd Year • <Text style={styles.sessionSection}>Sec A</Text>
        </Text>
      </View>

      {/* Mark All */}
      <TouchableOpacity style={styles.markAllBtn} onPress={() => markAll('present')}>
        <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
        <Text style={styles.markAllText}>Mark All Present</Text>
      </TouchableOpacity>

      {/* Search & Filter */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name or roll no"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>SHOW:</Text>
          {['All', 'Present', 'Absent'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterBtnText, activeFilter === f && styles.filterBtnTextActive]}>
                {f} {f === 'All' ? `(${students.length})` : f === 'Present' ? `(${presentCount})` : `(${absentCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Students List */}
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        {filtered.map((student, i) => (
          <View key={student.id} style={styles.studentCard}>
            <View style={styles.studentNum}>
              <Text style={styles.studentNumText}>
                {String(i + 1).padStart(2, '0')}
              </Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentRoll}>ROLL NO: {student.rollNo}</Text>
            </View>
            <View style={styles.attendanceBtns}>
              <TouchableOpacity
                style={[styles.attBtn, student.status === 'present' && styles.presentActive]}
                onPress={() => toggleStudent(student.id, 'present')}
              >
                <Text style={[styles.attBtnText, student.status === 'present' && styles.attBtnTextActive]}>
                  PRESENT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.attBtn, student.status === 'absent' && styles.absentActive]}
                onPress={() => toggleStudent(student.id, 'absent')}
              >
                <Text style={[styles.attBtnText, student.status === 'absent' && { color: Colors.white }]}>
                  ABSENT
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitWrap}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.submitText}>Submit Attendance</Text>
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerName: { fontSize: 17, fontWeight: '800', color: Colors.primary, textAlign: 'center' },
  bellBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  sessionInfo: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white },
  sessionTag: { fontSize: 10, color: Colors.primary, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  sessionTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary, marginBottom: 4 },
  sessionClass: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  sessionSection: { color: Colors.danger, fontWeight: '700' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.background, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  markAllText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  filterLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterBtnTextActive: { color: Colors.white },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },
  studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, gap: 10 },
  studentNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  studentNumText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  studentRoll: { fontSize: 11, color: Colors.textSecondary },
  attendanceBtns: { flexDirection: 'row', gap: 6 },
  attBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  presentActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  absentActive: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  attBtnText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  attBtnTextActive: { color: Colors.white },
  submitWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  submitText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});

export default MarkAttendanceScreen;
