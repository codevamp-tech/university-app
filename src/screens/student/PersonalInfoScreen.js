import React from 'react';
import { useTheme } from '../../hooks/useTheme';

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STUDENT_USER } from '../../constants/data';

const InfoItem = ({ label, value, icon }) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(139, 47, 201, 0.2)' : '#F5EEFC' }]}>
        <Ionicons name={icon} size={20} color={isDark ? '#A855F7' : '#8B2FC9'} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
};


const PersonalInfoScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();


  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Personal Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BASIC INFORMATION</Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <InfoItem label="Full Name" value={STUDENT_USER.name || 'Alex Morgan'} icon="person-outline" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoItem label="Student ID" value={STUDENT_USER.id || 'STU-2024-001'} icon="id-card-outline" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoItem label="Date of Birth" value="May 15, 2002" icon="calendar-outline" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <InfoItem label="Gender" value="Male" icon="male-female-outline" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CONTACT DETAILS</Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <InfoItem label="Email Address" value="alex.morgan@invertis.edu" icon="mail-outline" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoItem label="Phone Number" value="+91 98765 43210" icon="call-outline" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <InfoItem label="Address" value="Hostel Block A, Room 302, Invertis University" icon="location-outline" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>EMERGENCY CONTACT</Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <InfoItem label="Guardian Name" value="Robert Morgan" icon="people-outline" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoItem label="Relation" value="Father" icon="link-outline" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <InfoItem label="Emergency Phone" value="+91 91234 56789" icon="alert-circle-outline" />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  scroll: {
    padding: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
  },

  value: {
    fontSize: 15,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    marginLeft: 54,
  },

});

export default PersonalInfoScreen;
