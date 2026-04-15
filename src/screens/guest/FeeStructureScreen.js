import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FeeStructureScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('UG');

  const tabs = ['UG', 'PG', 'Diploma'];

  const feeData = {
    UG: [
      {
        program: 'B.Tech (All Branches)',
        year1: '₹95,000',
        year2: '₹95,000',
        year3: '₹95,000',
        year4: '₹95,000',
        total: '₹3,80,000',
        color: ['#4338CA', '#312E81'],
        icon: 'laptop-code',
      },
      {
        program: 'BCA / B.Sc CS',
        year1: '₹65,000',
        year2: '₹65,000',
        year3: '₹65,000',
        year4: '-',
        total: '₹1,95,000',
        color: ['#0891B2', '#065F73'],
        icon: 'code',
      },
      {
        program: 'BBA / B.Com',
        year1: '₹55,000',
        year2: '₹55,000',
        year3: '₹55,000',
        year4: '-',
        total: '₹1,65,000',
        color: ['#EA580C', '#9A3412'],
        icon: 'briefcase',
      },
      {
        program: 'LL.B (3 Year)',
        year1: '₹75,000',
        year2: '₹75,000',
        year3: '₹75,000',
        year4: '-',
        total: '₹2,25,000',
        color: ['#B45309', '#78350F'],
        icon: 'gavel',
      },
      {
        program: 'B.Sc Agriculture',
        year1: '₹70,000',
        year2: '₹70,000',
        year3: '₹70,000',
        year4: '₹70,000',
        total: '₹2,80,000',
        color: ['#65A30D', '#4D7C0F'],
        icon: 'leaf',
      },
    ],
    PG: [
      {
        program: 'M.Tech (All Branches)',
        year1: '₹85,000',
        year2: '₹85,000',
        year3: '-',
        year4: '-',
        total: '₹1,70,000',
        color: ['#4338CA', '#312E81'],
        icon: 'cpu',
      },
      {
        program: 'MBA (All Specializations)',
        year1: '₹1,10,000',
        year2: '₹1,10,000',
        year3: '-',
        year4: '-',
        total: '₹2,20,000',
        color: ['#EA580C', '#9A3412'],
        icon: 'briefcase',
      },
      {
        program: 'MCA',
        year1: '₹80,000',
        year2: '₹80,000',
        year3: '-',
        year4: '-',
        total: '₹1,60,000',
        color: ['#0891B2', '#065F73'],
        icon: 'code',
      },
      {
        program: 'LL.M',
        year1: '₹90,000',
        year2: '₹90,000',
        year3: '-',
        year4: '-',
        total: '₹1,80,000',
        color: ['#B45309', '#78350F'],
        icon: 'gavel',
      },
    ],
    Diploma: [
      {
        program: 'Diploma in CS / IT',
        year1: '₹45,000',
        year2: '₹45,000',
        year3: '₹45,000',
        year4: '-',
        total: '₹1,35,000',
        color: ['#16A34A', '#0A6C34'],
        icon: 'monitor',
      },
      {
        program: 'Diploma in EC / EE',
        year1: '₹48,000',
        year2: '₹48,000',
        year3: '₹48,000',
        year4: '-',
        total: '₹1,44,000',
        color: ['#7C3AED', '#5B21B6'],
        icon: 'zap',
      },
    ],
  };

  const scholarships = [
    { label: 'Merit Scholarship (>90%)', discount: 'Up to 50% waiver', color: '#16A34A' },
    { label: 'Sports Quota', discount: 'Up to 30% waiver', color: '#4338CA' },
    { label: 'SC/ST Category', discount: 'As per UP Govt norms', color: '#EA580C' },
    { label: 'EWS / OBC Category', discount: 'As per UP Govt norms', color: '#0891B2' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Fee Structure</Text>
          <Text style={styles.headerSub}>Academic Year 2025–26</Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="cash-multiple" size={22} color="#FFFFFF" />
        </View>
      </LinearGradient>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <MaterialIcons name="info-outline" size={16} color="#EA580C" />
        <Text style={styles.infoText}>Fees shown are per-annum. Hostel & mess charges are separate.</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Program Cards */}
        {feeData[activeTab].map((item, index) => (
          <View key={index} style={styles.feeCard}>
            <LinearGradient colors={item.color} style={styles.feeCardHeader}>
              <Feather name={item.icon} size={20} color="#FFFFFF" />
              <Text style={styles.feeCardTitle}>{item.program}</Text>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>Total</Text>
                <Text style={styles.totalAmount}>{item.total}</Text>
              </View>
            </LinearGradient>

            <View style={styles.feeGrid}>
              {[
                { label: 'Year 1', value: item.year1 },
                { label: 'Year 2', value: item.year2 },
                { label: 'Year 3', value: item.year3 },
                { label: 'Year 4', value: item.year4 },
              ].filter(r => r.value !== '-').map((row, i) => (
                <View key={i} style={styles.feeRow}>
                  <Text style={styles.feeLabel}>{row.label}</Text>
                  <Text style={styles.feeValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Scholarship Section */}
        <View style={styles.schSection}>
          <Text style={styles.schTitle}>Scholarships & Waivers</Text>
          {scholarships.map((s, i) => (
            <View key={i} style={styles.schRow}>
              <View style={[styles.schDot, { backgroundColor: s.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.schLabel}>{s.label}</Text>
                <Text style={[styles.schDiscount, { color: s.color }]}>{s.discount}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color="#9CA3AF" />
            </View>
          ))}
        </View>

        {/* EMI Note */}
        <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.emiCard}>
          <MaterialCommunityIcons name="bank-outline" size={28} color="#4338CA" />
          <View style={{ flex: 1 }}>
            <Text style={styles.emiTitle}>Education Loan Available</Text>
            <Text style={styles.emiDesc}>Tie-ups with SBI, PNB, Bank of Baroda with 0-cost EMI options for eligible students.</Text>
          </View>
        </LinearGradient>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#FFEDD5',
  },
  infoText: { fontSize: 12, color: '#9A3412', flex: 1, lineHeight: 17 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#EA580C' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '900' },
  scroll: { padding: 16 },
  feeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  feeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  feeCardTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  totalBadge: { alignItems: 'flex-end' },
  totalBadgeText: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  totalAmount: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  feeGrid: { paddingHorizontal: 16, paddingVertical: 12 },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  feeLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  feeValue: { fontSize: 14, fontWeight: '800', color: '#111827' },
  schSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  schTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  schRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  schDot: { width: 10, height: 10, borderRadius: 5 },
  schLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  schDiscount: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  emiCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  emiTitle: { fontSize: 15, fontWeight: '800', color: '#3730A3', marginBottom: 4 },
  emiDesc: { fontSize: 12, color: '#4338CA', lineHeight: 17 },
});

export default FeeStructureScreen;
