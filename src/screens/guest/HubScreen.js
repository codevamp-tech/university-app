import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { APP_CONFIG } from '../../config/appConfig';

const { width } = Dimensions.get('window');

const HubScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [expandedQuery, setExpandedQuery] = useState(null);

  const quickLinks = [
    { id: 1, title: 'Fee Structure', icon: 'cash-multiple', gradient: ['#EA580C', '#9A3412'], screen: 'FeeStructure' },
    { id: 2, title: 'Placement Record', icon: 'trending-up', gradient: ['#4338CA', '#312E81'], screen: 'PlacementRecord' },
    { id: 3, title: 'Hostel & Amenities', icon: 'home-city', gradient: ['#16A34A', '#0A6C34'], screen: 'HostelAmenities' },
    { id: 4, title: 'Course Eligibility', icon: 'clipboard-check', gradient: ['#0891B2', '#065F73'], screen: 'CourseEligibility' },
  ];

  const mentors = [
    {
      id: 1,
      name: 'Mr. Khanna',
      role: 'HEAD OF ADMISSIONS',
      quote: '"Guiding students toward their dream career paths for 15+ years."',
      buttonText: 'Book Video Call',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      id: 2,
      name: 'Dr. Singh',
      role: 'DEAN, ENGINEERING',
      quote: '"Focusing on the fusion of innovation and core engineering principles."',
      buttonText: 'Consult Academics',
      image: 'https://randomuser.me/api/portraits/men/44.jpg',
    },
    {
      id: 3,
      name: 'Ms. Verma',
      role: 'SCHOLARSHIP ADVISOR',
      quote: '"Empowering talent through financial support and merit programs."',
      buttonText: 'Discuss Funding',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
  ];

  const queries = [
    { id: 1, question: 'When is the last date to apply for 2026 admissions?' },
    { id: 2, question: `Does ${APP_CONFIG.UNIVERSITY_SHORT_NAME} offer direct admission for meritorious students?` },
    { id: 3, question: 'What are the amenities available in the girl\'s hostel?' },
    { id: 4, question: 'Is there any lateral entry option for Diploma holders?' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#EA580C', '#9A3412']}
            style={styles.logoCircle}
          >
            <MaterialCommunityIcons name="school" size={20} color="white" />
          </LinearGradient>
          <Text style={styles.headerTitle}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Feather name="search" size={22} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Feather name="user" size={22} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hub Header */}
        <View style={styles.hubHeaderSection}>
          <LinearGradient
            colors={['#EEF2FF', '#E0E7FF']}
            style={styles.admissionsPill}
          >
            <Text style={styles.admissionsPillText}>🎓 ADMISSIONS 2026-27</Text>
          </LinearGradient>
          <Text style={styles.heroText}>Your Future</Text>
          <Text style={[styles.heroText, { color: '#EA580C' }]}>Starts in the {APP_CONFIG.UNIVERSITY_SHORT_NAME}.</Text>
          <Text style={styles.heroDescription}>
            Join a legacy of excellence at {APP_CONFIG.UNIVERSITY_SHORT_NAME}. Explore our diverse programs and get real-time guidance from our intelligent ecosystem.
          </Text>
        </View>

        {/* Quick Links Grid */}
        <View style={styles.linksGrid}>
          {quickLinks.map((link) => (
            <TouchableOpacity
              key={link.id}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(link.screen)}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F9FAFB']}
                style={styles.linkCard}
              >
                <LinearGradient
                  colors={link.gradient}
                  style={styles.linkIconContainer}
                >
                  <MaterialCommunityIcons name={link.icon} size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#9CA3AF" style={{ marginTop: 4 }} />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Section */}
        <LinearGradient
          colors={['#1E1B4B', '#312E81']}
          style={styles.aiSection}
        >
          <View style={styles.aiHeader}>
            <View style={styles.aiHeaderLeft}>
              <LinearGradient
                colors={['#EA580C', '#9A3412']}
                style={styles.aiIconWrapper}
              >
                <MaterialCommunityIcons name="robot" size={20} color="white" />
              </LinearGradient>
              <View>
                <Text style={styles.aiTitle}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} AI</Text>
                <View style={styles.activeRow}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeText}>ACTIVE ASSISTANT</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.chatContainer}>
            <View style={styles.botMessageRow}>
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.botAvatarWrapper}
              >
                <MaterialCommunityIcons name="hexagon-outline" size={20} color="#92400E" />
              </LinearGradient>
              <View style={styles.botBubble}>
                <Text style={styles.chatText}>
                  Namaste! I'm {APP_CONFIG.UNIVERSITY_SHORT_NAME}. How can I help you navigate your admission journey today?
                </Text>
              </View>
            </View>

            <View style={styles.userMessageRow}>
              <LinearGradient
                colors={['#EA580C', '#9A3412']}
                style={styles.userBubble}
              >
                <Text style={[styles.chatText, { color: 'white' }]}>
                  What are the B.Tech scholarships for 2026?
                </Text>
              </LinearGradient>
              <View style={styles.userAvatarWrapper}>
                <Feather name="user" size={14} color="white" />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Type your query..."
                  style={styles.aiInput}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity>
                  <MaterialCommunityIcons name="send" size={20} color="#EA580C" />
                </TouchableOpacity>
              </View>
              <LinearGradient
                colors={['#EA580C', '#9A3412']}
                style={styles.micButton}
              >
                <MaterialCommunityIcons name="microphone" size={20} color="white" />
              </LinearGradient>
            </View>
          </View>
        </LinearGradient>

        {/* Mentors Section */}
        <View style={styles.mentorsHeader}>
          <Text style={styles.sectionTitle}>Meet Your Mentors</Text>
          <Text style={styles.sectionDescription}>
            Connect with our dedicated experts for personalized career guidance.
          </Text>
          <TouchableOpacity style={styles.viewExpertsRow}>
            <Text style={styles.viewExpertsText}>View All Experts</Text>
            <Feather name="arrow-right" size={16} color="#EA580C" />
          </TouchableOpacity>
        </View>

        {mentors.map((mentor) => (
          <LinearGradient
            key={mentor.id}
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.mentorCard}
          >
            <View style={styles.mentorImageContainer}>
              <Image source={{ uri: mentor.image }} style={styles.mentorImage} />
              <View style={styles.mentorActiveDot} />
            </View>
            <Text style={styles.mentorName}>{mentor.name}</Text>
            <Text style={styles.mentorRole}>{mentor.role}</Text>

            <View style={styles.divider} />

            <Text style={styles.mentorQuote}>{mentor.quote}</Text>

            <LinearGradient
              colors={['#FFF7ED', '#FFEDD5']}
              style={styles.mentorButton}
            >
              <Text style={styles.mentorButtonText}>{mentor.buttonText}</Text>
            </LinearGradient>
          </LinearGradient>
        ))}

        {/* Common Queries Section */}
        <View style={styles.queriesSection}>
          <Text style={styles.queriesTitle}>Common Queries</Text>
          <Text style={styles.queriesDescription}>
            Everything you need to know about joining {APP_CONFIG.UNIVERSITY_NAME}.
          </Text>

          {queries.map((query) => (
            <LinearGradient
              key={query.id}
              colors={['#FFFFFF', '#F9FAFB']}
              style={styles.queryItem}
            >
              <TouchableOpacity
                style={styles.queryContent}
                onPress={() => setExpandedQuery(expandedQuery === query.id ? null : query.id)}
              >
                <Text style={styles.questionText}>{query.question}</Text>
                <Feather
                  name={expandedQuery === query.id ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#EA580C"
                />
              </TouchableOpacity>
              {expandedQuery === query.id && (
                <View style={styles.queryAnswer}>
                  <Text style={styles.answerText}>
                    Our admission team will contact you shortly with detailed information about this query.
                  </Text>
                </View>
              )}
            </LinearGradient>
          ))}
        </View>

        {/* Support Section */}
        <LinearGradient
          colors={['#FFF7ED', '#FFEDD5']}
          style={styles.supportSection}
        >
          <LinearGradient
            colors={['#EA580C', '#9A3412']}
            style={styles.supportIconWrapper}
          >
            <Feather name="help-circle" size={28} color="white" />
          </LinearGradient>
          <Text style={styles.supportTitle}>Still have questions?</Text>
          <Text style={styles.supportDescription}>
            Our 24/7 support team is here to assist you with any custom queries.
          </Text>
          <LinearGradient
            colors={['#EA580C', '#9A3412']}
            style={styles.contactButton}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </LinearGradient>
        </LinearGradient>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#EA580C',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    padding: 20,
  },
  hubHeaderSection: {
    marginBottom: 24,
  },
  admissionsPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  admissionsPillText: {
    color: '#4338CA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 42,
    letterSpacing: -1,
  },
  heroDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginTop: 16,
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  linkCard: {
    width: (width - 52) / 2,
    borderRadius: 24,
    padding: 20,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  linkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  aiSection: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  activeText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chatContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 4,
    borderRadius: 24,
  },
  botMessageRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  botAvatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  botBubble: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 20,
    borderTopLeftRadius: 4,
  },
  userMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  userAvatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  userBubble: {
    padding: 14,
    borderRadius: 20,
    borderTopRightRadius: 4,
    maxWidth: '80%',
  },
  chatText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
    paddingHorizontal: 18,
    height: 48,
    marginRight: 12,
  },
  aiInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mentorsHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  viewExpertsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  viewExpertsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
  mentorCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  mentorImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  mentorImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#EA580C',
  },
  mentorActiveDot: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: 'white',
  },
  mentorName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  mentorRole: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  mentorQuote: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  mentorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  mentorButtonText: {
    color: '#EA580C',
    fontWeight: '800',
    fontSize: 14,
  },
  queriesSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  queriesTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  queriesDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  queryItem: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  queryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },
  queryAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  answerText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  supportSection: {
    padding: 32,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  supportIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  supportTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  supportDescription: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  contactButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  contactButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },
});

export default HubScreen;