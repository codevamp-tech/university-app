import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform, Modal, Switch,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const [activeMood, setActiveMood] = React.useState(2);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);


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
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>Invertis University</Text>
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

            {/* AI Suggestion */}
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

          </LinearGradient>
        </View>

        {/* Quick Launchpad (Links to the new massive modules) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>Campus Launchpad</Text>

          <View style={styles.launchpadGrid}>
            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('SmartCampus')}
            >
              <LinearGradient colors={['#4338CA', '#312E81']} style={styles.launchIconBg}>
                <MaterialCommunityIcons name="augmented-reality" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.launchText, { color: colors.textPrimary }]}>Smart Campus</Text>

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
                >
                  <LinearGradient
                    colors={activeMood === mood.id ? ['#F97316', '#EA580C'] : [colors.card, colors.background]}
                    style={[styles.moodIcon, activeMood === mood.id && styles.moodIconActive, { borderColor: colors.border, borderWidth: 1 }]}

                  >
                    <MaterialCommunityIcons
                      name={mood.icon}
                      size={28}
                      color={activeMood === mood.id ? '#FFFFFF' : colors.textSecondary}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>


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
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>Smart tailoring based on your 8.9 CGPA and technical skills in Invertis labs.</Text>

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
          <TouchableOpacity style={[styles.skillGapCard, { backgroundColor: colors.card }]}>
            <View style={styles.skillGapHeader}>
              <View style={[styles.skillGapIconWrapper, { backgroundColor: isDark ? colors.background : '#FFF7ED' }]}>
                <MaterialCommunityIcons name="chart-areaspline" size={24} color={colors.primary} />
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
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
            <TouchableOpacity style={styles.analyzeBtn}>
              <Text style={[styles.analyzeBtnText, { color: colors.primary }]}>Deep Dive Analysis →</Text>

            </TouchableOpacity>
          </TouchableOpacity>
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
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  analyzeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EA580C',
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
});

export default DashboardScreen;