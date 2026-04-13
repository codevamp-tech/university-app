import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAQItem = ({ question }) => (
  <TouchableOpacity style={styles.faqItem} activeOpacity={0.7}>
    <Text style={styles.faqQuestion}>{question}</Text>
    <Ionicons name="chevron-down" size={18} color="#D1D5DB" />
  </TouchableOpacity>
);

const HelpCenterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput 
            placeholder="Search for help..." 
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>POPULAR TOPICS</Text>
          <View style={styles.topicsGrid}>
            <TouchableOpacity style={styles.topicCard}>
              <View style={[styles.topicIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="book-outline" size={24} color="#16A34A" />
              </View>
              <Text style={styles.topicLabel}>Academics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topicCard}>
              <View style={[styles.topicIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="card-outline" size={24} color="#2563EB" />
              </View>
              <Text style={styles.topicLabel}>Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topicCard}>
              <View style={[styles.topicIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="business-outline" size={24} color="#EA580C" />
              </View>
              <Text style={styles.topicLabel}>Hostel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topicCard}>
              <View style={[styles.topicIcon, { backgroundColor: '#F5EEFC' }]}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#8B2FC9" />
              </View>
              <Text style={styles.topicLabel}>Others</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
          <View style={styles.card}>
            <FAQItem question="How do I view my digital ID?" />
            <View style={styles.divider} />
            <FAQItem question="Where can I find my exam results?" />
            <View style={styles.divider} />
            <FAQItem question="How to change my faculty advisor?" />
            <View style={styles.divider} />
            <FAQItem question="Process for hostel room migration?" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STILL NEED HELP?</Text>
          <TouchableOpacity style={styles.supportButton}>
            <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
            <Text style={styles.supportButtonText}>Chat with Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.supportButton, styles.supportButtonOutline]}>
            <Ionicons name="mail-outline" size={20} color="#8B2FC9" />
            <Text style={styles.supportButtonTextOutline}>Email Us</Text>
          </TouchableOpacity>
        </View>

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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  topicCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 20,
    alignItems: 'center',
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  topicLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  supportButton: {
    flexDirection: 'row',
    backgroundColor: '#8B2FC9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  supportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  supportButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8B2FC9',
  },
  supportButtonTextOutline: {
    color: '#8B2FC9',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HelpCenterScreen;
