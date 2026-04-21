import React from 'react';
import { useTheme } from '../../hooks/useTheme';

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { STUDENT_USER } from '../../constants/data';

const AcademicDetailsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();


  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Academic Details</Text>
        <View style={{ width: 40 }} />
      </View>



      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* GPA Summary Card */}
        <LinearGradient
          colors={isDark ? ['#6B21A8', '#7E22CE'] : ['#8B2FC9', '#B861FF']}
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
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CURRENT PROGRAM</Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Major</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>{STUDENT_USER.program || 'B.Sc. Computer Science'}</Text>

            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>School</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>School of Engineering & Tech</Text>

            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Semester</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>6th Semester</Text>

            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Batch</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>2021-2025</Text>

            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FACULTY ADVISOR</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

            <View style={styles.advisorRow}>
              <View style={[styles.advisorAvatar, { backgroundColor: isDark ? 'rgba(139, 47, 201, 0.2)' : '#F5EEFC' }]}>
                <Ionicons name="person" size={24} color={isDark ? '#A855F7' : '#8B2FC9'} />
              </View>

              <View style={styles.advisorInfo}>
                <Text style={[styles.advisorName, { color: colors.textPrimary }]}>Dr. Sarah Johnson</Text>
                <Text style={[styles.advisorDept, { color: colors.textSecondary }]}>Associate Professor, CS Dept.</Text>
              </View>

              <TouchableOpacity style={[styles.contactIcon, { backgroundColor: isDark ? 'rgba(139, 47, 201, 0.2)' : '#F5EEFC' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={isDark ? '#A855F7' : '#8B2FC9'} />
              </TouchableOpacity>

            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SEMESTER PROGRESS</Text>
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>

            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>Credits Earned</Text>
              <Text style={[styles.progressValue, { color: isDark ? '#A855F7' : '#8B2FC9' }]}>98 / 120</Text>
            </View>

            <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }]}>
              <View style={[styles.progressBarFill, { width: '81%', backgroundColor: isDark ? '#A855F7' : '#8B2FC9' }]} />
            </View>
            <Text style={[styles.progressFooter, { color: colors.textSecondary }]}>22 credits remaining for graduation</Text>

          </View>
        </View>


        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
  },

  value: {
    fontSize: 14,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    marginVertical: 4,
  },

  advisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
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
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  progressBarBg: {
    height: 8,
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
    textAlign: 'center',
  },

});

export default AcademicDetailsScreen;
