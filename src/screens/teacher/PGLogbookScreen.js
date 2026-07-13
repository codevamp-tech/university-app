import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const MOCK_PG_SUBMISSIONS = [
  { id: '1', studentName: 'Dr. Rakesh Iyer', rollNo: '2025PGPHY003', year: 'PG 1st Year', activity: 'Seminar presentation: Neural Regulation of Respiration', category: 'Seminar', date: '3 hours ago', verified: false },
  { id: '2', studentName: 'Dr. Shruti Sen', rollNo: '2025PGPHY001', year: 'PG 2nd Year', activity: 'Clinical case review: Primary Adrenal Insufficiency', category: 'Clinical Posting', date: '1 day ago', verified: false },
  { id: '3', studentName: 'Dr. Kabir Malik', rollNo: '2024PGPHY005', year: 'PG 3rd Year', activity: 'Research progress: Analysis of heart rate variability in obese adults', category: 'Thesis Review', date: '3 days ago', verified: true },
  { id: '4', studentName: 'Dr. Anaya Roy', rollNo: '2025PGPHY009', year: 'PG 1st Year', activity: 'Journal Club: Review of microRNA markers in cardiac hypertrophy', category: 'Journal Club', date: '4 days ago', verified: false },
];

const PGLogbookScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [submissions, setSubmissions] = useState(MOCK_PG_SUBMISSIONS);
  const [activeTab, setActiveTab] = useState('pending'); // pending or verified

  const handleVerify = (id) => {
    Alert.alert(
      'Verify Postgraduate Log',
      'Do you confirm this PG student has completed the presented academic milestone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Verify',
          onPress: () => {
            setSubmissions(prev =>
              prev.map(sub => sub.id === id ? { ...sub, verified: true } : sub)
            );
            Alert.alert('Approved', 'PG log entry has been verified successfully!');
          }
        }
      ]
    );
  };

  const displayedList = submissions.filter(s =>
    activeTab === 'pending' ? !s.verified : s.verified
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('TeacherMain')} style={styles.backButton}>
          <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.backButtonBg}>
            <Ionicons name="arrow-back" size={20} color="#EA580C" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PG Logbook Verifier</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Awaiting Verification ({submissions.filter(s => !s.verified).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'verified' && styles.tabActive]}
          onPress={() => setActiveTab('verified')}
        >
          <Text style={[styles.tabText, activeTab === 'verified' && styles.tabTextActive]}>
            Approved Logs ({submissions.filter(s => s.verified).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {displayedList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={activeTab === 'pending' ? 'clipboard-check-multiple-outline' : 'checkbox-marked-circle-outline'}
            size={48}
            color="#D1D5DB"
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.emptyText}>
            {activeTab === 'pending' ? 'All caught up!' : 'No approved logs found'}
          </Text>
          <Text style={styles.emptySub}>
            {activeTab === 'pending'
              ? 'No postgraduate submissions require your verification right now.'
              : 'Approve PG clinical cases or thesis reviews to see them here.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {displayedList.map(item => (
            <LinearGradient
              key={item.id}
              colors={['#FFFFFF', '#F9FAFB']}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.studentName}>{item.studentName}</Text>
                  <Text style={styles.rollNo}>{item.rollNo}  ·  {item.year}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.badgeText, { color: '#2563EB' }]}>{item.category}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.body}>
                <Text style={styles.activityLabel}>PG LOG DETAIL</Text>
                <Text style={styles.activityText}>{item.activity}</Text>

                <View style={styles.metaGrid}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>LOGGED DATE</Text>
                    <Text style={styles.metaVal}>{item.date}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>VERIFIER ROLE</Text>
                    <Text style={styles.metaVal}>Department Faculty</Text>
                  </View>
                </View>
              </View>

              {!item.verified ? (
                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={() => handleVerify(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.verifyBtnText}>Approve Submission</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.verifiedRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.verifiedLabel}>Approved & Locked</Text>
                </View>
              )}
            </LinearGradient>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  backButtonBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  tabContainer: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 4,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#EA580C' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '700' },
  tabTextActive: { color: '#EA580C' },
  scroll: { paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: '800', color: '#4B5563', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  card: {
    borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  studentName: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 2 },
  rollNo: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  cardDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  body: { gap: 10 },
  activityLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '800', letterSpacing: 0.8 },
  activityText: { fontSize: 13, color: '#1F2937', fontWeight: '700', lineHeight: 18 },
  metaGrid: { flexDirection: 'row', marginTop: 6, gap: 16 },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 8, color: '#9CA3AF', fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  metaVal: { fontSize: 11, color: '#4B5563', fontWeight: '700' },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EA580C', borderRadius: 14, paddingVertical: 11, marginTop: 16,
  },
  verifyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  verifiedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
    borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 12,
  },
  verifiedLabel: { color: '#10B981', fontSize: 12, fontWeight: '800' },
});

export default PGLogbookScreen;
