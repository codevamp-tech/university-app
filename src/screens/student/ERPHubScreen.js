import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, Animated, Modal, StatusBar,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ERPHubScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setDrawerVisible(false));
  };

  const drawerItems = [
    { icon: 'person-outline', label: 'My Profile', action: () => { } },
    { icon: 'settings', label: 'Settings', action: () => { closeDrawer(); navigation.navigate('Settings'); } },
    { icon: 'help-outline', label: 'Help Center', action: () => { closeDrawer(); navigation.navigate('HelpCenter'); } },
    { icon: 'shield', label: 'Privacy', action: () => { closeDrawer(); navigation.navigate('Privacy'); } },
    { icon: 'home', label: 'Back to Home', action: () => { closeDrawer(); navigation.navigate('StudentMain'); } },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.logoIconBg}>
            <MaterialCommunityIcons name="account-balance-wallet" size={18} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>ERP Hub</Text>
            <Text style={styles.headerSub}>Invertis University</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialIcons name="notifications-none" size={22} color="#EA580C" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openDrawer} style={styles.headerIconBtn}>
            <Feather name="menu" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero Banner */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={['#1E1B4B', '#312E81']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroBg1} />
            <View style={styles.heroBg2} />
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={10} color="#EA580C" />
                <Text style={styles.heroBadgeText}>SMART ERP</Text>
              </View>
              <Text style={styles.heroTitle}>Digital Campus{'\n'}Management</Text>
              <Text style={styles.heroDesc}>
                Transit · Library · Fees · Documents — all in one place.
              </Text>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>VII</Text>
                <Text style={styles.heroStatLabel}>SEMESTER</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>8.42</Text>
                <Text style={styles.heroStatLabel}>CGPA</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>CSE</Text>
                <Text style={styles.heroStatLabel}>BRANCH</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Smart Bus Pass */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Transit & Access</Text>
          <LinearGradient
            colors={['#EEF2FF', '#E0E7FF']}
            style={styles.busPassCard}
          >
            <View style={styles.busPassTop}>
              <View style={styles.busPassBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.busPassBadgeText}>LIVE TRANSIT</Text>
              </View>
              <MaterialCommunityIcons name="bus-side" size={28} color="rgba(67,56,202,0.3)" />
            </View>
            <Text style={styles.busPassTitle}>Smart Bus Pass</Text>
            <Text style={styles.busPassDesc}>
              Route 14: Bareilly Junction → University Campus
            </Text>
            <View style={styles.busInfoRow}>
              <View style={styles.busInfoChip}>
                <MaterialIcons name="access-time" size={12} color="#4338CA" />
                <Text style={styles.busInfoChipText}>Next bus in 12 mins</Text>
              </View>
              <View style={[styles.busInfoChip, { backgroundColor: '#4338CA' }]}>
                <Text style={[styles.busInfoChipText, { color: '#FFFFFF' }]}>Seat 14B</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.showPassBtn}>
              <MaterialIcons name="qr-code-2" size={18} color="#4338CA" />
              <Text style={styles.showPassText}>Show Pass</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Digital Outpass */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={['#F0FDF4', '#DCFCE7']}
            style={styles.outpassCard}
          >
            <View style={styles.outpassLeft}>
              <View style={styles.outpassIconBox}>
                <MaterialIcons name="confirmation-number" size={26} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.outpassTitle}>Digital Outpass</Text>
                <Text style={styles.outpassDesc}>Request a temporary exit permit for campus gates.</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.outpassBtn}>
              <Text style={styles.outpassBtnText}>Request New</Text>
              <MaterialIcons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Academic Essentials */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Academic Essentials</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          {/* Fees */}
          <TouchableOpacity
            style={styles.essentialCard}
            onPress={() => navigation.navigate('ERPFeesTab')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.essentialIconBg}>
              <MaterialIcons name="payments" size={22} color="#EA580C" />
            </LinearGradient>
            <View style={styles.essentialContent}>
              <Text style={styles.essentialCardTitle}>Fees & Payments</Text>
              <Text style={styles.essentialCardDesc}>Semester VII Tuition Fee installment pending.</Text>
              <View style={styles.essentialFooter}>
                <View style={styles.dueBadge}>
                  <Text style={styles.dueText}>DUE: 15 OCT</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Results */}
          <TouchableOpacity
            style={styles.essentialCard}
            onPress={() => navigation.navigate('ERPResultsTab')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.essentialIconBg}>
              <MaterialIcons name="grade" size={22} color="#4338CA" />
            </LinearGradient>
            <View style={styles.essentialContent}>
              <Text style={styles.essentialCardTitle}>Results</Text>
              <Text style={styles.essentialCardDesc}>Semester VI Marksheet is now available for download.</Text>
              <View style={styles.essentialFooter}>
                <View style={[styles.dueBadge, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[styles.dueText, { color: '#4338CA' }]}>CGPA: 8.42</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Documents */}
          <TouchableOpacity
            style={styles.essentialCard}
            onPress={() => navigation.navigate('ERPDocumentsTab')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#ECFDF5', '#DCFCE7']} style={styles.essentialIconBg}>
              <MaterialIcons name="folder-shared" size={22} color="#059669" />
            </LinearGradient>
            <View style={styles.essentialContent}>
              <Text style={styles.essentialCardTitle}>Documents</Text>
              <Text style={styles.essentialCardDesc}>Bona fide certificate & Library NOC records.</Text>
              <View style={styles.essentialFooter}>
                <View style={[styles.dueBadge, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.dueText, { color: '#059669' }]}>3 NEW FILES</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Maintenance */}
          <TouchableOpacity style={styles.essentialCard} activeOpacity={0.85}>
            <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={styles.essentialIconBg}>
              <MaterialIcons name="build" size={22} color="#6B7280" />
            </LinearGradient>
            <View style={styles.essentialContent}>
              <Text style={styles.essentialCardTitle}>Maintenance</Text>
              <Text style={styles.essentialCardDesc}>Report issues with room facilities or water supply.</Text>
              <View style={styles.essentialFooter}>
                <View style={[styles.dueBadge, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={[styles.dueText, { color: '#6B7280' }]}>H1-BLOCK 204</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Smart Library */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Smart Library</Text>
          <View style={styles.libraryCard}>
            <View style={styles.libraryHeader}>
              <View>
                <Text style={styles.libraryTitle}>Borrowed Books</Text>
                <Text style={styles.librarySubtitle}>3 books currently checked out</Text>
              </View>
              <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.libraryIconBg}>
                <MaterialIcons name="local-library" size={20} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <View style={styles.bookItem}>
              <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.bookCover}>
                <MaterialCommunityIcons name="book-open-variant" size={22} color="#EA580C" />
              </LinearGradient>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>Data Structures & Algorithms</Text>
                <Text style={styles.bookAuthor}>Cormen, Leiserson</Text>
                <View style={styles.bookDueBadge}>
                  <View style={[styles.urgentDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={[styles.bookDueText, { color: '#EF4444' }]}>Due in 2 days</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.renewBtn}>
                <Text style={styles.renewBtnText}>Renew</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bookItem}>
              <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.bookCover}>
                <MaterialCommunityIcons name="book-open-variant" size={22} color="#4338CA" />
              </LinearGradient>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>Network Security Fundamentals</Text>
                <Text style={styles.bookAuthor}>Stallings, William</Text>
                <View style={styles.bookDueBadge}>
                  <View style={[styles.urgentDot, { backgroundColor: '#22C55E' }]} />
                  <Text style={[styles.bookDueText, { color: '#22C55E' }]}>Due in 14 days</Text>
                </View>
              </View>
              <View style={styles.onTimeBadge}>
                <Text style={styles.onTimeText}>On Time</Text>
              </View>
            </View>

            <View style={styles.bookItem}>
              <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.bookCover}>
                <MaterialCommunityIcons name="book-open-variant" size={22} color="#059669" />
              </LinearGradient>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>Operating System Concepts</Text>
                <Text style={styles.bookAuthor}>Silberschatz, Galvin</Text>
                <View style={styles.bookDueBadge}>
                  <View style={[styles.urgentDot, { backgroundColor: '#22C55E' }]} />
                  <Text style={[styles.bookDueText, { color: '#22C55E' }]}>Due in 21 days</Text>
                </View>
              </View>
              <View style={styles.onTimeBadge}>
                <Text style={styles.onTimeText}>On Time</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Student Library Card */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Student Library Card</Text>
          <LinearGradient
            colors={['#1A1A2E', '#2D1B5E', '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.libraryCardWrapper}
          >
            <View style={styles.cardCircle1} />
            <View style={styles.cardCircle2} />

            <View style={styles.lcHeader}>
              <View style={styles.lcUniversityRow}>
                <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.lcLogoBox}>
                  <MaterialIcons name="school" size={14} color="#FFFFFF" />
                </LinearGradient>
                <View>
                  <Text style={styles.lcUniversityName}>Invertis University</Text>
                  <Text style={styles.lcBareilly}>Bareilly, Uttar Pradesh</Text>
                </View>
              </View>
              <View style={styles.lcCardTypeBadge}>
                <Text style={styles.lcCardTypeText}>LIBRARY CARD</Text>
              </View>
            </View>

            <View style={styles.lcStudentRow}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
                style={styles.lcAvatar}
              />
              <View style={styles.lcStudentInfo}>
                <Text style={styles.lcStudentName}>Aryan Kumar</Text>
                <Text style={styles.lcStudentDept}>B.Tech Computer Science & Engineering</Text>
                <Text style={styles.lcStudentSem}>Semester VII  •  Section A</Text>
                <View style={styles.lcIdRow}>
                  <Text style={styles.lcIdLabel}>ID: </Text>
                  <Text style={styles.lcIdValue}>INV2024001</Text>
                </View>
              </View>
            </View>

            <View style={styles.lcStatsRow}>
              <View style={styles.lcStatItem}>
                <Text style={styles.lcStatValue}>3</Text>
                <Text style={styles.lcStatLabel}>BORROWED</Text>
              </View>
              <View style={styles.lcStatDivider} />
              <View style={styles.lcStatItem}>
                <Text style={styles.lcStatValue}>47</Text>
                <Text style={styles.lcStatLabel}>BOOKS READ</Text>
              </View>
              <View style={styles.lcStatDivider} />
              <View style={styles.lcStatItem}>
                <Text style={styles.lcStatValue}>₹45</Text>
                <Text style={[styles.lcStatLabel, { color: '#FCA5A5' }]}>FINE DUE</Text>
              </View>
            </View>

            <View style={styles.lcBarcodeRow}>
              <View style={styles.lcBarcode}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.lcBarcodeBar,
                      {
                        height: i % 4 === 0 ? 28 : i % 3 === 0 ? 22 : 18,
                        backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                        width: i % 5 === 0 ? 3 : 2,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.lcBarcodeText}>INV-LIB-2024-001</Text>
            </View>

            <View style={styles.lcFooterRow}>
              <View style={styles.lcValidRow}>
                <MaterialIcons name="event" size={12} color="rgba(255,255,255,0.5)" />
                <Text style={styles.lcValidText}>Valid until: 31 May 2025</Text>
              </View>
              <TouchableOpacity style={styles.lcQRBtn}>
                <MaterialIcons name="qr-code-2" size={16} color="#EA580C" />
                <Text style={styles.lcQRBtnText}>Show QR</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Recent Alerts */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Recent Alerts</Text>
          <View style={styles.alertsCard}>

            <View style={styles.alertItem}>
              <View style={[styles.alertIconBox, { backgroundColor: '#FEE2E2' }]}>
                <MaterialIcons name="error-outline" size={16} color="#EF4444" />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertItemTitle}>Fee due soon</Text>
                  <Text style={[styles.alertTag, { color: '#EF4444', backgroundColor: '#FEE2E2' }]}>URGENT</Text>
                </View>
                <Text style={styles.alertItemDesc}>
                  Last date for Semester VII fee payment is approaching. Avoid late fine by paying before Oct 15.
                </Text>
              </View>
            </View>

            <View style={styles.alertDivider} />

            <View style={styles.alertItem}>
              <View style={[styles.alertIconBox, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="account-balance-wallet" size={16} color="#F59E0B" />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertItemTitle}>Library fine pending</Text>
                  <Text style={[styles.alertTag, { color: '#92400E', backgroundColor: '#FEF3C7' }]}>FINANCE</Text>
                </View>
                <Text style={styles.alertItemDesc}>
                  A fine of ₹45 is pending for 'Compiler Design' book. Please clear at the circulation desk.
                </Text>
              </View>
            </View>

            <View style={styles.alertDivider} />

            <View style={[styles.alertItem, { opacity: 0.6 }]}>
              <View style={[styles.alertIconBox, { backgroundColor: '#F3F4F6' }]}>
                <MaterialIcons name="check-circle-outline" size={16} color="#6B7280" />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertItemTitle}>Bus Pass Renewed</Text>
                  <Text style={[styles.alertTag, { color: '#6B7280', backgroundColor: '#F3F4F6' }]}>2 DAYS AGO</Text>
                </View>
                <Text style={styles.alertItemDesc}>
                  Your digital bus pass has been successfully extended for Oct–Dec session.
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.clearAllBtn}>
              <Text style={styles.clearAllText}>Clear All Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Profile Drawer Modal */}
      <Modal visible={drawerVisible} transparent animationType="none" onRequestClose={closeDrawer}>
        <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={closeDrawer}>
          <Animated.View
            style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}
          >
            <TouchableOpacity activeOpacity={1}>
              <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.drawerHeader}>
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
                  style={styles.drawerAvatar}
                />
                <Text style={styles.drawerName}>Aryan Kumar</Text>
                <Text style={styles.drawerRole}>B.Tech CSE - VII Sem</Text>
                <Text style={styles.drawerId}>ID: INV2024001</Text>
              </LinearGradient>

              <View style={styles.drawerItems}>
                {drawerItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.drawerItem,
                      item.label === 'Back to Home' && styles.drawerItemHighlight,
                    ]}
                    onPress={item.action}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={22}
                      color={item.label === 'Back to Home' ? '#EA580C' : '#4B5563'}
                    />
                    <Text
                      style={[
                        styles.drawerItemText,
                        item.label === 'Back to Home' && styles.drawerItemTextHighlight,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.label === 'Back to Home' && (
                      <MaterialIcons name="arrow-forward" size={18} color="#EA580C" style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  scroll: { paddingBottom: 20 },
  sectionContainer: { paddingHorizontal: 16, paddingVertical: 10 },

  sectionHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.5,
  },

  // Hero Banner
  heroBanner: {
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
    minHeight: 200,
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  heroBg1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -60,
  },
  heroBg2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: -20,
  },
  heroContent: {
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#EA580C',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    fontWeight: '500',
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginTop: 3,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },

  // Bus Pass
  busPassCard: {
    borderRadius: 24,
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  busPassTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  busPassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(67,56,202,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  busPassBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#4338CA',
    letterSpacing: 1.5,
  },
  busPassTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#4338CA',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  busPassDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 14,
  },
  busInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  busInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  busInfoChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  showPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  showPassText: {
    color: '#4338CA',
    fontWeight: '800',
    fontSize: 14,
  },

  // Outpass
  outpassCard: {
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  outpassLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  outpassIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  outpassTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  outpassDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 18,
  },
  outpassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  outpassBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // Essential Cards
  essentialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  essentialIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  essentialContent: { flex: 1 },
  essentialCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  essentialCardDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 17,
  },
  essentialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  dueBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dueText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.5,
  },

  // Library
  libraryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  libraryTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },
  librarySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  libraryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  bookCover: {
    width: 46,
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: { flex: 1 },
  bookTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  bookDueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  urgentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  bookDueText: {
    fontSize: 10,
    fontWeight: '700',
  },
  renewBtn: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  renewBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  onTimeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  onTimeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },

  // Student Library Card
  libraryCardWrapper: {
    borderRadius: 24,
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  cardCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60,
    right: -60,
  },
  cardCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -40,
    left: -30,
  },
  lcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  lcUniversityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lcLogoBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lcUniversityName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  lcBareilly: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  lcCardTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  lcCardTypeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  lcStudentRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  lcAvatar: {
    width: 72,
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  lcStudentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  lcStudentName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  lcStudentDept: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
    lineHeight: 16,
    fontWeight: '600',
  },
  lcStudentSem: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    fontWeight: '500',
  },
  lcIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  lcIdLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  lcIdValue: {
    fontSize: 11,
    color: '#F97316',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lcStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  lcStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  lcStatValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  lcStatLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.8,
    marginTop: 3,
  },
  lcStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 4,
  },
  lcBarcodeRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  lcBarcode: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 36,
    marginBottom: 6,
  },
  lcBarcodeBar: {
    borderRadius: 1,
  },
  lcBarcodeText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  lcFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  lcValidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  lcValidText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
  },
  lcQRBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  lcQRBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },

  // Alerts
  alertsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  alertItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  alertIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: { flex: 1 },
  alertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  alertTag: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alertItemDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  alertDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  clearAllBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  // Drawer
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    width: width * 0.78,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    overflow: 'hidden',
  },
  drawerHeader: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  drawerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 14,
  },
  drawerName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  drawerRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    fontWeight: '600',
  },
  drawerId: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    fontWeight: '700',
    letterSpacing: 1,
  },
  drawerItems: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 4,
  },
  drawerItemHighlight: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  drawerItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  drawerItemTextHighlight: {
    color: '#EA580C',
    fontWeight: '800',
  },
});

export default ERPHubScreen;