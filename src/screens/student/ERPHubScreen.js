import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, Animated, Modal, StatusBar,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
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
    { icon: 'person-outline', label: 'My Profile', action: () => {} },
    { icon: 'settings', label: 'Settings', action: () => { closeDrawer(); navigation.navigate('Settings'); } },
    { icon: 'help-outline', label: 'Help Center', action: () => { closeDrawer(); navigation.navigate('HelpCenter'); } },
    { icon: 'shield', label: 'Privacy', action: () => { closeDrawer(); navigation.navigate('Privacy'); } },
    { icon: 'home', label: 'Back to Home', action: () => { closeDrawer(); navigation.navigate('StudentMain'); } },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
            style={styles.avatarSmall}
          />
          <Text style={styles.headerTitle}>ERP</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notifBtn}>
            <MaterialIcons name="notifications-none" size={24} color="#EA580C" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openDrawer} style={styles.profileBtn}>
            <Feather name="menu" size={22} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              Smart <Text style={styles.heroHighlight}>ERP Hub</Text>
            </Text>
            <Text style={styles.heroDesc}>
              Digital management for your academic journey at Invertis University. Manage transit, library, and essentials in one place.
            </Text>
          </View>
        </View>

        {/* Transit & Access */}
        <View style={styles.sectionContainer}>
          <LinearGradient colors={['#CBCEFF', '#B8BFFF']} style={styles.busPassCard}>
            <View style={styles.busPassBadge}>
              <Text style={styles.busPassBadgeText}>LIVE TRANSIT</Text>
            </View>
            <Text style={styles.busPassTitle}>Smart Bus Pass</Text>
            <Text style={styles.busPassDesc}>Route 14: Bareilly Junction - University Campus. Next bus in 12 mins.</Text>
            <TouchableOpacity style={styles.showPassBtn}>
              <MaterialIcons name="qr-code-2" size={20} color="#FFFFFF" />
              <Text style={styles.showPassText}>Show Pass</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Digital Outpass */}
        <View style={styles.sectionContainer}>
          <LinearGradient colors={['#8DEDEC', '#7FDEDE']} style={styles.outpassCard}>
            <MaterialIcons name="confirmation-number" size={36} color="#005858" />
            <Text style={styles.outpassTitle}>Digital Outpass</Text>
            <Text style={styles.outpassDesc}>Request temporary exit permit for campus gates.</Text>
            <TouchableOpacity style={styles.outpassBtn}>
              <Text style={styles.outpassBtnText}>Request New</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Academic Essentials */}
        <View style={styles.sectionContainer}>
          <View style={styles.essentialsHeader}>
            <Text style={styles.essentialsTitle}>Academic Essentials</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>VIEW ALL RECORDS</Text>
            </TouchableOpacity>
          </View>

          {/* Fees & Payments */}
          <TouchableOpacity style={styles.essentialCard} onPress={() => navigation.navigate('ERPFeesTab')}>
            <View style={[styles.essentialIconBg, { backgroundColor: '#FFF7ED' }]}>
              <MaterialIcons name="payments" size={24} color="#EA580C" />
            </View>
            <View style={styles.essentialContent}>
              <Text style={styles.essentialCardTitle}>Fees & Payments</Text>
              <Text style={styles.essentialCardDesc}>Semester VII Tuition Fee installment pending.</Text>
              <View style={styles.essentialFooter}>
                <Text style={styles.dueText}>DUE: 15 OCT</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#9CA3AF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Results */}
          <TouchableOpacity style={styles.essentialCard} onPress={() => navigation.navigate('ERPResultsTab')}>
            <View style={[styles.essentialIconBg, { backgroundColor: '#EEF2FF' }]}>
              <MaterialIcons name="grade" size={24} color="#4953AC" />
            </View>
            <View style={styles.essentialContent}>
              <Text style={styles.essentialCardTitle}>Results</Text>
              <Text style={styles.essentialCardDesc}>Semester VI Marksheet is now available for download.</Text>
              <View style={styles.essentialFooter}>
                <Text style={[styles.dueText, { color: '#4953AC' }]}>CGPA: 8.42</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#9CA3AF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Documents */}
          <TouchableOpacity style={styles.essentialCard} onPress={() => navigation.navigate('ERPDocumentsTab')}>
            <View style={[styles.essentialIconBg, { backgroundColor: '#F0FDFA' }]}>
              <MaterialIcons name="folder-shared" size={24} color="#006666" />
            </View>
            <View style={styles.essentialContent}>
              <Text style={styles.essentialCardTitle}>Documents</Text>
              <Text style={styles.essentialCardDesc}>Bona fide certificate & Library NOC records.</Text>
              <View style={styles.essentialFooter}>
                <Text style={[styles.dueText, { color: '#006666' }]}>3 NEW FILES</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#9CA3AF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Maintenance */}
          <TouchableOpacity style={styles.essentialCard}>
            <View style={[styles.essentialIconBg, { backgroundColor: '#F1F5F9' }]}>
              <MaterialIcons name="build" size={24} color="#64748B" />
            </View>
            <View style={styles.essentialContent}>
              <Text style={styles.essentialCardTitle}>Maintenance</Text>
              <Text style={styles.essentialCardDesc}>Report issues with room facilities or water supply.</Text>
              <View style={styles.essentialFooter}>
                <Text style={[styles.dueText, { color: '#6B7280' }]}>H1-BLOCK 204</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#9CA3AF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Smart Library */}
        <View style={styles.sectionContainer}>
          <View style={styles.libraryCard}>
            <View style={styles.libraryHeader}>
              <View>
                <Text style={styles.libraryTitle}>Smart Library</Text>
                <Text style={styles.librarySubtitle}>Currently holding 3 borrowed books</Text>
              </View>
              <MaterialIcons name="local-library" size={32} color="#8B4B00" />
            </View>

            <View style={styles.bookItem}>
              <View style={styles.bookCover}>
                <MaterialCommunityIcons name="book-open-variant" size={24} color="#8B4B00" />
              </View>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>Data Structures & Algorithms</Text>
                <Text style={styles.bookDue}>Due in 2 days</Text>
              </View>
              <TouchableOpacity style={styles.renewBtn}>
                <Text style={styles.renewBtnText}>Renew</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bookItem}>
              <View style={styles.bookCover}>
                <MaterialCommunityIcons name="book-open-variant" size={24} color="#4953AC" />
              </View>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>Network Security Fundamentals</Text>
                <Text style={styles.bookDue}>Due in 14 days</Text>
              </View>
              <View style={styles.onTimeBadge}>
                <Text style={styles.onTimeText}>On Time</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Alerts */}
        <View style={styles.sectionContainer}>
          <View style={styles.alertsCard}>
            <Text style={styles.alertsTitle}>Recent Alerts</Text>
            
            <View style={styles.alertItem}>
              <View style={[styles.alertDot, { backgroundColor: '#B02500' }]} />
              <View style={styles.alertContent}>
                <Text style={styles.alertItemTitle}>Fee due soon</Text>
                <Text style={styles.alertItemDesc}>Last date for Semester VII fee payment is approaching. Avoid late fine by paying before Oct 15.</Text>
                <Text style={[styles.alertTag, { color: '#B02500' }]}>URGENT</Text>
              </View>
            </View>

            <View style={styles.alertItem}>
              <View style={[styles.alertDot, { backgroundColor: '#FE9832' }]} />
              <View style={styles.alertContent}>
                <Text style={styles.alertItemTitle}>Library fine pending</Text>
                <Text style={styles.alertItemDesc}>A fine of ₹45 is pending for 'Compiler Design' book. Please clear at the circulation desk.</Text>
                <Text style={[styles.alertTag, { color: '#6B7280' }]}>FINANCE</Text>
              </View>
            </View>

            <View style={[styles.alertItem, { opacity: 0.6 }]}>
              <View style={[styles.alertDot, { backgroundColor: '#CBD5E1' }]} />
              <View style={styles.alertContent}>
                <Text style={styles.alertItemTitle}>Bus Pass Renewed</Text>
                <Text style={styles.alertItemDesc}>Your digital bus pass has been successfully extended for Oct-Dec session.</Text>
                <Text style={[styles.alertTag, { color: '#9CA3AF' }]}>2 DAYS AGO</Text>
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
              <LinearGradient colors={['#8B4B00', '#FE9832']} style={styles.drawerHeader}>
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
    backgroundColor: '#F5F6F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FE9832',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#312E81',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  profileBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  scroll: { paddingBottom: 20 },
  sectionContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  heroSection: { marginBottom: 8 },
  heroTitle: { fontSize: 36, fontWeight: '900', color: '#1F2937', letterSpacing: -1, lineHeight: 42 },
  heroHighlight: { color: '#8B4B00' },
  heroDesc: { fontSize: 15, color: '#6B7280', marginTop: 8, lineHeight: 22, fontWeight: '500' },
  busPassCard: { borderRadius: 20, padding: 24, marginTop: 8 },
  busPassBadge: { backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  busPassBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: '#343D96', textTransform: 'uppercase' },
  busPassTitle: { fontSize: 26, fontWeight: '900', color: '#343D96', letterSpacing: -0.5 },
  busPassDesc: { fontSize: 14, color: 'rgba(52,61,150,0.7)', marginTop: 6, lineHeight: 20 },
  showPassBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#343D96', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, alignSelf: 'flex-start', marginTop: 16 },
  showPassText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  outpassCard: { borderRadius: 20, padding: 24 },
  outpassTitle: { fontSize: 24, fontWeight: '900', color: '#005858', marginTop: 12, letterSpacing: -0.5 },
  outpassDesc: { fontSize: 14, color: 'rgba(0,88,88,0.7)', marginTop: 6 },
  outpassBtn: { backgroundColor: '#005858', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  outpassBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  essentialsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  essentialsTitle: { fontSize: 26, fontWeight: '900', color: '#1F2937', letterSpacing: -0.5 },
  viewAllText: { fontSize: 11, fontWeight: '800', color: '#8B4B00', letterSpacing: 1 },
  essentialCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 12,
    flexDirection: 'row', alignItems: 'flex-start', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  essentialIconBg: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  essentialContent: { flex: 1 },
  essentialCardTitle: { fontSize: 17, fontWeight: '800', color: '#1F2937' },
  essentialCardDesc: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
  essentialFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  dueText: { fontSize: 10, fontWeight: '800', color: '#B02500', letterSpacing: 0.5 },
  libraryCard: { backgroundColor: '#EFF1F2', borderRadius: 20, padding: 20 },
  libraryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  libraryTitle: { fontSize: 22, fontWeight: '900', color: '#1F2937' },
  librarySubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  bookItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, gap: 14 },
  bookCover: { width: 48, height: 60, borderRadius: 8, backgroundColor: '#F5F6F7', justifyContent: 'center', alignItems: 'center' },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  bookDue: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  renewBtn: { backgroundColor: '#4953AC', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  renewBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  onTimeBadge: { backgroundColor: '#8DEDEC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  onTimeText: { fontSize: 10, fontWeight: '800', color: '#005858' },
  alertsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    borderLeftWidth: 6, borderLeftColor: '#8B4B00',
    shadowColor: '#312E81', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4,
  },
  alertsTitle: { fontSize: 22, fontWeight: '900', color: '#1F2937', marginBottom: 16 },
  alertItem: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  alertContent: { flex: 1 },
  alertItemTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  alertItemDesc: { fontSize: 12, color: '#6B7280', lineHeight: 18, marginTop: 4 },
  alertTag: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 6 },
  clearAllBtn: { marginTop: 8, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  clearAllText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  // Drawer
  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row', justifyContent: 'flex-end' },
  drawerContainer: { width: width * 0.78, height: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderBottomLeftRadius: 32, overflow: 'hidden' },
  drawerHeader: { paddingTop: 60, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  drawerAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', marginBottom: 14 },
  drawerName: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  drawerRole: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },
  drawerId: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '700', letterSpacing: 1 },
  drawerItems: { paddingTop: 20, paddingHorizontal: 16 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 14, marginBottom: 4 },
  drawerItemHighlight: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FFEDD5' },
  drawerItemText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  drawerItemTextHighlight: { color: '#EA580C', fontWeight: '800' },
});

export default ERPHubScreen;
