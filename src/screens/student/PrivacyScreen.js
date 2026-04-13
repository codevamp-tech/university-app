import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PrivacyPolicySection = ({ title, content }) => (
  <View style={styles.policySection}>
    <Text style={styles.policyTitle}>{title}</Text>
    <Text style={styles.policyContent}>{content}</Text>
  </View>
);

const PrivacyScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={32} color="#8B2FC9" />
          <Text style={styles.infoCardTitle}>Your Privacy Matters</Text>
          <Text style={styles.infoCardDesc}>
            At Invertis University, we prioritize the protection of your personal and academic data.
            Learn how we handle your information.
          </Text>
        </View>

        <PrivacyPolicySection 
          title="1. Information We Collect"
          content="We collect personal identifiers such as name, student ID, email address, and academic records to provide university services through this app."
        />

        <PrivacyPolicySection 
          title="2. How We Use Information"
          content="Your data is used for academic management, attendance tracking, result publication, and university communications. We do not sell your data to third parties."
        />

        <PrivacyPolicySection 
          title="3. Data Security"
          content="We employ industry-standard encryption and security protocols to ensure your data remains confidential and protected against unauthorized access."
        />

        <PrivacyPolicySection 
          title="4. Your Rights"
          content="You have the right to access, correct, or request deletion of your personal data. Some data must be retained for academic and legal requirements."
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA SETTINGS</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingLabel}>Manage Permissions</Text>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingLabel}>Download My Data</Text>
              <Ionicons name="download-outline" size={20} color="#8B2FC9" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerText}>Last Updated: January 2024</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  scroll: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#F5EEFC',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  infoCardDesc: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  policySection: {
    marginBottom: 24,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  policyContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  section: {
    marginTop: 8,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default PrivacyScreen;
