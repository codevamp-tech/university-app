import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform, Modal, Switch, TextInput,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const [activeMood, setActiveMood] = React.useState(2);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [isHostelMode, setIsHostelMode] = React.useState(false);
  const [gatePassStatus, setGatePassStatus] = React.useState('idle'); // idle, pending, approved
  const [showQRModal, setShowQRModal] = React.useState(false);
  const [showRequestModal, setShowRequestModal] = React.useState(false);
  const [outpassForm, setOutpassForm] = React.useState({ reason: '', duration: '2 Hours' });


  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>

      {/* TopAppBar */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={isDark ? ['#9A3412', '#7C2D12'] : ['#EA580C', '#9A3412']}
            style={styles.logoIconBg}
          >
            <MaterialIcons name="school" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => navigation.navigate('CampusJournal')}
          >
            <Image
              source={require('../../../assets/journal-logo.webp')}
              style={styles.journalIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowProfileMenu(true)}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
              style={[styles.avatarSmall, { borderColor: colors.primary }]}
            />
          </TouchableOpacity>
        </View>
      </View>



      {/* Profile Dropdown Modal */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={[styles.profileMenu, { top: insets.top + 50, backgroundColor: colors.card, borderColor: colors.border }]}>

            <View style={styles.menuHeader}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
                style={styles.menuAvatar}
              />
              <View>
                <Text style={[styles.menuName, { color: colors.textPrimary }]}>Aryan Kumar</Text>
                <Text style={[styles.menuSub, { color: colors.textSecondary }]}>Student Account</Text>

              </View>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />


            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowProfileMenu(false);
                navigation.navigate('Settings');
              }}
            >
              <MaterialCommunityIcons name="cog-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Setting</Text>

            </TouchableOpacity>

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="moon-waning-crescent" size={20} color={colors.textSecondary} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Dark Mode</Text>

              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />

            </View>

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="home-city-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Hostel Mode</Text>
              </View>
              <Switch
                value={isHostelMode}
                onValueChange={setIsHostelMode}
                trackColor={{ false: colors.border, true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />


            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}
              onPress={() => {
                setShowProfileMenu(false);
                navigation.replace('Login');
              }}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, styles.logoutText]}>Log out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Gate Pass QR Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={[styles.qrContainer, { backgroundColor: colors.card }]}>
            <View style={styles.qrHeader}>
               <Text style={[styles.qrTitle, { color: colors.textPrimary }]}>Exit Gate Pass</Text>
               <TouchableOpacity onPress={() => setShowQRModal(false)}>
                 <MaterialIcons name="close" size={24} color={colors.textPrimary} />
               </TouchableOpacity>
            </View>
            
            <View style={styles.qrWrapper}>
               <MaterialCommunityIcons name="qrcode" size={200} color={isDark ? '#FFF' : '#111827'} />
               <View style={styles.qrStatusBadge}>
                 <Text style={styles.qrStatusText}>VALID UNTIL 10:30 PM</Text>
               </View>
            </View>

            <View style={styles.qrInfo}>
               <Text style={[styles.qrInfoName, { color: colors.textPrimary }]}>Aryan Kumar</Text>
               <Text style={[styles.qrInfoSub, { color: colors.textSecondary }]}>Room 402 • Main Hostel</Text>
            </View>

            <TouchableOpacity 
              style={[styles.qrDownloadBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowQRModal(false)}
            >
               <Text style={styles.qrDownloadText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Outpass Request Form Modal */}
      <Modal
        visible={showRequestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.requestModalOverlay}>
          <View style={[styles.requestContainer, { backgroundColor: colors.card }]}>
            <View style={styles.qrHeader}>
               <Text style={[styles.qrTitle, { color: colors.textPrimary }]}>Apply for Outpass</Text>
               <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                 <MaterialIcons name="close" size={24} color={colors.textPrimary} />
               </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
               <Text style={[styles.formLabel, { color: colors.textSecondary }]}>REASON FOR EXIT</Text>
               <TextInput 
                 style={[styles.formInput, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.border }]}
                 placeholder="e.g., Grocery shopping, Visiting family..."
                 placeholderTextColor={colors.textMuted}
                 value={outpassForm.reason}
                 onChangeText={(text) => setOutpassForm({...outpassForm, reason: text})}
               />
            </View>

            <View style={styles.formGroup}>
               <Text style={[styles.formLabel, { color: colors.textSecondary }]}>DURATION</Text>
               <View style={styles.durationRow}>
                 {['2 Hours', '4 Hours', 'Full Day', 'Overnight'].map((d) => (
                   <TouchableOpacity 
                     key={d} 
                     style={[
                       styles.durationBtn, 
                       { backgroundColor: outpassForm.duration === d ? colors.primary : isDark ? '#1F2937' : '#F1F5F9' }
                     ]}
                     onPress={() => setOutpassForm({...outpassForm, duration: d})}
                   >
                     <Text style={[styles.durationBtnText, { color: outpassForm.duration === d ? '#FFF' : colors.textPrimary }]}>{d}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (!outpassForm.reason) return;
                setShowRequestModal(false);
                setGatePassStatus('pending');
                // Simulate warden approval
                setTimeout(() => {
                  setGatePassStatus('approved');
                }, 3000);
              }}
            >
               <Text style={styles.submitBtnText}>SEND TO WARDEN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Main User Card with Gradient */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={isDark ? [colors.card, colors.background] : ['#FFFFFF', '#F9FAFB']}
            style={[styles.userCard, { borderColor: colors.border }]}

            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.userCardTop}>
              <View>
                <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Hello, Aryan</Text>
                <Text style={[styles.welcomeSub, { color: colors.textSecondary }]}>Senior B.Tech CSE • Class of '24</Text>

              </View>
              <MaterialCommunityIcons name="star-shooting-outline" size={32} color={colors.primary} style={{ opacity: 0.2 }} />
            </View>


            {/* Stats Row */}
            <View style={styles.statsRow}>
              <LinearGradient 
                colors={isDark ? ['rgba(234, 88, 12, 0.2)', 'rgba(234, 88, 12, 0.1)'] : ['#FFF7ED', '#FFEDD5']} 
                style={[styles.statPillOrange, { borderColor: isDark ? 'rgba(234, 88, 12, 0.3)' : '#FFEDD5' }]}
              >
                <Text style={[styles.statValueOrange, { color: isDark ? '#FB923C' : '#9A3412' }]}>8.9</Text>
                <Text style={[styles.statLabelOrange, { color: isDark ? '#FB923C' : '#9A3412' }]}>ACADEMIC CGPA</Text>
              </LinearGradient>
              <LinearGradient 
                colors={isDark ? ['rgba(67, 56, 202, 0.2)', 'rgba(67, 56, 202, 0.1)'] : ['#EEF2FF', '#E0E7FF']} 
                style={[styles.statPillPurple, { borderColor: isDark ? 'rgba(67, 56, 202, 0.3)' : '#E0E7FF' }]}
              >
                <Text style={[styles.statValuePurple, { color: isDark ? '#818CF8' : '#3730A3' }]}>850</Text>
                <Text style={[styles.statLabelPurple, { color: isDark ? '#818CF8' : '#3730A3' }]}>SOCIAL CREDITS</Text>
              </LinearGradient>
            </View>

            <LinearGradient 
              colors={isDark ? ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)'] : ['#ECFDF5', '#D1FAE5']} 
              style={[styles.aiSuggestionBox, { borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0' }]}
            >
              <View style={[styles.aiIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6,95,70,0.1)' }]}>
                <MaterialCommunityIcons name="auto-fix" size={20} color={isDark ? '#34D399' : '#065F46'} />
              </View>
              <Text style={[styles.aiSuggestionText, { color: isDark ? '#A7F3D0' : '#064E3B' }]}>
                <Text style={{ fontWeight: '800' }}>AI Insight:</Text> Based on your Python scores, you're a 92% match for Senior Dev roles.
              </Text>
            </LinearGradient>

            {/* Premium Fitness Bar */}
            <TouchableOpacity 
              style={[styles.fitnessCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => navigation.navigate('FitnessDetail')}
              activeOpacity={0.8}
            >
              <View style={styles.fitnessHeader}>
                <View style={[styles.fitnessIconBg, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="heart-pulse" size={20} color="#EF4444" />
                </View>
                <View style={styles.fitnessHeaderText}>
                  <Text style={[styles.fitnessTitle, { color: colors.textPrimary }]}>Campus Fitness</Text>
                  <Text style={[styles.fitnessSub, { color: colors.textSecondary }]}>Active for 42m today</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
              </View>

              <View style={styles.fitnessBody}>
                <View style={styles.fitnessRingContainer}>
                  <View style={styles.ringStack}>
                    <View style={[styles.ringBase, { borderColor: '#EF444420' }]} />
                    <View style={[styles.ringFill, { borderColor: '#EF4444', borderRightColor: 'transparent', transform: [{ rotate: '45deg' }] }]} />
                    <View style={[styles.ringBase, { width: 34, height: 34, borderColor: '#10B98120' }]} />
                    <View style={[styles.ringFill, { width: 34, height: 34, borderColor: '#10B981', borderBottomColor: 'transparent', transform: [{ rotate: '-15deg' }] }]} />
                    <View style={[styles.ringBase, { width: 22, height: 22, borderColor: '#3B82F620' }]} />
                    <View style={[styles.ringFill, { width: 22, height: 22, borderColor: '#3B82F6', borderLeftColor: 'transparent', transform: [{ rotate: '120deg' }] }]} />
                  </View>
                </View>

                <View style={styles.fitnessVDivider} />

                <View style={styles.fitnessGridStats}>
                  <View style={styles.fitnessRow}>
                    <View style={styles.fitnessItem}>
                      <Text style={[styles.fitnessVal, { color: colors.textPrimary }]}>8,420</Text>
                      <Text style={styles.fitnessLabel}>STEPS</Text>
                    </View>
                    <View style={styles.fitnessItem}>
                      <Text style={[styles.fitnessVal, { color: colors.textPrimary }]}>420</Text>
                      <Text style={styles.fitnessLabel}>KCAL</Text>
                    </View>
                  </View>
                  <View style={[styles.fitnessHDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.fitnessRow}>
                    <View style={styles.fitnessItem}>
                      <Text style={[styles.fitnessVal, { color: colors.textPrimary }]}>45</Text>
                      <Text style={styles.fitnessLabel}>FOCUS</Text>
                    </View>
                    <View style={styles.fitnessItem}>
                      <Text style={[styles.fitnessVal, { color: colors.textPrimary }]}>7.2</Text>
                      <Text style={styles.fitnessLabel}>SLEEP</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

          </LinearGradient>
        </View>
        {isHostelMode && (
          <View style={styles.sectionContainer}>
            <View style={styles.hostelHeaderRow}>
               <View>
                 <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>Hostel Connect</Text>
                 <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Home away from home • Room 402</Text>
               </View>
               <TouchableOpacity 
                 style={[
                   styles.gatePassBtn, 
                   { backgroundColor: gatePassStatus === 'pending' ? '#FEF3C7' : gatePassStatus === 'approved' ? '#ECFDF5' : isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }
                 ]}
                 onPress={() => {
                   if (gatePassStatus === 'idle') {
                     setShowRequestModal(true);
                   } else if (gatePassStatus === 'approved') {
                     setShowQRModal(true);
                   }
                 }}
               >
                 <MaterialCommunityIcons 
                   name={gatePassStatus === 'pending' ? 'clock-outline' : gatePassStatus === 'approved' ? 'check-circle-outline' : 'qrcode-scan'} 
                   size={20} 
                   color={gatePassStatus === 'pending' ? '#D97706' : '#10B981'} 
                 />
                 <Text style={[styles.gatePassText, { color: gatePassStatus === 'pending' ? '#D97706' : '#10B981' }]}>
                   {gatePassStatus === 'pending' ? 'WAITING...' : gatePassStatus === 'approved' ? 'VIEW PASS' : 'REQUEST PASS'}
                 </Text>
               </TouchableOpacity>
            </View>

            <View style={styles.hostelGrid}>
              {/* Mess Menu */}
              <TouchableOpacity 
                style={[styles.hostelCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
                onPress={() => navigation.navigate('HostelMess')}
              >
                <View style={[styles.hostelIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="food-variant" size={20} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hostelCardTitle, { color: colors.textPrimary }]}>Tonight's Dinner</Text>
                  <Text style={[styles.hostelCardSub, { color: colors.textSecondary }]} numberOfLines={1}>Paneer, Dal, Roti, Kheer</Text>
                </View>
                <Text style={styles.messTime}>8:00 PM</Text>
              </TouchableOpacity>

              {/* Laundry Status */}
              <View style={[styles.hostelCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                <View style={[styles.hostelIconCircle, { backgroundColor: '#E0E7FF' }]}>
                  <MaterialCommunityIcons name="washing-machine" size={20} color="#4338CA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hostelCardTitle, { color: colors.textPrimary }]}>Laundry Status</Text>
                  <Text style={[styles.hostelCardSub, { color: colors.textSecondary }]}>3/5 Washers Available</Text>
                </View>
                <View style={styles.statusDot} />
              </View>

            </View>
          </View>
        )}

        {/* Quick Launchpad (Links to the new massive modules) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>Campus Launchpad</Text>

          <View style={styles.launchpadGrid}>
            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('CampusBitesMenu')}
            >
              <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.launchIconBg}>
                <MaterialCommunityIcons name="food" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.launchText, { color: colors.textPrimary }]}>Order Food</Text>

            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('RaiseIssue')}
            >
              <LinearGradient colors={['#FFD700', '#B8860B']} style={styles.launchIconBg}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#111827" />
              </LinearGradient>
              <Text style={[styles.launchText, { color: colors.textPrimary }]}>Raise Issue</Text>

            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('TheHustle')}
            >
              <LinearGradient colors={['#059669', '#064E3B']} style={styles.launchIconBg}>
                <MaterialCommunityIcons name="trending-up" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.launchText, { color: colors.textPrimary }]}>The Hustle</Text>

            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('ERPHub')}
            >
              <LinearGradient colors={['#D97706', '#92400E']} style={styles.launchIconBg}>
                <MaterialCommunityIcons name="office-building" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.launchText, { color: colors.textPrimary }]}>ERP</Text>

            </TouchableOpacity>
          </View>
        </View>

        {/* Pulse Check */}
        <View style={styles.sectionContainer}>
          <View style={[styles.pulseCard, { backgroundColor: colors.card }]}>
            <View style={styles.pulseHeaderRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pulse Check</Text>
                <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>How are you feeling today?</Text>
              </View>
              <MaterialCommunityIcons name="heart-pulse" size={28} color="#EA580C" opacity={0.5} />
            </View>

            <View style={styles.moodRow}>
              {[
                { id: 0, icon: 'emoticon-excited-outline' },
                { id: 1, icon: 'emoticon-happy-outline' },
                { id: 2, icon: 'emoticon-neutral-outline' },
                { id: 3, icon: 'emoticon-sad-outline' },
              ].map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  onPress={() => setActiveMood(mood.id)}
                  style={[
                    styles.moodBtn,
                    { backgroundColor: activeMood === mood.id ? '#EA580C' : isDark ? '#1F2937' : '#F1F5F9' }
                  ]}
                >
                  <MaterialCommunityIcons 
                    name={mood.icon} 
                    size={28} 
                    color={activeMood === mood.id ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>


        <View style={styles.sectionContainer}>
          <View style={[styles.mentallyBox, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
            <View style={[styles.mentallyIconCircle, { backgroundColor: isDark ? '#334155' : '#E0E7FF' }]}>
              <MaterialCommunityIcons name="brain" size={16} color="#4338CA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mentallyText, { color: isDark ? '#A5B4FC' : '#3730A3' }]}>
                "Stress levels look slightly high before the Python finals. Need a 5-min mindfulness break?"
              </Text>

              <TouchableOpacity onPress={() => navigation.navigate('MentallyMain')}>
                  <Text style={[styles.mentallyAction, { color: isDark ? '#818CF8' : '#4338CA' }]}>TALK TO MENTALLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* E-Library Module */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>E-Library</Text>
              <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Expand your knowledge</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('LibraryMain')}>
              <Text style={[styles.viewAllText, { color: '#EA580C' }]}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.libraryGrid}>
            {[
              { id: '1', title: 'Clean Code', author: 'Robert Martin', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop' },
              { id: '2', title: 'Pragmatic Dev', author: 'Andrew Hunt', img: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1000&auto=format&fit=crop' },
              { id: '3', title: 'AI Theory', author: 'Stuart Russell', img: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=1000&auto=format&fit=crop' },
              { id: '4', title: 'Design Patterns', author: 'Erich Gamma', img: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1000&auto=format&fit=crop' },
            ].map((book) => (
              <TouchableOpacity 
                key={book.id} 
                style={styles.libraryBookCard}
                onPress={() => navigation.navigate('LibraryMain')}
              >
                <Image source={{ uri: book.img }} style={styles.libraryBookImg} />
                <Text style={[styles.libraryBookTitle, { color: colors.textPrimary }]} numberOfLines={1}>{book.title}</Text>
                <Text style={[styles.libraryBookAuthor, { color: colors.textMuted }]} numberOfLines={1}>{book.author}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.innovationHeader}>
          <Text style={[styles.innovationBadge, { color: colors.primary }]}>INNOVATION HUB</Text>
          <Text style={[styles.innovationTitle, { color: colors.textPrimary }]}>Career AI Catalyst</Text>
        </View>


        {/* Career Hub Grid */}
        <View style={styles.careerGrid}>
          {/* Resume Builder */}
          <LinearGradient 
            colors={isDark ? [colors.card, colors.background] : ['#ffffff', '#fffaf0']} 
            style={[styles.resumeCard, { borderColor: colors.border }]}
          >
            <View style={[styles.resumeIcon, { backgroundColor: isDark ? colors.background : '#FFF7ED' }]}>
              <MaterialCommunityIcons name="file-document-edit-outline" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>AI Resume Builder</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>Smart tailoring based on your 8.9 CGPA and technical skills in {APP_CONFIG.UNIVERSITY_SHORT_NAME} labs.</Text>

            <TouchableOpacity style={[styles.resumeBtn, { backgroundColor: isDark ? colors.primary : '#111827' }]}>
              <Text style={styles.resumeBtnText}>Update Resume</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <View style={styles.resumeBgIcon}>
              <MaterialCommunityIcons name="file-document" size={120} color={colors.primary} style={{ opacity: 0.05 }} />
            </View>
          </LinearGradient>


          {/* Mock Interview */}
          <LinearGradient colors={isDark ? ['#312E81', '#1E1B4B'] : ['#4338CA', '#312E81']} style={styles.interviewCard}>
            <View style={styles.interviewTop}>
              <View style={[styles.interviewIconBg, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                <MaterialCommunityIcons name="microphone" size={24} color={isDark ? colors.primary : "#4338CA"} />
              </View>
              <MaterialIcons name="auto-awesome" size={24} color={isDark ? colors.primaryLight : "#A5B4FC"} />
            </View>
            <View>
              <Text style={styles.interviewTitle}>Mock Interview</Text>
              <Text style={[styles.interviewDesc, { color: isDark ? '#C7D2FE' : '#C7D2FE' }]}>Practice with specialized AI for 'Cloud Architect' roles.</Text>

            </View>
            <View style={[styles.practicingRow, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <View style={styles.practicingAvatars}>
                <Image source={{ uri: 'https://i.pravatar.cc/100?u=1' }} style={[styles.miniAvatar, { borderColor: isDark ? colors.primary : '#4338CA' }]} />
                <Image source={{ uri: 'https://i.pravatar.cc/100?u=2' }} style={[styles.miniAvatar, { marginLeft: -10, borderColor: isDark ? colors.primary : '#4338CA' }]} />
                <View style={[styles.countBadge, { backgroundColor: isDark ? colors.card : '#E0E7FF', borderColor: isDark ? colors.primary : '#4338CA' }]}><Text style={[styles.countText, { color: isDark ? colors.textPrimary : '#312E81' }]}>+12</Text></View>
              </View>
              <Text style={styles.practicingText}>Practicing now</Text>
            </View>
          </LinearGradient>

        </View>

        {/* ========== SKILL GAP ANALYSIS ========== */}
        <View style={styles.sectionContainer}>
          <View style={[styles.skillGapCard, { backgroundColor: colors.card, paddingBottom: 24 }]}>
            <View style={styles.skillGapHeader}>
              <View style={[styles.skillGapIconWrapper, { backgroundColor: isDark ? colors.background : '#FFF7ED' }]}>
                <MaterialCommunityIcons name="chart-areaspline" size={24} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.skillGapTitle, { color: colors.textPrimary }]}>Skill Gap Analysis</Text>
            <Text style={[styles.skillGapDesc, { color: colors.textSecondary }]}>What's missing for FAANG?</Text>


            <View style={styles.skillGapProgressSection}>
              <View style={styles.skillProgressItem}>
                <View style={styles.skillProgressHeader}>
                  <Text style={[styles.skillName, { color: colors.textPrimary }]}>DSA</Text>
                  <Text style={[styles.skillPercent, { color: colors.textPrimary }]}>65%</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
                  <View style={[styles.progressBarFill, { width: '65%', backgroundColor: '#F59E0B' }]} />
                </View>
              </View>

              <View style={styles.skillProgressItem}>
                <View style={styles.skillProgressHeader}>
                  <Text style={[styles.skillName, { color: colors.textPrimary }]}>System Design</Text>
                  <Text style={[styles.skillPercent, { color: colors.textPrimary }]}>40%</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
                  <View style={[styles.progressBarFill, { width: '40%', backgroundColor: '#EF4444' }]} />
                </View>
              </View>

              <View style={styles.skillProgressItem}>
                <View style={styles.skillProgressHeader}>
                  <Text style={[styles.skillName, { color: colors.textPrimary }]}>Cloud Computing</Text>
                  <Text style={[styles.skillPercent, { color: colors.textPrimary }]}>78%</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
                  <View style={[styles.progressBarFill, { width: '78%', backgroundColor: '#10B981' }]} />
                </View>
              </View>

            </View>
            <View style={styles.skillGapActions}>
              <TouchableOpacity 
                style={styles.giveTestBtn}
                onPress={() => navigation.navigate('SkillGapTest')}
              >
                <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.giveTestBtnGradient}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.giveTestBtnText}>Give Test</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.analyzeBtn, { borderColor: colors.border }]}
                onPress={() => navigation.navigate('DeepDiveAnalysis')}
              >
                <Text style={[styles.analyzeBtnText, { color: colors.primary }]}>Deep Dive Analysis →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ========== CAREER ROADMAP ========== */}
        <View style={styles.sectionContainer}>
          <View style={styles.roadmapHeader}>
            <Text style={[styles.roadmapTitle, { color: colors.textPrimary }]}>Career Roadmap</Text>
            <Text style={[styles.roadmapSubtitle, { color: colors.textSecondary }]}>Your projected path from Student to Senior Dev</Text>

          </View>

          <View style={styles.timelineContainer}>
            {/* Year 1 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineDotWrapper}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.timelineDot} />
                <View style={styles.timelineLine} />
              </View>
              <LinearGradient colors={isDark ? ['#064E3B', '#10B981'] : ['#F0FDF4', '#DCFCE7']} style={styles.timelineCard}>
                <Text style={[styles.timelineYear, { color: colors.textSecondary }]}>YEAR 1: FOUNDATION</Text>
                <Text style={[styles.timelineCardTitle, { color: colors.textPrimary }]}>Build Core CS Fundamentals</Text>

                <View style={styles.timelineTags}>
                  <View style={styles.tag}><Text style={styles.tagText}>Python</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>DSA Basics</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>SQL</Text></View>
                </View>
              </LinearGradient>
            </View>

            {/* Year 2 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineDotWrapper}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.timelineDot} />
                <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
              </View>
              <LinearGradient colors={isDark ? ['#78350F', '#451A03'] : ['#FFFBEB', '#FEF3C7']} style={[styles.timelineCard, { borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.timelineYear, { color: isDark ? '#FCD34D' : colors.textSecondary }]}>YEAR 2: INTERMEDIATE</Text>
                <Text style={[styles.timelineCardTitle, { color: colors.textPrimary }]}>Specialize & Build Projects</Text>
                <View style={styles.timelineTags}>
                  <View style={[styles.tag, { backgroundColor: isDark ? colors.background : '#FFFFFF', borderColor: colors.border }]}><Text style={[styles.tagText, { color: colors.textSecondary }]}>Web Dev</Text></View>
                  <View style={[styles.tag, { backgroundColor: isDark ? colors.background : '#FFFFFF', borderColor: colors.border }]}><Text style={[styles.tagText, { color: colors.textSecondary }]}>DBMS</Text></View>
                  <View style={[styles.tag, { backgroundColor: isDark ? colors.background : '#FFFFFF', borderColor: colors.border }]}><Text style={[styles.tagText, { color: colors.textSecondary }]}>OS</Text></View>
                </View>
              </LinearGradient>
            </View>


            {/* Year 3 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineDotWrapper}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.timelineDot} />
                <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
              </View>
              <LinearGradient colors={isDark ? ['#1E3A8A', '#3B82F6'] : ['#EFF6FF', '#DBEAFE']} style={styles.timelineCard}>
                <Text style={[styles.timelineYear, { color: isDark ? '#BFDBFE' : colors.textSecondary }]}>YEAR 3: ADVANCED</Text>
                <Text style={[styles.timelineCardTitle, { color: isDark ? '#FFFFFF' : colors.textPrimary }]}>Internship & Open Source</Text>
                <View style={styles.timelineTags}>
                  <View style={[styles.tag, { backgroundColor: isDark ? colors.background : '#FFFFFF', borderColor: colors.border }]}><Text style={[styles.tagText, { color: colors.textSecondary }]}>React/Node</Text></View>
                  <View style={[styles.tag, { backgroundColor: isDark ? colors.background : '#FFFFFF', borderColor: colors.border }]}><Text style={[styles.tagText, { color: colors.textSecondary }]}>Cloud</Text></View>
                  <View style={[styles.tag, { backgroundColor: isDark ? colors.background : '#FFFFFF', borderColor: colors.border }]}><Text style={[styles.tagText, { color: colors.textSecondary }]}>DevOps</Text></View>
                </View>
              </LinearGradient>
            </View>

            {/* Year 4: SPECIALIZATION (Active) */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineDotWrapper}>
                <LinearGradient colors={['#EA580C', '#9A3412']} style={[styles.timelineDot, styles.timelineDotActive, { borderColor: isDark ? colors.primaryLight : '#FED7AA' }]} />
              </View>
              <LinearGradient 
                colors={isDark ? ['#7C2D12', '#EA580C'] : ['#FFF7ED', '#FFEDD5']} 
                style={[styles.timelineCard, styles.timelineCardActive, { borderColor: isDark ? colors.primary : '#EA580C' }]}
              >
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>CURRENT</Text>
                </View>
                <Text style={[styles.timelineYear, { color: isDark ? '#FED7AA' : colors.textSecondary }]}>YEAR 4: SPECIALIZATION</Text>
                <Text style={[styles.timelineCardTitle, { color: isDark ? '#FFFFFF' : colors.textPrimary }]}>Mastery & Placement Prep</Text>
                <View style={styles.timelineTags}>
                  <View style={[styles.tag, styles.tagActive, { backgroundColor: colors.primary, borderColor: colors.primary }]}><Text style={[styles.tagText, styles.tagTextActive]}>System Design</Text></View>
                  <View style={[styles.tag, styles.tagActive, { backgroundColor: colors.primary, borderColor: colors.primary }]}><Text style={[styles.tagText, styles.tagTextActive]}>Advanced DSA</Text></View>
                  <View style={[styles.tag, styles.tagActive, { backgroundColor: colors.primary, borderColor: colors.primary }]}><Text style={[styles.tagText, styles.tagTextActive]}>Leadership</Text></View>
                </View>
              </LinearGradient>
            </View>

          </View>
        </View>

        {/* ═══════════════════════════════════════════════ */}
        {/* TODAY'S MENU — Campus Food Ordering             */}
        {/* ═══════════════════════════════════════════════ */}
        <View style={styles.sectionContainer}>
          <View style={styles.menuSectionHeader}>
            <View>
              <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>CAMPUS DINING</Text>
              <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Today's Menu</Text>
            </View>
            <TouchableOpacity
              style={[styles.viewAllBtn, { backgroundColor: isDark ? 'rgba(234,88,12,0.15)' : '#FFF7ED' }]}
              onPress={() => navigation.navigate('CampusBitesMenu')}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Horizontal scroll of food cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuScroll}
          >
            {[
              {
                id: 1,
                name: 'Special Veg Thali',
                price: '₹249',
                tag: 'Bestseller',
                rating: '4.9',
                image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&auto=format&fit=crop',
              },
              {
                id: 2,
                name: 'Paneer Tikka',
                price: '₹120',
                tag: 'Campus Fav',
                rating: '4.8',
                image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&auto=format&fit=crop',
              },
              {
                id: 3,
                name: 'Masala Chai',
                price: '₹25',
                tag: 'Quick Pick',
                rating: '4.8',
                image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop',
              },
              {
                id: 4,
                name: 'Chole Bhature',
                price: '₹85',
                tag: 'Today Special',
                rating: '4.9',
                image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop',
              },
            ].map((food) => (
              <TouchableOpacity
                key={food.id}
                style={[styles.menuCard, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate('CampusBitesMenu')}
                activeOpacity={0.85}
              >
                <Image source={{ uri: food.image }} style={styles.menuCardImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.55)']}
                  style={styles.menuCardOverlay}
                >
                  <View style={styles.menuCardBadge}>
                    <Text style={styles.menuCardBadgeText}>{food.tag}</Text>
                  </View>
                </LinearGradient>
                <View style={styles.menuCardBody}>
                  <Text style={[styles.menuCardName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {food.name}
                  </Text>
                  <View style={styles.menuCardFooter}>
                    <Text style={[styles.menuCardPrice, { color: isDark ? '#FB923C' : '#9A3412' }]}>
                      {food.price}
                    </Text>
                    <View style={styles.menuCardRating}>
                      <MaterialIcons name="star" size={11} color="#F97316" />
                      <Text style={styles.menuCardRatingText}>{food.rating}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {/* View All Card */}
            <TouchableOpacity
              style={[styles.menuViewAllCard, { backgroundColor: isDark ? '#1E293B' : '#FFF7ED' }]}
              onPress={() => navigation.navigate('CampusBitesMenu')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.menuViewAllIcon}>
                <MaterialCommunityIcons name="food" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.menuViewAllLabel, { color: isDark ? '#FB923C' : '#9A3412' }]}>
                View Full{'\n'}Menu
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color={isDark ? '#FB923C' : '#9A3412'} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconBtn: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  journalIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  avatarSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
  },

  // Profile Dropdown Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  profileMenu: {
    position: 'absolute',
    right: 16,
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 4,
  },
  menuAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  menuName: {
    fontSize: 16,
    fontWeight: '800',
  },
  menuSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },

  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 6,
    marginHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
  },

  logoutItem: {
    backgroundColor: '#FEF2F2',
    marginTop: 2,
  },
  logoutText: {
    color: '#EF4444',
  },

  scroll: {
    paddingBottom: 20,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  userCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  welcomeSub: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statPillOrange: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignItems: 'flex-start',
  },

  statValueOrange: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabelOrange: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  statPillPurple: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignItems: 'flex-start',
  },

  statValuePurple: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabelPurple: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  aiSuggestionBox: {
    marginTop: 24,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
  },

  aiIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(6,95,70,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSuggestionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    paddingRight: 10,
  },

  moduleTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  launchpadGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  launchBtn: {
    alignItems: 'center',
    gap: 8,
    width: '23%',
  },
  launchIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  launchText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  pulseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  pulseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: 14,
    marginTop: 4,
  },

  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
  },
  moodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodIconActive: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },

  mentallyBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  mentallyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  mentallyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  mentallyAction: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  innovationHeader: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  innovationBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  innovationTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -1,
  },

  careerGrid: {
    padding: 16,
    gap: 16,
  },
  resumeCard: {
    borderRadius: 32,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },

  resumeIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
  },

  cardDesc: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 22,
    maxWidth: '80%',
  },

  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginTop: 24,
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  resumeBgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    zIndex: -1,
  },
  interviewCard: {
    borderRadius: 32,
    padding: 28,
    gap: 24,
    minHeight: 220,
    justifyContent: 'space-between',
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
  interviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interviewIconBg: {
    backgroundColor: '#FFFFFF',
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interviewTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  interviewDesc: {
    fontSize: 14,
    color: '#C7D2FE',
    marginTop: 8,
    lineHeight: 22,
  },
  practicingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'flex-start',
    gap: 12,
  },
  practicingAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#4338CA',
  },
  countBadge: {
    backgroundColor: '#E0E7FF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#4338CA',
  },
  countText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#312E81',
  },
  practicingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  // Skill Gap Analysis Styles
  skillGapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  skillGapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  skillGapIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillGapTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  skillGapDesc: {
    fontSize: 14,
    marginBottom: 20,
  },
  skillGapProgressSection: {
    gap: 16,
    marginBottom: 24,
  },
  skillProgressItem: {
    gap: 8,
  },
  skillProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillName: {
    fontSize: 14,
    fontWeight: '600',
  },
  skillPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  analyzeBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  analyzeBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  // Career Roadmap Styles
  roadmapHeader: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  roadmapTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  roadmapSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },

  timelineContainer: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDotWrapper: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  timelineDotActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#FED7AA',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    position: 'absolute',
    top: 36,
    bottom: -20,
    left: '50%',
    marginLeft: -1,
  },
  timelineCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    marginLeft: 8,
    marginBottom: 8,
  },
  timelineCardActive: {
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  timelineYear: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 8,
  },
  timelineCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },

  timelineTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
  activeBadge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Today's Menu Styles ──
  menuSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  menuScroll: {
    paddingRight: 16,
    gap: 12,
  },
  menuCard: {
    width: width * 0.42,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent', // Can map to colors.border if you prefer
  },
  menuCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  menuCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    padding: 12,
  },
  menuCardBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  menuCardBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  menuCardBody: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  menuCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
  },
  menuCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuCardPrice: {
    fontSize: 16,
    fontWeight: '900',
  },
  menuCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  menuCardRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9A3412',
  },
  menuViewAllCard: {
    width: width * 0.35,
    height: 180,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#FED7AA',
    gap: 12,
  },
  menuViewAllIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillGapActions: {
    marginTop: 20,
    gap: 12,
  },
  giveTestBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  giveTestBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  giveTestBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  fitnessCard: {
    padding: 20,
    borderRadius: 28,
    marginTop: 16,
  },
  fitnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  fitnessIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fitnessHeaderText: {
    flex: 1,
  },
  fitnessTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  fitnessSub: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.6,
  },
  fitnessBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  fitnessRingContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringStack: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringBase: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 8,
  },
  ringFill: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 8,
  },
  fitnessVDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  fitnessGridStats: {
    flex: 1,
    gap: 10,
  },
  fitnessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fitnessItem: {
    flex: 1,
  },
  fitnessVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  fitnessLabel: {
    fontSize: 9,
    fontWeight: '800',
    opacity: 0.5,
    letterSpacing: 1,
  },
  fitnessHDivider: {
    height: 1,
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '800',
  },
  libraryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  libraryBookCard: {
    width: (width - 48) / 2,
    marginBottom: 20,
  },
  libraryBookImg: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
  },
  libraryBookTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  libraryBookAuthor: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Hostel Mode Styles
  hostelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  gatePassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  gatePassText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hostelGrid: {
    gap: 12,
  },
  hostelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  hostelIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostelCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  hostelCardSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  messTime: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  hostelActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  miniHostelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  miniHostelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // QR Modal Styles
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrContainer: {
    width: '100%',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrStatusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginTop: 16,
  },
  qrStatusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  qrInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrInfoName: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  qrInfoSub: {
    fontSize: 14,
    fontWeight: '500',
  },
  qrDownloadBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  qrDownloadText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  // Request Modal Styles
  requestModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  requestContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  formInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  durationBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

export default DashboardScreen;