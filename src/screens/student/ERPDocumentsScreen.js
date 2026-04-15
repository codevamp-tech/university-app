import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ERPDocumentsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('ERPHome')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#312E81" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document Vault</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color="#EA580C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={['#8B4B00', '#FE9832']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>SECURE REPOSITORY</Text>
            <Text style={styles.heroTitle}>Your Digital Vault.{'\n'}Verified & Permanent.</Text>
            <Text style={styles.heroDesc}>
              Access your official Invertis University credentials with bank-grade security. Instant downloads, blockchain verification, and effortless sharing.
            </Text>
            <View style={styles.heroBtns}>
              <TouchableOpacity style={styles.verifyBtn}>
                <Text style={styles.verifyBtnText}>Verify New Document</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.securityBtn}>
                <Text style={styles.securityBtnText}>Security Settings</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <View style={styles.sectionContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#8DEDEC' }]}>
                <MaterialIcons name="verified" size={22} color="#006666" />
              </View>
              <View>
                <Text style={styles.statLabel}>VERIFIED</Text>
                <Text style={styles.statValue}>08 Documents</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#CBCEFF' }]}>
                <MaterialIcons name="pending-actions" size={22} color="#4953AC" />
              </View>
              <View>
                <Text style={styles.statLabel}>IN PROGRESS</Text>
                <Text style={styles.statValue}>02 Requests</Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(254,152,50,0.2)' }]}>
              <MaterialIcons name="share" size={22} color="#8B4B00" />
            </View>
            <View>
              <Text style={styles.statLabel}>RECENT SHARES</Text>
              <Text style={styles.statValue}>14 Transfers</Text>
            </View>
          </View>
        </View>

        {/* Essential Credentials */}
        <View style={styles.sectionContainer}>
          <Text style={styles.essentialsTitle}>Essential Credentials</Text>

          {/* Student Digital ID Card */}
          <View style={styles.idCard}>
            <View style={styles.idCardImageBox}>
              <LinearGradient colors={['#8B4B00', '#FE9832']} style={styles.idCardPlaceholder}>
                <MaterialIcons name="badge" size={40} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={12} color="#FFFFFF" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <View style={styles.idCardContent}>
              <Text style={styles.idCardTitle}>Student Digital ID Card</Text>
              <Text style={styles.idCardDesc}>Official identity document valid for campus access, library services, and student discounts.</Text>
              <View style={styles.idCardMeta}>
                <MaterialIcons name="schedule" size={14} color="#4953AC" />
                <Text style={styles.idCardMetaText}>Valid until July 2024</Text>
              </View>
              <View style={styles.idCardActions}>
                <TouchableOpacity style={styles.downloadDocBtn}>
                  <MaterialIcons name="download" size={18} color="#FFFFFF" />
                  <Text style={styles.downloadDocText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareDocBtn}>
                  <MaterialIcons name="share" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Admission Letter */}
          <View style={styles.docCard}>
            <View style={[styles.docIconBg, { backgroundColor: '#FFF7ED' }]}>
              <MaterialIcons name="mail" size={24} color="#EA580C" />
            </View>
            <Text style={styles.docTitle}>Admission Letter</Text>
            <Text style={styles.docDesc}>Official confirmation of your enrollment in B.Tech CSE Batch 2020-2024.</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
              <Text style={[styles.statusText, { color: '#065F46' }]}>Verified</Text>
            </View>
            <View style={styles.docFooter}>
              <TouchableOpacity style={styles.docFooterBtn}>
                <Text style={styles.docFooterBtnText}>View PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.docFooterBtn}>
                <Text style={[styles.docFooterBtnText, { color: '#6B7280' }]}>History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Degree Certificate */}
          <View style={styles.docCard}>
            <View style={[styles.docIconBg, { backgroundColor: '#EEF2FF' }]}>
              <MaterialIcons name="school" size={24} color="#4953AC" />
            </View>
            <Text style={styles.docTitle}>Degree Certificate</Text>
            <Text style={styles.docDesc}>Provisional degree certificate issued upon completion of program requirements.</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.statusText, { color: '#92400E' }]}>Pending Approval</Text>
            </View>
            <TouchableOpacity style={styles.lockedBtn}>
              <MaterialIcons name="lock" size={16} color="#6B7280" />
              <Text style={styles.lockedText}>Download Locked</Text>
            </TouchableOpacity>
          </View>

          {/* Character & Migration */}
          <View style={styles.compactRow}>
            <View style={styles.compactCard}>
              <View style={[styles.compactIcon, { backgroundColor: '#CCFBF1' }]}>
                <MaterialIcons name="assignment-ind" size={22} color="#0D9488" />
              </View>
              <Text style={styles.compactTitle}>Character Certificate</Text>
              <Text style={styles.compactSub}>Verified by Dean's Office</Text>
              <View style={styles.compactActions}>
                <TouchableOpacity style={styles.compactBtn}>
                  <MaterialIcons name="visibility" size={18} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.compactBtn}>
                  <MaterialIcons name="share" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.compactCard}>
              <View style={[styles.compactIcon, { backgroundColor: '#F3E8FF' }]}>
                <MaterialCommunityIcons name="arrow-up-bold-box-outline" size={22} color="#7C3AED" />
              </View>
              <Text style={styles.compactTitle}>Migration Certificate</Text>
              <Text style={styles.compactSub}>Issued on Mar 12, 2024</Text>
              <View style={styles.compactActions}>
                <TouchableOpacity style={styles.compactBtn}>
                  <MaterialIcons name="visibility" size={18} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.compactBtn}>
                  <MaterialIcons name="share" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Privacy & Safety */}
        <View style={styles.sectionContainer}>
          <View style={styles.privacyCard}>
            <View style={styles.privacyHeader}>
              <MaterialIcons name="security" size={24} color="#8B4B00" />
              <Text style={styles.privacyTitle}>Privacy & Safety</Text>
            </View>
            <Text style={styles.privacyDesc}>
              All documents in your vault are encrypted using 256-bit AES encryption. They are strictly private and can only be accessed by you.
            </Text>
            <View style={styles.privacyBadges}>
              <View style={styles.privacyBadge}>
                <MaterialIcons name="fingerprint" size={20} color="#006666" />
                <Text style={styles.privacyBadgeText}>Biometric Enabled</Text>
              </View>
              <View style={styles.privacyBadge}>
                <MaterialIcons name="history-edu" size={20} color="#8B4B00" />
                <Text style={styles.privacyBadgeText}>Audit Log</Text>
              </View>
            </View>
          </View>
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
  heroLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 2.5, marginBottom: 12 },
  heroTitle: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', lineHeight: 38, letterSpacing: -0.5 },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginTop: 12 },
  heroBtns: { flexDirection: 'row', gap: 12, marginTop: 20, flexWrap: 'wrap' },
  verifyBtn: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  verifyBtnText: { fontWeight: '800', color: '#8B4B00', fontSize: 13 },
  securityBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30,
  },
  securityBtnText: { fontWeight: '800', color: '#FFFFFF', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#EFF1F2', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0,
  },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#6B7280', letterSpacing: 0.8, textTransform: 'uppercase' },
  statValue: { fontSize: 15, fontWeight: '800', color: '#1F2937', marginTop: 2 },
  essentialsTitle: { fontSize: 22, fontWeight: '900', color: '#4953AC', marginBottom: 16, letterSpacing: -0.3 },
  idCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', marginBottom: 14,
    shadowColor: '#312E81', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  idCardImageBox: { height: 140, position: 'relative' },
  idCardPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  verifiedBadge: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#006666', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  verifiedText: { fontSize: 10, fontWeight: '800', color: '#BBFFFE', letterSpacing: 0.5 },
  idCardContent: { padding: 20 },
  idCardTitle: { fontSize: 20, fontWeight: '900', color: '#1F2937', marginBottom: 6 },
  idCardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  idCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  idCardMetaText: { fontSize: 13, fontWeight: '600', color: '#4953AC' },
  idCardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  downloadDocBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#8B4B00', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30,
  },
  downloadDocText: { fontWeight: '800', color: '#FFFFFF', fontSize: 13 },
  shareDocBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#E6E8EA',
    justifyContent: 'center', alignItems: 'center',
  },
  docCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, marginBottom: 14,
    shadowColor: '#312E81', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  docIconBg: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  docTitle: { fontSize: 19, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  docDesc: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  docFooter: {
    flexDirection: 'row', gap: 16, marginTop: 20, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: '#E6E8EA',
  },
  docFooterBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  docFooterBtnText: { fontSize: 14, fontWeight: '700', color: '#8B4B00' },
  lockedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#E6E8EA', paddingVertical: 12, borderRadius: 30, marginTop: 16,
  },
  lockedText: { fontWeight: '700', color: '#6B7280', fontSize: 13 },
  compactRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  compactCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    shadowColor: '#312E81', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  compactIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  compactTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  compactSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  compactActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  compactBtn: { padding: 8, borderRadius: 20, backgroundColor: '#F5F6F7' },
  privacyCard: { backgroundColor: '#EFF1F2', borderRadius: 20, padding: 24 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  privacyTitle: { fontSize: 20, fontWeight: '900', color: '#1F2937' },
  privacyDesc: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 16 },
  privacyBadges: { flexDirection: 'row', gap: 12 },
  privacyBadge: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  privacyBadgeText: { fontSize: 12, fontWeight: '700', color: '#1F2937' },
});

export default ERPDocumentsScreen;
