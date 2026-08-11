import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { getFees, payFee, getTransactions, getExtraFeeAmount } from '../../data/apiService';

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ERPFeesScreen = ({ navigation, route }) => {
  const { user, accessToken } = useUser();
  const student = route?.params?.student || route?.params?.params?.student || user;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [apiFees, setApiFees] = React.useState([]);
  const [transactions, setTransactions] = React.useState([]);
  const [fallbackPaid, setFallbackPaid] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [extraFeeAmt, setExtraFeeAmt] = React.useState(0);
  const [loadingExtra, setLoadingExtra] = React.useState(true);

  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const semNum = parseInt(student?.semester) || 7;
  const displaySem = roman[semNum - 1] || 'VII';

  // For MBBS students: use current_year (ERP phase) — same logic as ERPAttendanceScreen.
  // current_year: 1=1st Prof, 2=2nd Prof, 3=3rd Prof Part I, 4=3rd Prof Part II
  const medYear = (() => {
    // For MBBS, batch_year is the authoritative source of truth for the phase.
    // Prioritize it over current_year/year to bypass stale cached profiles.
    const by = parseInt(student?.batch_year || student?.batchYear || 0);
    if (by >= 2025) return 1;
    if (by === 2024) return 2;
    if (by === 2023) return 3;
    if (by > 0 && by <= 2022) return 4;

    const cy = parseInt(student?.current_year) || parseInt(student?.year);
    if (cy && cy >= 1 && cy <= 4) return cy;
    return 1;
  })();
  const getPhaseRoman = (yr) => {
    const y = parseInt(yr) || 1;
    if (y <= 1) return 'I';
    if (y === 2) return 'II';
    if (y === 3) return 'III';
    return 'IV';
  };

  const yearNum = parseInt(student?.year) || 4;
  const startYear = new Date().getFullYear() - yearNum;
  const currentAcademicYearStart = startYear + yearNum - 1;
  const currentAcademicYearEnd = currentAcademicYearStart + 1;
  const academicYearStr = `Academic Year ${currentAcademicYearStart}-${currentAcademicYearEnd.toString().slice(-2)}`;

  const idStr = student?.id || '';
  const idNum = parseInt(idStr.replace(/[^0-9]/g, '')) || 1;

  const isMedical = student?.course?.replace(/\./g, '').toUpperCase().includes('MBBS') || student?.category?.toLowerCase() === 'medical';

  const isLocked = false;

  const outstandingDuesVal = fallbackPaid ? 0 : extraFeeAmt;

  React.useEffect(() => {
    async function loadFees() {
      setLoading(true);
      try {
        const rollNo = student?.rollno || student?.username;
        const colgCd = student?.colg_cd || '11';
        const extraFeeRes = await getExtraFeeAmount(rollNo, colgCd);
        if (extraFeeRes && extraFeeRes.length > 0) {
          const remAmt = extraFeeRes[0].REM_AMT ?? 0;
          setExtraFeeAmt(remAmt);
        }
      } catch (err) {
        console.warn('[FeesScreen] Error loading extra fees:', err);
      } finally {
        setLoadingExtra(false);
        setLoading(false);
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
  }, [accessToken, student]);

  const handlePayNow = async () => {
    if (outstandingDuesVal === 0) {
      Alert.alert('No Dues', 'You have no outstanding dues to pay.');
      return;
    }
    setLoading(true);
    try {
      setFallbackPaid(true);
      Alert.alert('Payment Successful', 'Outstanding dues of ' + formatCurrency(outstandingDuesVal) + ' have been successfully paid.');
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

  const isDemoLocked = isLocked;
  if (isDemoLocked) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        {/* TopAppBar */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.navigate('ERPHome')} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Fees & Payments</Text>
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            borderColor: colors.primary,
            borderWidth: 2
          }}>
            <MaterialIcons name="lock" size={48} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', marginBottom: 12 }}>
            Fees Portal Locked
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, marginBottom: 32 }}>
            The Fees & Payments module is currently locked in this demo space. Please contact the administration to request billing and payments clearance.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 28,
              paddingVertical: 14,
              borderRadius: 24,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 5
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>Return to ERP Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Fees & Payments</Text>
        </View>
      </View>



      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isLocked && (
          <View style={{
            marginHorizontal: 16,
            marginTop: 12,
            backgroundColor: '#FEF2F2',
            borderColor: '#EF4444',
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center'
          }}>
            <MaterialIcons name="error-outline" size={24} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#991B1B', fontWeight: '800', fontSize: 14 }}>ADMINISTRATIVE LOCK</Text>
              <Text style={{ color: '#7F1D1D', fontSize: 12, marginTop: 2 }}>
                Your fee account has been locked. Online payments are currently suspended. Please contact the finance desk.
              </Text>
            </View>
          </View>
        )}

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
            <Text style={[styles.heroSub, { color: 'rgba(255,255,255,0.85)' }]}>{academicYearStr} | {isMedical ? `Phase ${getPhaseRoman(medYear)}` : `${displaySem} Semester`}</Text>
            {/* <View style={styles.heroBtns}>
              <TouchableOpacity 
                style={[styles.payNowBtn, { backgroundColor: isLocked ? '#EF4444' : (isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF') }]}
                onPress={handlePayNow}
                disabled={loading || isLocked}
              >
                <MaterialIcons name={isLocked ? "lock" : "payments"} size={18} color={isLocked ? "#FFFFFF" : (isDark ? '#FFFFFF' : '#EA580C')} />
                <Text style={[styles.payNowText, { color: isLocked ? "#FFFFFF" : (isDark ? '#FFFFFF' : '#EA580C') }]}>
                  {isLocked ? 'Locked' : (loading ? 'Paying...' : 'Pay Now')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ledgerBtn}>
                <MaterialIcons name="download" size={18} color="#FFFFFF" />
                <Text style={styles.ledgerText}>Full Ledger</Text>
              </TouchableOpacity>
            </View> */}

          </LinearGradient>
        </View>


        {/* Semester Fees */}
        <View style={styles.sectionContainer}>
          <View style={[styles.feeCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.feeCardHeader}>
              <View>
                <Text style={[styles.feeCardTitle, { color: colors.textPrimary }]}>{isMedical ? `Phase ${getPhaseRoman(medYear)}` : `${displaySem} Semester`} Fees</Text>
                <Text style={[styles.feeCardSub, { color: colors.textSecondary }]}>{courseTitle}</Text>
              </View>
              <View style={[
                styles.pendingBadge,
                {
                  backgroundColor: isLocked
                    ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#EF4444')
                    : (outstandingDuesVal === 0 ? (isDark ? 'rgba(52, 211, 153, 0.2)' : '#059669') : (isDark ? 'rgba(239, 68, 68, 0.2)' : '#F95630'))
                }
              ]}>
                <Text style={[
                  styles.pendingBadgeText,
                  {
                    color: isLocked
                      ? '#FFFFFF'
                      : (outstandingDuesVal === 0 ? (isDark ? '#34D399' : '#FFFFFF') : (isDark ? '#EF4444' : '#FFFFFF'))
                  }
                ]}>
                  {isLocked ? 'LOCKED' : (outstandingDuesVal === 0 ? 'PAID' : 'PENDING')}
                </Text>
              </View>
            </View>

            {outstandingDuesVal === 0 ? (
              <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="check-circle" size={42} color="#10B981" style={{ marginBottom: 12 }} />
                <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16 }}>All Dues Cleared</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                  No outstanding academic or tuition fees are registered against your account.
                </Text>
              </View>
            ) : (
              <View style={[styles.feeRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB' }]}>
                <View>
                  <Text style={[styles.feeLabel, { color: colors.textPrimary }]}>Academic & Tuition Dues</Text>
                  <Text style={[styles.feeDue, { color: colors.textSecondary }]}>Due Date: Immediate / As scheduled</Text>
                </View>
                <Text style={[styles.feeAmount, { color: colors.primary }]}>{formatCurrency(outstandingDuesVal)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* <View style={styles.sectionContainer}>
          <View style={styles.sideBySide}>
            <LinearGradient
              colors={isDark ? ['#064E3B', '#111827'] : ['#ECFDF5', '#DCFCE7']}
              style={[styles.hostelCard, { borderBottomColor: isDark ? '#34D399' : '#059669', borderWidth: 1, borderColor: colors.border }]}
            >
              <View style={styles.hostelHeader}>
                <Text style={[styles.hostelTitle, { color: isDark ? '#34D399' : '#059669' }]}>Hostel Fee</Text>
                <View style={[styles.paidBadge, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : '#059669' }]}>
                  <Text style={[styles.paidText, { color: '#FFFFFF' }]}>PAID</Text>
                </View>
              </View>
              <Text style={[styles.hostelAmount, { color: colors.textPrimary }]}>{formatCurrency(0)}</Text>
              <Text style={[styles.hostelSub, { color: colors.textSecondary }]}>Himalaya Hostel - Room 302</Text>
            </LinearGradient>
          </View>
        </View> */}

        {/* Quick Pay Integration */}
        {/* <View style={styles.sectionContainer}>
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
        </View> */}

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
        {/* <View style={styles.sectionContainer}>
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
        </View> */}


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
