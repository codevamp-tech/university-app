import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const TeacherHelpCenterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const FAQS = [
    {
      q: 'How do I mark attendance for back-to-back lectures?',
      a: 'Go to Mark Attendance, select your course, and use the "Bulk Mark" feature for the sessions.'
    },
    {
      q: 'Where can I find the faculty academic calendar?',
      a: 'The academic calendar is available in the Department Overview section under the Academic tab.'
    },
    {
      q: 'How to upload grades for Semester exams?',
      a: 'Navigate to Course Management, select the exam session, and use the "Upload Grades" CSV tool.'
    }
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Support Banner */}
        <View style={styles.supportBanner}>
          <MaterialCommunityIcons name="face-agent" size={50} color={Colors.primary} />
          <Text style={styles.bannerTitle}>How can we help you?</Text>
          <Text style={styles.bannerSubtitle}>Search for faculty guides or contact support.</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput 
            placeholder="Search FAQs..." 
            style={styles.searchInput} 
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Contact Grid */}
        <View style={styles.contactGrid}>
          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Ionicons name="chatbubbles-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.contactLabel}>Live Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.contactLabel}>Email Us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Ionicons name="call-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.contactLabel}>Call IT</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <Text style={styles.faqQuestion}>{faq.q}</Text>
            <Text style={styles.faqAnswer}>{faq.a}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
  },
  supportBanner: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 15,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    marginBottom: 25,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  contactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  contactCard: {
    width: '30%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    elevation: 2,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 15,
  },
  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default TeacherHelpCenterScreen;
