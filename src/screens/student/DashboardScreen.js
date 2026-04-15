import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeMood, setActiveMood] = React.useState(2);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#EA580C', '#9A3412']}
            style={styles.logoIconBg}
          >
            <MaterialIcons name="school" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.headerLogo}>Invertis University</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialIcons name="qr-code-scanner" size={22} color="#4B5563" />
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
            style={styles.avatarSmall}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Main User Card with Gradient */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.userCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.userCardTop}>
              <View>
                <Text style={styles.welcomeTitle}>Hello, Aryan</Text>
                <Text style={styles.welcomeSub}>Senior B.Tech CSE • Class of '24</Text>
              </View>
              <MaterialCommunityIcons name="star-shooting-outline" size={32} color="#EA580C" style={{ opacity: 0.2 }} />
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.statPillOrange}>
                <Text style={styles.statValueOrange}>8.9</Text>
                <Text style={styles.statLabelOrange}>ACADEMIC CGPA</Text>
              </LinearGradient>
              <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.statPillPurple}>
                <Text style={styles.statValuePurple}>850</Text>
                <Text style={styles.statLabelPurple}>SOCIAL CREDITS</Text>
              </LinearGradient>
            </View>

            {/* AI Suggestion */}
            <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.aiSuggestionBox}>
              <View style={styles.aiIconCircle}>
                <MaterialCommunityIcons name="auto-fix" size={20} color="#065F46" />
              </View>
              <Text style={styles.aiSuggestionText}>
                <Text style={{ fontWeight: '800' }}>AI Insight:</Text> Based on your Python scores, you're a 92% match for Senior Dev roles.
              </Text>
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* Quick Launchpad (Links to the new massive modules) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.moduleTitle}>Campus Launchpad</Text>
          <View style={styles.launchpadGrid}>
            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('SmartCampus')}
            >
              <LinearGradient colors={['#4338CA', '#312E81']} style={styles.launchIconBg}>
                <MaterialCommunityIcons name="augmented-reality" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.launchText}>Smart Campus</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('RaiseIssue')}
            >
              <LinearGradient colors={['#FFD700', '#B8860B']} style={styles.launchIconBg}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#111827" />
              </LinearGradient>
              <Text style={styles.launchText}>Raise Issue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('TheHustle')}
            >
              <LinearGradient colors={['#059669', '#064E3B']} style={styles.launchIconBg}>
                <MaterialCommunityIcons name="trending-up" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.launchText}>The Hustle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={() => navigation.navigate('ERPHub')}
            >
              <LinearGradient colors={['#D97706', '#92400E']} style={styles.launchIconBg}>
                <MaterialCommunityIcons name="account-balance-wallet" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.launchText}>ERP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pulse Check */}
        <View style={styles.sectionContainer}>
          <View style={styles.pulseCard}>
            <View style={styles.pulseHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Pulse Check</Text>
                <Text style={styles.sectionSub}>How are you feeling today?</Text>
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
                    colors={activeMood === mood.id ? ['#F97316', '#EA580C'] : ['#F3F4F6', '#E5E7EB']}
                    style={[styles.moodIcon, activeMood === mood.id && styles.moodIconActive]}
                  >
                    <MaterialCommunityIcons
                      name={mood.icon}
                      size={28}
                      color={activeMood === mood.id ? '#FFFFFF' : '#4B5563'}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.mentallyBox}>
              <View style={styles.mentallyIconCircle}>
                <MaterialCommunityIcons name="brain" size={16} color="#4338CA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mentallyText}>
                  "Stress levels look slightly high before the Python finals. Need a 5-min mindfulness break?"
                </Text>
                <TouchableOpacity><Text style={styles.mentallyAction}>TALK TO MENTALLY</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Innovation Hub Header */}
        <View style={styles.innovationHeader}>
          <Text style={styles.innovationBadge}>INNOVATION HUB</Text>
          <Text style={styles.innovationTitle}>Career AI Catalyst</Text>
        </View>

        {/* Career Hub Grid */}
        <View style={styles.careerGrid}>
          {/* Resume Builder */}
          <LinearGradient colors={['#ffffff', '#fffaf0']} style={styles.resumeCard}>
            <View style={styles.resumeIcon}>
              <MaterialCommunityIcons name="file-document-edit-outline" size={28} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>AI Resume Builder</Text>
            <Text style={styles.cardDesc}>Smart tailoring based on your 8.9 CGPA and technical skills in Invertis labs.</Text>
            <TouchableOpacity style={styles.resumeBtn}>
              <Text style={styles.resumeBtnText}>Update Resume</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <View style={styles.resumeBgIcon}>
              <MaterialCommunityIcons name="file-document" size={120} color="#EA580C" style={{ opacity: 0.05 }} />
            </View>
          </LinearGradient>

          {/* Mock Interview */}
          <LinearGradient colors={['#4338CA', '#312E81']} style={styles.interviewCard}>
            <View style={styles.interviewTop}>
              <View style={styles.interviewIconBg}>
                <MaterialCommunityIcons name="microphone" size={24} color="#4338CA" />
              </View>
              <MaterialIcons name="auto-awesome" size={24} color="#A5B4FC" />
            </View>
            <View>
              <Text style={styles.interviewTitle}>Mock Interview</Text>
              <Text style={styles.interviewDesc}>Practice with specialized AI for 'Cloud Architect' roles.</Text>
            </View>
            <View style={styles.practicingRow}>
              <View style={styles.practicingAvatars}>
                <Image source={{ uri: 'https://i.pravatar.cc/100?u=1' }} style={styles.miniAvatar} />
                <Image source={{ uri: 'https://i.pravatar.cc/100?u=2' }} style={[styles.miniAvatar, { marginLeft: -10 }]} />
                <View style={styles.countBadge}><Text style={styles.countText}>+12</Text></View>
              </View>
              <Text style={styles.practicingText}>Practicing now</Text>
            </View>
          </LinearGradient>
        </View>

        {/* ========== SKILL GAP ANALYSIS ========== */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.skillGapCard}>
            <View style={styles.skillGapHeader}>
              <View style={styles.skillGapIconWrapper}>
                <MaterialCommunityIcons name="chart-areaspline" size={24} color="#EA580C" />
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </View>
            <Text style={styles.skillGapTitle}>Skill Gap Analysis</Text>
            <Text style={styles.skillGapDesc}>What's missing for FAANG?</Text>
            <View style={styles.skillGapProgressSection}>
              <View style={styles.skillProgressItem}>
                <View style={styles.skillProgressHeader}>
                  <Text style={styles.skillName}>DSA</Text>
                  <Text style={styles.skillPercent}>65%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '65%', backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
              <View style={styles.skillProgressItem}>
                <View style={styles.skillProgressHeader}>
                  <Text style={styles.skillName}>System Design</Text>
                  <Text style={styles.skillPercent}>40%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '40%', backgroundColor: '#EF4444' }]} />
                </View>
              </View>
              <View style={styles.skillProgressItem}>
                <View style={styles.skillProgressHeader}>
                  <Text style={styles.skillName}>Cloud Computing</Text>
                  <Text style={styles.skillPercent}>78%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '78%', backgroundColor: '#10B981' }]} />
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.analyzeBtn}>
              <Text style={styles.analyzeBtnText}>Deep Dive Analysis →</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* ========== CAREER ROADMAP ========== */}
        <View style={styles.sectionContainer}>
          <View style={styles.roadmapHeader}>
            <Text style={styles.roadmapTitle}>Career Roadmap</Text>
            <Text style={styles.roadmapSubtitle}>Your projected path from Student to Senior Dev</Text>
          </View>

          <View style={styles.timelineContainer}>
            {/* Year 1 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineDotWrapper}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.timelineDot} />
                <View style={styles.timelineLine} />
              </View>
              <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.timelineCard}>
                <Text style={styles.timelineYear}>YEAR 1: FOUNDATION</Text>
                <Text style={styles.timelineCardTitle}>Build Core CS Fundamentals</Text>
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
                <View style={styles.timelineLine} />
              </View>
              <LinearGradient colors={['#FFFBEB', '#FEF3C7']} style={styles.timelineCard}>
                <Text style={styles.timelineYear}>YEAR 2: INTERMEDIATE</Text>
                <Text style={styles.timelineCardTitle}>Specialize & Build Projects</Text>
                <View style={styles.timelineTags}>
                  <View style={styles.tag}><Text style={styles.tagText}>Web Dev</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>DBMS</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>OS</Text></View>
                </View>
              </LinearGradient>
            </View>

            {/* Year 3 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineDotWrapper}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.timelineDot} />
                <View style={styles.timelineLine} />
              </View>
              <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={styles.timelineCard}>
                <Text style={styles.timelineYear}>YEAR 3: ADVANCED</Text>
                <Text style={styles.timelineCardTitle}>Internship & Open Source</Text>
                <View style={styles.timelineTags}>
                  <View style={styles.tag}><Text style={styles.tagText}>React/Node</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>Cloud</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>DevOps</Text></View>
                </View>
              </LinearGradient>
            </View>

            {/* Year 4: SPECIALIZATION (Active) */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineDotWrapper}>
                <LinearGradient colors={['#EA580C', '#9A3412']} style={[styles.timelineDot, styles.timelineDotActive]} />
              </View>
              <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={[styles.timelineCard, styles.timelineCardActive]}>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>CURRENT</Text>
                </View>
                <Text style={styles.timelineYear}>YEAR 4: SPECIALIZATION</Text>
                <Text style={styles.timelineCardTitle}>Mastery & Placement Prep</Text>
                <View style={styles.timelineTags}>
                  <View style={[styles.tag, styles.tagActive]}><Text style={[styles.tagText, styles.tagTextActive]}>System Design</Text></View>
                  <View style={[styles.tag, styles.tagActive]}><Text style={[styles.tagText, styles.tagTextActive]}>Advanced DSA</Text></View>
                  <View style={[styles.tag, styles.tagActive]}><Text style={[styles.tagText, styles.tagTextActive]}>Leadership</Text></View>
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
    backgroundColor: '#F3F4F6', // Premium light grey
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
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
    color: '#111827',
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
  avatarSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#EA580C',
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
    color: '#111827',
    letterSpacing: -1,
  },
  welcomeSub: {
    fontSize: 14,
    color: '#6B7280',
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
    borderColor: '#FFEDD5',
    alignItems: 'flex-start',
  },
  statValueOrange: {
    fontSize: 28,
    fontWeight: '900',
    color: '#9A3412',
    letterSpacing: -0.5,
  },
  statLabelOrange: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9A3412',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  statPillPurple: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    alignItems: 'flex-start',
  },
  statValuePurple: {
    fontSize: 28,
    fontWeight: '900',
    color: '#3730A3',
    letterSpacing: -0.5,
  },
  statLabelPurple: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3730A3',
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
    borderColor: '#A7F3D0',
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
    color: '#064E3B',
    lineHeight: 20,
    paddingRight: 10,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4B5563',
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
    color: '#111827',
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
    color: '#111827',
  },
  sectionSub: {
    fontSize: 14,
    color: '#6B7280',
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
    shadowColor: '#EA580C',
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
    color: '#3730A3',
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
    color: '#EA580C',
    letterSpacing: 2,
  },
  innovationTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
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
    borderColor: '#FFF7ED',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  resumeIcon: {
    backgroundColor: '#FFF7ED',
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
    color: '#111827',
  },
  cardDesc: {
    fontSize: 14,
    color: '#4B5563',
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
    color: '#111827',
    marginBottom: 4,
  },
  skillGapDesc: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#374151',
  },
  skillPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
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
    color: '#111827',
  },
  roadmapSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#111827',
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