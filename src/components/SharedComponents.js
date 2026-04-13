import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import ProgressBar from './ProgressBar';
import { Colors } from '../constants/colors';

const StatCard = ({ icon, label, value, color = Colors.primary, onPress }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.85}>
    <Card style={styles.statCardInner} padding={14}>
      <View style={[styles.iconCircle, { backgroundColor: Colors.primaryLight }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Card>
  </TouchableOpacity>
);

const CourseCard = ({ code, name, lecture, progress, color = Colors.primary, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.courseCard}>
    <View style={[styles.codeBox, { backgroundColor: color + '20' }]}>
      <Text style={[styles.codeText, { color }]}>{code}</Text>
    </View>
    <View style={styles.courseInfo}>
      <Text style={styles.courseName}>{name}</Text>
      <Text style={styles.courseLecture}>{lecture}</Text>
      <View style={styles.progressRow}>
        <ProgressBar progress={progress} color={color} height={5} style={{ flex: 1, marginRight: 8 }} />
        <Text style={[styles.progressPct, { color }]}>{progress}%</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const NotificationBadge = ({ children, count }) => (
  <View>
    {children}
    {count > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  statCard: {
    width: '48%',
    marginBottom: 12,
  },
  statCardInner: {
    borderRadius: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  codeBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  courseLecture: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});

export { StatCard, CourseCard, NotificationBadge };
