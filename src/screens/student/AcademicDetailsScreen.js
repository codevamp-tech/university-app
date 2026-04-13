import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { STUDENT_USER } from '../../constants/data';

const AcademicDetailsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Academic Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* GPA Summary Card */}
        <LinearGradient
          colors={['#8B2FC9', '#B861FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gpaCard}
        >
          <View>
            <Text style={styles.gpaLabel}>CURRENT CGPA</Text>
            <Text style={styles.gpaValue}>3.85 / 4.0</Text>
          </View>
          <View style={styles.gpaBadge}>
            <Text style={styles.gpaBadgeText}>Top 5%</Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CURRENT PROGRAM</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Major</Text>
              <Text style={styles.value}>{STUDENT_USER.program || 'B.Sc. Computer Science'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>School</Text>
              <Text style={styles.value}>School of Engineering & Tech</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Semester</Text>
              <Text style={styles.value}>6th Semester</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Batch</Text>
              <Text style={styles.value}>2021-2025</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FACULTY ADVISOR</Text>
          <View style={styles.card}>
            <View style={styles.advisorRow}>
              <View style={styles.advisorAvatar}>
                <Ionicons name="person" size={24} color="#8B2FC9" />
              </View>
              <View style={styles.advisorInfo}>
                <Text style={styles.advisorName}>Dr. Sarah Johnson</Text>
                <Text style={styles.advisorDept}>Associate Professor, CS Dept.</Text>
              </View>
              <TouchableOpacity style={styles.contactIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#8B2FC9" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SEMESTER PROGRESS</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Credits Earned</Text>
              <Text style={styles.progressValue}>98 / 120</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '81%' }]} />
            </View>
            <Text style={styles.progressFooter}>22 credits remaining for graduation</Text>
          </View>
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
  gpaCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  gpaLabel: {
    color: '#E9D5FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  gpaValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  gpaBadge: {
    backgroundColor: '#FFFFFF30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gpaBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
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
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  advisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advisorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5EEFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  advisorInfo: {
    flex: 1,
  },
  advisorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  advisorDept: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5EEFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B2FC9',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B2FC9',
    borderRadius: 4,
  },
  progressFooter: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default AcademicDetailsScreen;
