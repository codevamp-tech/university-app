import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getDocuments } from '../../data/apiService';

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';

const { width } = Dimensions.get('window');

const ERPDocumentsScreen = ({ navigation }) => {
  const { user, accessToken } = useUser();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [apiDocs, setApiDocs] = React.useState([]);
  const [isLocked, setIsLocked] = React.useState(false);

  const yearNum = parseInt(user?.year) || 4;
  const startYear = 2026 - yearNum;
  const endYear = startYear + 4; // Default 4-year course
  const validityText = `Valid until July ${endYear}`;

  const courseTitle = user?.course
    ? (user.branch && !user.course.includes(user.branch) ? `${user.course} ${user.branch}` : user.course)
    : 'B.Tech CSE';

  React.useEffect(() => {
    async function loadDocs() {
      if (!accessToken) return;
      try {
        const data = await getDocuments(accessToken);
        if (data) {
          setApiDocs(data.documents || []);
          setIsLocked(!!data.locked);
        }
      } catch (err) {
        console.warn('[DocumentsScreen] Error loading documents:', err);
      }
    }
    loadDocs();
  }, [accessToken]);


  const isDemoLocked = true;
  if (isDemoLocked) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        {/* TopAppBar */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.navigate('ERPHome')} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Document Vault</Text>
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
            Document Vault Locked
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, marginBottom: 32 }}>
            The Document Vault is currently locked in this demo space. Please contact the administrator to request credentials access clearance.
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
            onPress={() => navigation.navigate('ERPHome')}
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
          <TouchableOpacity onPress={() => navigation.navigate('ERPHome')} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Document Vault</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color={colors.primary} />
        </TouchableOpacity>
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
            <MaterialIcons name="lock-outline" size={24} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#991B1B', fontWeight: '800', fontSize: 14 }}>ADMINISTRATIVE HOLD</Text>
              <Text style={{ color: '#7F1D1D', fontSize: 12, marginTop: 2 }}>
                Document access is temporarily locked due to outstanding administrative clearance.
              </Text>
            </View>
          </View>
        )}

        {/* Hero */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={isDark ? ['#78350F', '#92400E'] : ['#8B4B00', '#FE9832']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >

            <Text style={styles.heroLabel}>SECURE REPOSITORY</Text>
            <Text style={styles.heroTitle}>Your Digital Vault.{'\n'}Verified & Permanent.</Text>
            <Text style={styles.heroDesc}>
              Access your official {APP_CONFIG.UNIVERSITY_NAME} credentials with bank-grade security. Instant downloads, blockchain verification, and effortless sharing.
            </Text>
            <View style={styles.heroBtns}>
              <TouchableOpacity style={styles.verifyBtn}>
                <Text style={[styles.verifyBtnText, { color: isDark ? '#FFFFFF' : '#8B4B00' }]}>Verify New Document</Text>
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
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? 'rgba(141, 237, 236, 0.2)' : '#8DEDEC' }]}>
                <MaterialIcons name="verified" size={22} color={isDark ? '#8DEDEC' : '#006666'} />
              </View>
              <View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>VERIFIED</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {apiDocs.length < 10 ? `0${apiDocs.length}` : apiDocs.length} Document{apiDocs.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? 'rgba(203, 206, 255, 0.2)' : '#CBCEFF' }]}>
                <MaterialIcons name="pending-actions" size={22} color={isDark ? '#CBCEFF' : '#4953AC'} />
              </View>
              <View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>IN PROGRESS</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>00 Requests</Text>
              </View>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={[styles.statIcon, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : 'rgba(254,152,50,0.2)' }]}>
              <MaterialIcons name="share" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>RECENT SHARES</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>- Transfers</Text>
            </View>
          </View>
        </View>

        {/* Essential Credentials */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.essentialsTitle, { color: colors.textPrimary }]}>Essential Credentials</Text>

          {apiDocs.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, borderColor: colors.border, borderWidth: 1, marginTop: 12 }}>
              <MaterialCommunityIcons name="folder-open-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>No Documents Available</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                There are currently no certificates or academic documents verified in your vault.
              </Text>
            </View>
          ) : (
            apiDocs.map((docKey) => {
              const documentDetails = {
                bona_fide: {
                  title: 'Bona Fide Certificate',
                  desc: 'Official student status verification certificate.',
                  icon: 'verified',
                  iconType: 'material',
                  color: '#0D9488'
                },
                noc: {
                  title: 'No Objection Certificate (NOC)',
                  desc: 'Verification certificate for internship or college transfer.',
                  icon: 'assignment-turned-in',
                  iconType: 'material',
                  color: '#7C3AED'
                },
                marksheets: {
                  title: 'Academic Marksheets',
                  desc: 'Semester-wise official academic records and grade cards.',
                  icon: 'description',
                  iconType: 'material',
                  color: '#EA580C'
                },
                degree: {
                  title: 'Degree Certificate',
                  desc: 'Provisional degree certificate issued upon completion of program requirements.',
                  icon: 'school',
                  iconType: 'material',
                  color: '#4953AC'
                },
                admission: {
                  title: 'Admission Letter',
                  desc: `Official confirmation of your enrollment in the ${courseTitle} program.`,
                  icon: 'mail',
                  iconType: 'material',
                  color: '#EA580C'
                },
                character: {
                  title: 'Character Certificate',
                  desc: 'Verified certificate of conduct from the Dean\'s office.',
                  icon: 'assignment-ind',
                  iconType: 'material',
                  color: '#0D9488'
                },
                migration: {
                  title: 'Migration Certificate',
                  desc: 'Official certificate for university transfer.',
                  icon: 'arrow-up-bold-box-outline',
                  iconType: 'material-community',
                  color: '#7C3AED'
                }
              };

              const doc = documentDetails[docKey] || {
                title: docKey.replace(/_/g, ' ').toUpperCase(),
                desc: 'Official academic document in your secure repository.',
                icon: 'file-present',
                iconType: 'material',
                color: colors.primary
              };

              return (
                <View key={docKey} style={[styles.docCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, marginBottom: 14 }]}>
                  <View style={[styles.docIconBg, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : doc.color + '15' }]}>
                    {doc.iconType === 'material-community' ? (
                      <MaterialCommunityIcons name={doc.icon} size={24} color={doc.color} />
                    ) : (
                      <MaterialIcons name={doc.icon} size={24} color={doc.color} />
                    )}
                  </View>
                  <Text style={[styles.docTitle, { color: colors.textPrimary }]}>{doc.title}</Text>
                  <Text style={[styles.docDesc, { color: colors.textSecondary }]}>{doc.desc}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: isLocked ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2') : (isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5') }]}>
                    <Text style={[styles.statusText, { color: isLocked ? '#EF4444' : (isDark ? '#34D399' : '#065F46') }]}>
                      {isLocked ? 'Locked' : 'Verified'}
                    </Text>
                  </View>
                  <View style={[styles.docFooter, { borderTopColor: colors.border }]}>
                    <TouchableOpacity 
                      style={styles.docFooterBtn} 
                      onPress={() => {
                        if (isLocked) {
                          Alert.alert('Access Locked', 'This document is locked due to outstanding administrative clearance.');
                        } else {
                          Alert.alert('Download Started', `${doc.title} is downloading...`);
                        }
                      }}
                    >
                      <Text style={[styles.docFooterBtnText, { color: isLocked ? colors.textSecondary : colors.primary }]}>Download PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.docFooterBtn} disabled={isLocked}>
                      <Text style={[styles.docFooterBtnText, { color: colors.textSecondary }]}>History</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Privacy & Safety */}
        <View style={styles.sectionContainer}>
          <View style={[styles.privacyCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.privacyHeader}>
              <MaterialIcons name="security" size={24} color={colors.primary} />
              <Text style={[styles.privacyTitle, { color: colors.textPrimary }]}>Privacy & Safety</Text>
            </View>
            <Text style={[styles.privacyDesc, { color: colors.textSecondary }]}>
              All documents in your vault are encrypted using 256-bit AES encryption. They are strictly private and can only be accessed by you.
            </Text>
            <View style={styles.privacyBadges}>
              <View style={[styles.privacyBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                <MaterialIcons name="fingerprint" size={20} color={isDark ? '#2DD4BF' : '#006666'} />
                <Text style={[styles.privacyBadgeText, { color: colors.textPrimary }]}>Biometric Enabled</Text>
              </View>
              <View style={[styles.privacyBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                <MaterialIcons name="history-edu" size={20} color={colors.primary} />
                <Text style={[styles.privacyBadgeText, { color: colors.textPrimary }]}>Audit Log</Text>
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
  heroLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 2.5, marginBottom: 12 },
  heroTitle: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', lineHeight: 38, letterSpacing: -0.5 },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginTop: 12 },
  heroBtns: { flexDirection: 'row', gap: 12, marginTop: 20, flexWrap: 'wrap' },
  verifyBtn: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  verifyBtnText: { fontWeight: '800', fontSize: 13 },

  securityBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30,
  },
  securityBtnText: { fontWeight: '800', color: '#FFFFFF', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0,
  },

  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  statValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },

  essentialsTitle: { fontSize: 22, fontWeight: '900', marginBottom: 16, letterSpacing: -0.3 },
  idCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 14,
    shadowColor: '#312E81', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },

  idCardImageBox: { height: 140, position: 'relative' },
  idCardPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  verifiedBadge: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#006666', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  verifiedText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  idCardContent: { padding: 20 },
  idCardTitle: { fontSize: 20, fontWeight: '900', marginBottom: 6 },
  idCardDesc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  idCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  idCardMetaText: { fontSize: 13, fontWeight: '600' },

  downloadDocText: { fontWeight: '800', color: '#FFFFFF', fontSize: 13 },
  shareDocBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },

  docCard: {
    borderRadius: 20, padding: 24, marginBottom: 14,
    shadowColor: '#312E81', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },

  docIconBg: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  docTitle: { fontSize: 19, fontWeight: '800', marginBottom: 6 },
  docDesc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },

  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  docFooter: {
    flexDirection: 'row', gap: 16, marginTop: 20, paddingTop: 16,
    borderTopWidth: 1,
  },

  docFooterBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  docFooterBtnText: { fontSize: 14, fontWeight: '700' },

  lockedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 30, marginTop: 16,
  },
  lockedText: { fontWeight: '700', fontSize: 13 },

  compactRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  compactCard: {
    flex: 1, borderRadius: 16, padding: 16,
    shadowColor: '#312E81', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  compactIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  compactTitle: { fontSize: 14, fontWeight: '700' },
  compactSub: { fontSize: 11, marginTop: 2 },
  compactActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  compactBtn: { padding: 8, borderRadius: 20, borderWidth: 1 },

  privacyCard: { borderRadius: 20, padding: 24 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  privacyTitle: { fontSize: 20, fontWeight: '900' },
  privacyDesc: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  privacyBadges: { flexDirection: 'row', gap: 12 },
  privacyBadge: {
    flex: 1, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  privacyBadgeText: { fontSize: 12, fontWeight: '700' },

});

export default ERPDocumentsScreen;
