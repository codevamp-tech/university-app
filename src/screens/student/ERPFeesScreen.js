import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ERPFeesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('ERPHome')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#312E81" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fees & Payments</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color="#EA580C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero: Total Outstanding */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={['#8B4B00', '#FE9832']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>OUTSTANDING DUES</Text>
            <Text style={styles.heroAmount}>₹ 48,500</Text>
            <Text style={styles.heroSub}>Academic Year 2024-25 | VII Semester</Text>
            <View style={styles.heroBtns}>
              <TouchableOpacity style={styles.payNowBtn}>
                <MaterialIcons name="payments" size={18} color="#8B4B00" />
                <Text style={styles.payNowText}>Pay Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ledgerBtn}>
                <MaterialIcons name="download" size={18} color="#FFFFFF" />
                <Text style={styles.ledgerText}>Full Ledger</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Semester Fees */}
        <View style={styles.sectionContainer}>
          <View style={styles.feeCard}>
            <View style={styles.feeCardHeader}>
              <View>
                <Text style={styles.feeCardTitle}>Semester Fees</Text>
                <Text style={styles.feeCardSub}>B.Tech Computer Science Engineering</Text>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>PENDING</Text>
              </View>
            </View>

            <View style={styles.feeRow}>
              <View>
                <Text style={styles.feeLabel}>Tuition Fee</Text>
                <Text style={styles.feeDue}>Due Date: 15 Aug 2024</Text>
              </View>
              <Text style={styles.feeAmount}>₹ 42,000</Text>
            </View>

            <View style={styles.feeRow}>
              <View>
                <Text style={styles.feeLabel}>Development Fee</Text>
                <Text style={styles.feeDue}>Mandatory annual component</Text>
              </View>
              <Text style={styles.feeAmount}>₹ 6,500</Text>
            </View>
          </View>
        </View>

        {/* Hostel & Exam */}
        <View style={styles.sectionContainer}>
          <View style={styles.sideBySide}>
            <LinearGradient colors={['rgba(141,237,236,0.3)', 'rgba(141,237,236,0.15)']} style={styles.hostelCard}>
              <View style={styles.hostelHeader}>
                <Text style={styles.hostelTitle}>Hostel Fee</Text>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidText}>PAID</Text>
                </View>
              </View>
              <Text style={styles.hostelAmount}>₹ 35,000</Text>
              <Text style={styles.hostelSub}>Himalaya Hostel - Room 302</Text>
            </LinearGradient>

            <View style={styles.examCard}>
              <View style={styles.hostelHeader}>
                <Text style={[styles.hostelTitle, { color: '#4953AC' }]}>Exam Fees</Text>
                <View style={[styles.paidBadge, { backgroundColor: '#CBCEFF' }]}>
                  <Text style={[styles.paidText, { color: '#343D96' }]}>PAID</Text>
                </View>
              </View>
              <Text style={[styles.hostelAmount, { color: '#4953AC' }]}>₹ 2,500</Text>
              <Text style={styles.hostelSub}>Odd Sem 2024 (Reg)</Text>
            </View>
          </View>
        </View>

        {/* Quick Pay Integration */}
        <View style={styles.sectionContainer}>
          <View style={styles.quickPayCard}>
            <View style={styles.quickPayHeader}>
              <MaterialIcons name="account-balance-wallet" size={24} color="#8B4B00" />
              <Text style={styles.quickPayTitle}>Quick Pay Integration</Text>
            </View>
            <View style={styles.payGrid}>
              {[
                { icon: 'qr-code-2', label: 'UPI Apps' },
                { icon: 'account-balance', label: 'Net Banking' },
                { icon: 'credit-card', label: 'Debit/Credit' },
                { icon: 'history-edu', label: 'Bank Challan' },
              ].map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.payGridItem}>
                  <View style={styles.payGridIcon}>
                    <MaterialIcons name={item.icon} size={24} color="#64748B" />
                  </View>
                  <Text style={styles.payGridLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionContainer}>
          <View style={styles.transHeader}>
            <Text style={styles.transTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transCard}>
            <View style={[styles.transIcon, { backgroundColor: '#FFF7ED' }]}>
              <MaterialIcons name="receipt-long" size={24} color="#8B4B00" />
            </View>
            <View style={styles.transInfo}>
              <Text style={styles.transName}>Hostel Admission Fee</Text>
              <Text style={styles.transId}>Transaction ID: #INV-982341 | 12 Jul 2024</Text>
            </View>
            <View style={styles.transRight}>
              <Text style={styles.transAmount}>₹ 35,000</Text>
              <Text style={styles.transSuccess}>SUCCESS</Text>
            </View>
            <TouchableOpacity style={styles.transDownload}>
              <MaterialIcons name="download" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.transCard}>
            <View style={[styles.transIcon, { backgroundColor: '#F1F5F9' }]}>
              <MaterialIcons name="grade" size={24} color="#94A3B8" />
            </View>
            <View style={styles.transInfo}>
              <Text style={styles.transName}>Carry Over Exam Fee</Text>
              <Text style={styles.transId}>Transaction ID: #INV-982105 | 05 Jun 2024</Text>
            </View>
            <View style={styles.transRight}>
              <Text style={styles.transAmount}>₹ 1,500</Text>
              <Text style={styles.transSuccess}>SUCCESS</Text>
            </View>
            <TouchableOpacity style={styles.transDownload}>
              <MaterialIcons name="download" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* University Footer */}
        <View style={styles.sectionContainer}>
          <LinearGradient colors={['#312E81', '#1E1B4B']} style={styles.footerCard}>
            <Text style={styles.footerTitle}>Invertis University</Text>
            <Text style={styles.footerAddr}>
              NH-24, Bareilly-Lucknow Highway,{'\n'}
              Bareilly, Uttar Pradesh 243123{'\n'}
              Contact: +91 0581-2460442
            </Text>
            <View style={styles.footerInfo}>
              <View>
                <Text style={styles.footerInfoLabel}>FINANCE HELPDESK</Text>
                <Text style={styles.footerInfoText}>finance@invertis.org</Text>
              </View>
              <View style={styles.footerDivider} />
              <View>
                <Text style={styles.footerInfoLabel}>TIMING</Text>
                <Text style={styles.footerInfoText}>09:00 AM - 04:30 PM</Text>
              </View>
            </View>
            <View style={styles.footerBar} />
          </LinearGradient>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F7' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#312E81', letterSpacing: -0.5 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 20 },
  sectionContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  heroCard: {
    borderRadius: 20, padding: 28, overflow: 'hidden',
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  heroLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 2, marginBottom: 4 },
  heroAmount: { fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1.5 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginTop: 4 },
  heroBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  payNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  payNowText: { fontWeight: '800', color: '#8B4B00', fontSize: 14 },
  ledgerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(122,65,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14,
  },
  ledgerText: { fontWeight: '800', color: '#FFFFFF', fontSize: 14 },
  feeCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  feeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  feeCardTitle: { fontSize: 18, fontWeight: '900', color: '#4953AC', letterSpacing: -0.3 },
  feeCardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  pendingBadge: { backgroundColor: '#F95630', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pendingBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  feeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#EFF1F2', borderRadius: 12, padding: 16, marginBottom: 10,
  },
  feeLabel: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  feeDue: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  feeAmount: { fontSize: 18, fontWeight: '900', color: '#4953AC' },
  sideBySide: { gap: 12 },
  hostelCard: { borderRadius: 20, padding: 20, borderBottomWidth: 4, borderBottomColor: '#006666' },
  examCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  hostelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  hostelTitle: { fontSize: 17, fontWeight: '800', color: '#006666' },
  hostelAmount: { fontSize: 26, fontWeight: '900', color: '#006666' },
  hostelSub: { fontSize: 11, color: 'rgba(0,102,102,0.7)', marginTop: 2 },
  paidBadge: { backgroundColor: '#006666', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  paidText: { fontSize: 8, fontWeight: '900', color: '#BBFFFE', letterSpacing: 0.5 },
  quickPayCard: { backgroundColor: '#E6E8EA', borderRadius: 20, padding: 24 },
  quickPayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  quickPayTitle: { fontSize: 19, fontWeight: '900', color: '#1F2937' },
  payGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  payGridItem: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', gap: 10,
    width: (width - 32 - 48 - 12) / 2,
  },
  payGridIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  payGridLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  transHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  transTitle: { fontSize: 22, fontWeight: '900', color: '#312E81', letterSpacing: -0.5 },
  viewAllText: { fontSize: 13, fontWeight: '700', color: '#8B4B00' },
  transCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  transIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  transInfo: { flex: 1 },
  transName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  transId: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  transRight: { alignItems: 'flex-end' },
  transAmount: { fontSize: 16, fontWeight: '900', color: '#4953AC' },
  transSuccess: { fontSize: 8, fontWeight: '900', color: '#006666', letterSpacing: 0.5, marginTop: 2 },
  transDownload: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center',
  },
  footerCard: { borderRadius: 28, padding: 28, overflow: 'hidden', marginTop: 12 },
  footerTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 12 },
  footerAddr: { fontSize: 13, color: 'rgba(199,210,254,0.8)', lineHeight: 20, marginBottom: 20 },
  footerInfo: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  footerInfoLabel: { fontSize: 9, fontWeight: '800', color: '#F97316', letterSpacing: 1, marginBottom: 4 },
  footerInfoText: { fontSize: 13, color: '#FFFFFF', fontWeight: '500' },
  footerDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  footerBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#F97316' },
});

export default ERPFeesScreen;
