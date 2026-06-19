import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { getFees, payFee, getTransactions } from '../../data/apiService';

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ERPFeesScreen = ({ navigation }) => {
  const { user, accessToken } = useUser();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [apiFees, setApiFees] = React.useState([]);
  const [transactions, setTransactions] = React.useState([]);
  const [fallbackPaid, setFallbackPaid] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const semNum = parseInt(user?.semester) || 7;
  const displaySem = roman[semNum - 1] || 'VII';

  const yearNum = parseInt(user?.year) || 4;
  const startYear = 2026 - yearNum;
  const currentAcademicYearStart = startYear + yearNum - 1;
  const currentAcademicYearEnd = currentAcademicYearStart + 1;
  const academicYearStr = `Academic Year ${currentAcademicYearStart}-${currentAcademicYearEnd.toString().slice(-2)}`;

  const idStr = user?.id || '';
  const idNum = parseInt(idStr.replace(/[^0-9]/g, '')) || 1;

  // Find if fees are paid in API
  const tuitionPaid = apiFees.find(f => f.type === 'tuition')?.status === 'paid';
  const devPaid = apiFees.find(f => f.type === 'development')?.status === 'paid';

  const outstandingDuesVal = fallbackPaid ? 0 : apiFees.filter(f => f.status !== 'paid').reduce((acc, f) => acc + (f.amount || 0), 0);

  React.useEffect(() => {
    async function loadFees() {
      if (!accessToken) return;
      try {
        const data = await getFees(accessToken);
        if (data) {
          setApiFees(data);
        }
      } catch (err) {
        console.warn('[FeesScreen] Error loading fees:', err);
      }
      try {
        const txData = await getTransactions(accessToken);
        if (txData) {
          setTransactions(txData);
        }
      } catch (err) {
        console.warn('[FeesScreen] Error loading transactions:', err);
      }
    }
    loadFees();
  }, [accessToken]);

  const handlePayNow = async () => {
    if (outstandingDuesVal === 0) {
      Alert.alert('No Dues', 'You have no outstanding dues to pay.');
      return;
    }
    setLoading(true);
    try {
      if (accessToken && apiFees.length > 0) {
        const pending = apiFees.filter(f => f.status !== 'paid');
        for (const fee of pending) {
          await payFee(accessToken, fee.id);
        }
        const data = await getFees(accessToken);
        if (data) setApiFees(data);
        Alert.alert('Payment Successful', 'All outstanding university fees have been paid via API.');
      } else {
        // Fallback simulation
        setFallbackPaid(true);
        Alert.alert('Payment Successful', 'Outstanding dues of ' + formatCurrency(outstandingDuesVal) + ' have been successfully paid.');
      }
    } catch (err) {
      Alert.alert('Payment Failed', err.message || 'An error occurred during payment.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) => {
    return '₹ ' + amt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const courseTitle = user?.course
    ? (user.branch && !user.course.includes(user.branch) ? `${user.course} - ${user.branch}` : user.course)
    : 'B.Tech Computer Science Engineering';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('ERPHome')} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Fees & Payments</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>



      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero: Total Outstanding */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={isDark ? ['#7C2D12', '#431407'] : ['#F97316', '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >

            <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.7)' }]}>OUTSTANDING DUES</Text>
            <Text style={styles.heroAmount}>{formatCurrency(outstandingDuesVal)}</Text>
            <Text style={[styles.heroSub, { color: 'rgba(255,255,255,0.85)' }]}>{academicYearStr} | {displaySem} Semester</Text>
            <View style={styles.heroBtns}>
              <TouchableOpacity 
                style={[styles.payNowBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' }]}
                onPress={handlePayNow}
                disabled={loading}
              >
                <MaterialIcons name="payments" size={18} color={isDark ? '#FFFFFF' : '#EA580C'} />
                <Text style={[styles.payNowText, { color: isDark ? '#FFFFFF' : '#EA580C' }]}>
                  {loading ? 'Paying...' : 'Pay Now'}
                </Text>
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
          <View style={[styles.feeCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.feeCardHeader}>
              <View>
                <Text style={[styles.feeCardTitle, { color: colors.textPrimary }]}>{displaySem} Semester Fees</Text>
                <Text style={[styles.feeCardSub, { color: colors.textSecondary }]}>{courseTitle}</Text>
              </View>
              <View style={[
                styles.pendingBadge, 
                { backgroundColor: outstandingDuesVal === 0 ? (isDark ? 'rgba(52, 211, 153, 0.2)' : '#059669') : (isDark ? 'rgba(239, 68, 68, 0.2)' : '#F95630') }
              ]}>
                <Text style={[
                  styles.pendingBadgeText, 
                  { color: outstandingDuesVal === 0 ? (isDark ? '#34D399' : '#FFFFFF') : (isDark ? '#EF4444' : '#FFFFFF') }
                ]}>
                  {outstandingDuesVal === 0 ? 'PAID' : 'PENDING'}
                </Text>
              </View>
            </View>

            {apiFees.filter(f => f.type !== 'hostel' && f.type !== 'exam').length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>No outstanding semester fees</Text>
              </View>
            ) : (
              apiFees.filter(f => f.type !== 'hostel' && f.type !== 'exam').map((fee) => (
                <View key={fee.id} style={[styles.feeRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB' }]}>
                  <View>
                    <Text style={[styles.feeLabel, { color: colors.textPrimary }]}>{fee.type ? fee.type.charAt(0).toUpperCase() + fee.type.slice(1) : 'Fee'}</Text>
                    <Text style={[styles.feeDue, { color: colors.textSecondary }]}>Due Date: {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A'}</Text>
                  </View>
                  <Text style={[styles.feeAmount, { color: colors.primary }]}>{formatCurrency(fee.amount || 0)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Hostel & Exam Fees */}
        {apiFees.some(f => f.type === 'hostel' || f.type === 'exam') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sideBySide}>
              {apiFees.filter(f => f.type === 'hostel').map((f) => (
                <LinearGradient
                  key={f.id}
                  colors={isDark ? ['#064E3B', '#111827'] : ['#ECFDF5', '#DCFCE7']}
                  style={[styles.hostelCard, { borderBottomColor: isDark ? '#34D399' : '#059669', borderWidth: 1, borderColor: colors.border }]}
                >
                  <View style={styles.hostelHeader}>
                    <Text style={[styles.hostelTitle, { color: isDark ? '#34D399' : '#059669' }]}>Hostel Fee</Text>
                    <View style={[styles.paidBadge, { backgroundColor: f.status === 'paid' ? (isDark ? 'rgba(52, 211, 153, 0.2)' : '#059669') : '#EF4444' }]}>
                      <Text style={[styles.paidText, { color: f.status === 'paid' ? (isDark ? '#34D399' : '#FFFFFF') : '#FFFFFF' }]}>{f.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={[styles.hostelAmount, { color: colors.textPrimary }]}>{formatCurrency(f.amount || 0)}</Text>
                  <Text style={[styles.hostelSub, { color: colors.textSecondary }]}>Himalaya Hostel - Room 302</Text>
                </LinearGradient>
              ))}

              {apiFees.filter(f => f.type === 'exam').map((f) => (
                <View key={f.id} style={[styles.examCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                  <View style={styles.hostelHeader}>
                    <Text style={[styles.hostelTitle, { color: colors.primary }]}>Exam Fees</Text>
                    <View style={[styles.paidBadge, { backgroundColor: f.status === 'paid' ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7') : '#EF4444' }]}>
                      <Text style={[styles.paidText, { color: f.status === 'paid' ? (isDark ? '#34D399' : '#059669') : '#FFFFFF' }]}>{f.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={[styles.hostelAmount, { color: colors.textPrimary }]}>{formatCurrency(f.amount || 0)}</Text>
                  <Text style={[styles.hostelSub, { color: colors.textSecondary }]}>Odd Sem 2024 (Reg)</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Pay Integration */}
        <View style={styles.sectionContainer}>
          <View style={[styles.quickPayCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.quickPayHeader}>
              <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
              <Text style={[styles.quickPayTitle, { color: colors.textPrimary }]}>Quick Pay Integration</Text>
            </View>
            <View style={styles.payGrid}>
              {[
                { icon: 'qr-code-2', label: 'UPI Apps' },
                { icon: 'account-balance', label: 'Net Banking' },
                { icon: 'credit-card', label: 'Debit/Credit' },
                { icon: 'history-edu', label: 'Bank Challan' },
              ].map((item, idx) => (
                <TouchableOpacity key={idx} style={[styles.payGridItem, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                  <View style={[styles.payGridIcon, { backgroundColor: isDark ? colors.card : '#F1F5F9' }]}>
                    <MaterialIcons name={item.icon} size={24} color={isDark ? '#818CF8' : '#4338CA'} />
                  </View>
                  <Text style={[styles.payGridLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionContainer}>
          <View style={styles.transHeader}>
            <Text style={[styles.transTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderColor: colors.border, borderWidth: 1 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>No transactions available</Text>
            </View>
          ) : (
            transactions.slice(0, 5).map((t) => (
              <View key={t.id} style={[styles.transCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <View style={[styles.transIcon, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED' }]}>
                  <MaterialIcons name="receipt-long" size={24} color={colors.primary} />
                </View>
                <View style={styles.transInfo}>
                  <Text style={[styles.transName, { color: colors.textPrimary }]}>{t.description || t.type || 'Transaction'}</Text>
                  <Text style={[styles.transId, { color: colors.textSecondary }]}>Transaction ID: #{t.id ? t.id.slice(0, 8).toUpperCase() : 'N/A'} | {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}</Text>
                </View>
                <View style={styles.transRight}>
                  <Text style={[styles.transAmount, { color: colors.primary }]}>{formatCurrency(t.amount || 0)}</Text>
                  <Text style={[styles.transSuccess, { color: isDark ? '#34D399' : '#059669' }]}>{t.status ? t.status.toUpperCase() : 'SUCCESS'}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* University Footer */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={isDark ? ['#1E1B4B', '#0F172A'] : ['#312E81', '#1E1B4B']}
            style={[styles.footerCard, { borderColor: isDark ? colors.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}
          >
            <Text style={styles.footerTitle}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
            <Text style={[styles.footerAddr, { color: isDark ? 'rgba(148, 163, 184, 0.8)' : 'rgba(199,210,254,0.8)' }]}>
              Main Campus, University Road{'\n'}
              City Campus, State 123456{'\n'}
              Contact: +91 000-000-0000
            </Text>
            <View style={styles.footerInfo}>
              <View>
                <Text style={styles.footerInfoLabel}>FINANCE HELPDESK</Text>
                <Text style={styles.footerInfoText}>finance@${APP_CONFIG.UNIVERSITY_DOMAIN}</Text>
              </View>
              <View style={[styles.footerDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' }]} />
              <View>
                <Text style={styles.footerInfoLabel}>TIMING</Text>
                <Text style={styles.footerInfoText}>09:00 AM - 04:30 PM</Text>
              </View>
            </View>
            <View style={[styles.footerBar, { backgroundColor: colors.primary }]} />
          </LinearGradient>
        </View>


        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },

  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },

  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },

  notifBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 20 },
  sectionContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  heroCard: {
    borderRadius: 20, padding: 28, overflow: 'hidden',
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  heroLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  heroAmount: { fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1.5 },
  heroSub: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  heroBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  payNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  payNowText: { fontWeight: '800', fontSize: 14 },

  ledgerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14,
  },
  ledgerText: { fontWeight: '800', color: '#FFFFFF', fontSize: 14 },
  feeCard: {
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },

  feeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  feeCardTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  feeCardSub: { fontSize: 12, marginTop: 2 },

  pendingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pendingBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  feeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 12, padding: 16, marginBottom: 10,
  },

  feeLabel: { fontSize: 15, fontWeight: '700' },
  feeDue: { fontSize: 11, marginTop: 2 },
  feeAmount: { fontSize: 18, fontWeight: '900' },

  sideBySide: { gap: 12 },
  hostelCard: { borderRadius: 20, padding: 20, borderBottomWidth: 4 },
  examCard: {
    borderRadius: 20, padding: 20,
  },


  hostelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  hostelTitle: { fontSize: 17, fontWeight: '800' },
  hostelAmount: { fontSize: 26, fontWeight: '900' },
  hostelSub: { fontSize: 11, marginTop: 2 },

  paidBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  paidText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  quickPayCard: { borderRadius: 20, padding: 24 },

  quickPayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  quickPayTitle: { fontSize: 19, fontWeight: '900' },

  payGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  payGridItem: {
    borderRadius: 16, padding: 16, alignItems: 'center', gap: 10,
    width: '48%',
  },
  payGridIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  payGridLabel: { fontSize: 11, fontWeight: '700' },
  transHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  transTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  viewAllText: { fontSize: 13, fontWeight: '700' },

  transCard: {
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },

  transIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  transInfo: { flex: 1 },
  transName: { fontSize: 14, fontWeight: '700' },
  transId: { fontSize: 10, marginTop: 2 },
  transRight: { alignItems: 'flex-end' },
  transAmount: { fontSize: 16, fontWeight: '900' },
  transSuccess: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5, marginTop: 2 },

  transDownload: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  footerCard: { borderRadius: 28, padding: 28, overflow: 'hidden', marginTop: 12 },
  footerTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 12 },
  footerAddr: { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  footerInfo: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  footerInfoLabel: { fontSize: 9, fontWeight: '800', color: '#F97316', letterSpacing: 1, marginBottom: 4 },
  footerInfoText: { fontSize: 13, color: '#FFFFFF', fontWeight: '500' },
  footerDivider: { width: 1, height: 40 },
  footerBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
});


export default ERPFeesScreen;
