import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const TeacherPrivacyScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const SECTIONS = [
    {
      title: 'Data Collection',
      content: 'We collect faculty profile data, lecture schedules, and attendance records to facilitate university operations. This data is stored securely on university-managed servers.'
    },
    {
      title: 'Student Data Access',
      content: 'As a faculty member, you have access to student academic records. This access is strictly for educational purposes and must not be shared with unauthorized third parties.'
    },
    {
      title: 'Security Measures',
      content: 'The app uses end-to-end encryption for all data transmissions. Faculty IDs are verified through the university\'s central authentication system.'
    },
    {
      title: 'Your Rights',
      content: 'You can request access to your personal data or ask for corrections by contacting the IT administration department.'
    }
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.shieldIcon}>
            <MaterialCommunityIcons name="shield-check" size={60} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroSubtitle}>Last updated: April 2026</Text>
        </View>

        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.privacyCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.contactSupport}>
          <Text style={styles.contactText}>Have questions? Contact Admin</Text>
        </TouchableOpacity>

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
  heroSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  shieldIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 5,
  },
  privacyCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  contactSupport: {
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
  },
  contactText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default TeacherPrivacyScreen;
