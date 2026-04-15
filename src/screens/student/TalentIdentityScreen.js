import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const TalentIdentityScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="school" size={26} color="#F97316" />
          <Text style={styles.headerLogo}>Invertis University</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialIcons name="shopping-bag" size={22} color="#6B7280" />
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
            style={styles.avatarSmall}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Header Image */}
        <View style={styles.profileHeroSection}>
          <View style={styles.profileHeroCard}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
              style={styles.heroImg}
            />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.heroOverlay}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View>
                  <View style={styles.eliteBadge}>
                    <Text style={styles.eliteBadgeText}>PULSE ELITE</Text>
                  </View>
                  <Text style={styles.heroName}>Aryan Sharma</Text>
                </View>
                {/* Editable Profile Picture Icon */}
                <TouchableOpacity style={styles.editPicBtn}>
                  <Ionicons name="camera" size={20} color="#1F2937" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Major & Batch Info */}
        <View style={styles.basicInfo}>
          <Text style={styles.majorText}>B.Tech Computer Science Engineering</Text>
          <Text style={styles.batchSubText}>Batch of 2025 • Invertis University Bareilly</Text>

          {/* LinkedIn-style Connections */}
          <View style={styles.networkStats}>
            <Text style={styles.networkText}><Text style={styles.networkBold}>1.2K</Text> Followers</Text>
            <Text style={styles.networkDivider}>•</Text>
            <Text style={styles.networkText}><Text style={styles.networkBold}>500+</Text> Connections</Text>
          </View>

          <View style={styles.capsuleRow}>
            <View style={styles.capsule}>
              <Text style={styles.capsuleLabel}>CURRENT YEAR</Text>
              <Text style={styles.capsuleValue}>3rd Year</Text>
            </View>
            <View style={styles.capsule}>
              <Text style={styles.capsuleLabel}>STUDENT ID</Text>
              <Text style={styles.capsuleValue}>INV-2022-094</Text>
            </View>
            <View style={styles.capsule}>
              <Text style={styles.capsuleLabel}>VIBE CHECK</Text>
              <Text style={[styles.capsuleValue, { color: '#006666' }]}>Innovator</Text>
            </View>
          </View>
        </View>

        {/* Editable About / Bio Section */}
        <View style={styles.aboutSection}>
          <View style={styles.aboutHeader}>
            <Text style={styles.aboutTitle}>About</Text>
            <TouchableOpacity style={styles.editBioBtn}>
              <MaterialIcons name="edit" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.aboutText}>
            Passionate software engineering student deeply interested in Full Stack Development and AI.
            Leading the SkyDrone project in the Venture Lab and actively organizing the Invertis Coding Club Hackathons.
            Always looking to connect with like-minded innovators!
          </Text>
        </View>

        {/* AI Pulse Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Academic Performance</Text>
            <MaterialIcons name="trending-up" size={20} color="#4953ac" />
          </View>
          <View style={styles.acadGrid}>
            <View style={styles.acadItem}>
              <Text style={styles.acadValue}>8.9 <Text style={styles.acadMax}>/ 10.0</Text></Text>
              <Text style={styles.acadLabel}>CUMULATIVE GPA</Text>
              <View style={styles.pBar}><View style={[styles.pFill, { width: '89%', backgroundColor: '#4953ac' }]} /></View>
            </View>
            <View style={styles.acadItem}>
              <Text style={[styles.acadValue, { color: '#8b4b00' }]}>85%</Text>
              <Text style={styles.acadLabel}>ATTENDANCE</Text>
              <View style={styles.pBar}><View style={[styles.pFill, { width: '85%', backgroundColor: '#8b4b00' }]} /></View>
            </View>
          </View>
        </View>

        {/* Pulse Check (Mood) */}
        <View style={[styles.sectionCard, { backgroundColor: '#E0F2F1' }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.cardTitle}>Pulse Check</Text>
              <View style={styles.tealDot} />
            </View>
          </View>
          <Text style={styles.pulseSubText}>Your well-being is our priority.</Text>
          <View style={styles.wellbeingContent}>
            <MaterialIcons name="sentiment-very-satisfied" size={48} color="#004D40" />
            <Text style={styles.wellbeingState}>Current State: Focused</Text>
          </View>
          <TouchableOpacity style={styles.updateMoodBtn}>
            <Text style={styles.updateMoodText}>UPDATE MOOD</Text>
          </TouchableOpacity>
        </View>

        {/* Social Impact Credits */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.cardTitle}>Social Impact Credits</Text>
              <Text style={styles.cardSubSub}>Community Service & Volunteering</Text>
            </View>
            <View style={styles.scoreBadge}><Text style={styles.scoreText}>420 pts</Text></View>
          </View>

          <View style={styles.proofList}>
            <View style={styles.proofItem}>
              <View style={styles.proofLeadIcon}><MaterialIcons name="volunteer-activism" size={18} color="#4953ac" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.proofName}>Bareilly Green Drive</Text>
                <Text style={styles.proofMeta}>12 Hours • NGO Partner</Text>
              </View>
              <TouchableOpacity><Text style={styles.viewProofText}>VIEW PROOF</Text></TouchableOpacity>
            </View>

            <View style={styles.proofItem}>
              <View style={styles.proofLeadIcon}><MaterialIcons name="groups" size={18} color="#4953ac" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.proofName}>Peer Mentorship</Text>
                <Text style={styles.proofMeta}>Spring Semester '24</Text>
              </View>
              <TouchableOpacity><Text style={styles.viewProofText}>VIEW PROOF</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Venture Lab (Black Card) */}
        <View style={styles.ventureLabCard}>
          <LinearGradient colors={['#000000', '#1A1A1A']} style={styles.ventureInner}>
            <View style={styles.ventureHeader}>
              <Text style={styles.ventureTopTitle}>Venture Lab</Text>
              <View style={styles.activeProjectBadge}>
                <Text style={styles.activeProjectText}>ACTIVE PROJECT</Text>
              </View>
            </View>
            <Text style={styles.ventureTitle}>SkyDrone Bareilly</Text>
            <Text style={styles.ventureDesc}>
              Leading a team of 5 to develop autonomous delivery drones for last-mile pharmaceutical logistics in rural Uttar Pradesh.
            </Text>
            <View style={styles.ventureActions}>
              <TouchableOpacity style={styles.vActionBtn}>
                <Ionicons name="link-outline" size={14} color="#FFFFFF" />
                <Text style={styles.vActionText}>Project Proofs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.vActionBtn}>
                <MaterialCommunityIcons name="rocket-launch" size={14} color="#FFFFFF" />
                <Text style={styles.vActionText}>Startup ID</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Certificates */}
        <View style={styles.certWrapper}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Earned Digital Certificates</Text>
            <TouchableOpacity style={styles.viewAllRow}>
              <Text style={styles.viewAllCertText}>VIEW ALL</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#8B4B00" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.certScroll}>
            <View style={styles.certCard}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeMp8KExPP-mtUke2kOSExXY2ZF0-KPSr4_BWISAEV96WQMjZ8c-gIN8N3MDVuNL3W9P2_QTb65_Gb1bjdLEqfql5syAODPJ8LX2PiNu4gT15Aa5_NiE57znpo1K5waCxyCC5oGtICTefR_R_YtqVaBM8u_bJp8nBmneBlPCkLW-FDAJEFU_VJrSE7KazdaU4cW2QJ7QRo-YUED9COkt-K6YA3QZrsOTsdzy4dr4_Pdh4gj6aVDhwuB7x3XKOzPxkBc24eqBNAMZnf' }}
                style={styles.certImg}
              />
              <Text style={styles.certName}>Cloud Foundations</Text>
              <Text style={styles.certIssuer}>Issued by AWS Academy • June 2024</Text>
            </View>
            <View style={styles.certCard}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFxNwf4tljvU2VUw0hoE1MaYbT7rBYyYSN8DZsmFulMlYTRxq9XVsza7Ng0S5c_JtrU4OCXX7gY6VAdV87Dv6_UqlY9sBl8Jm52Z3ZUo1YYjTmuQI1QcuyIlny77qhXJvJA7d5zsC1LOFO6kjBJh9cFwYrupFj-gtmeFEFxBMExwb6ClkG16Q9VR1PMBUuNrExWGoLA5l9Bt_TAu2QHprIfZzE9ogRIW4ekHFeA4-QW7rhISgJoqcnmcOeZ0Vn891YbiFqPciNPBct' }}
                style={styles.certImg}
              />
              <Text style={styles.certName}>Full Stack Dev</Text>
              <Text style={styles.certIssuer}>Invertis Venture Lab • Mar 2024</Text>
            </View>
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
    backgroundColor: '#F5F6F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#EA580C',
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 8,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fe9832',
  },
  scroll: {
    paddingBottom: 20,
  },
  profileHeroSection: {
    padding: 16,
  },
  profileHeroCard: {
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    backgroundColor: '#000',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
    padding: 24,
  },
  eliteBadge: {
    backgroundColor: '#8b4b00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'baseline',
    marginBottom: 8,
  },
  eliteBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  basicInfo: {
    paddingHorizontal: 16,
  },
  majorText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4953ac',
  },
  batchSubText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  capsuleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  capsule: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
  },
  capsuleLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  capsuleValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 2,
  },
  aiPulseWrap: {
    padding: 16,
    marginTop: 8,
  },
  aiPulseInner: {
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  orangeBorder: {
    position: 'absolute',
    inset: 0,
    borderWidth: 1.5,
    borderColor: '#fe9832',
    borderRadius: 24,
  },
  aiSparkleBox: {
    width: 64,
    height: 64,
    backgroundColor: '#fe983220',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiPulseTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
  },
  aiPulseText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, paddingLeft: 20,
    paddingRight: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',

  },
  cardSubSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  acadGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  acadItem: {
    flex: 1,
  },
  acadValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4953ac',
  },
  acadMax: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  acadLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginTop: 4,
  },
  pBar: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  pFill: {
    height: '100%',
    borderRadius: 2,
  },
  tealDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00695C',
  },
  pulseSubText: {
    fontSize: 13,
    color: '#4B5563',
  },
  wellbeingContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  wellbeingState: {
    fontSize: 14,
    fontWeight: '800',
    color: '#004D40',
    marginTop: 10,
  },
  updateMoodBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  updateMoodText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#004D40',
    letterSpacing: 1,
  },
  scoreBadge: {
    backgroundColor: '#cbceff60',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4953ac',
  },
  proofList: {
    gap: 12,
  },
  proofItem: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proofLeadIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  proofMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  viewProofText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4953ac',
  },
  ventureLabCard: {
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  ventureInner: {
    padding: 24,
  },
  ventureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ventureTopTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeProjectBadge: {
    backgroundColor: 'rgba(254, 152, 50, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(254, 152, 50, 0.3)',
  },
  activeProjectText: {
    color: '#fe9832',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ventureTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fe9832',
    marginTop: 16,
  },
  ventureDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
    marginTop: 10,
  },
  ventureActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  vActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
  },
  vActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  certWrapper: {
    marginTop: 20,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllCertText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8b4b00',
  },
  certScroll: {
    paddingLeft: 16,
    paddingRight: 16,
    gap: 16,
  },
  certCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  certImg: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  certName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  certIssuer: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  editPicBtn: {
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  networkStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  networkText: {
    fontSize: 14,
    color: '#3474ec',
  },
  networkBold: {
    fontWeight: '800',
  },
  networkDivider: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  aboutSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  aboutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  editBioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
});

export default TalentIdentityScreen;
