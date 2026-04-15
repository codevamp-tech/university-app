import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Track Attendance',
    titleAccent: 'Easily.',
    description: 'Manage your classroom presence with a single tap. Stay focused on your learning while we handle the rest.',
    icon: 'checkbox-outline',
    iconBg: '#EA580C',
    badge: { label: 'STATUS', value: 'Present', icon: 'checkmark-circle' },
  },
  {
    id: '2',
    title: 'Manage Fees &',
    titleAccent: 'Results',
    description: 'Keep track of your academic standing and financial commitments in one streamlined interface.',
    icon: 'card-outline',
    iconBg: '#EA580C',
    badge: { label: 'FINAL GPA', value: '3.92', icon: 'stats-chart' },
  },
  {
    id: '3',
    title: 'Stay Updated with',
    titleAccent: 'Notifications',
    description: 'Get real-time updates on your grades, schedule changes, and important campus announcements.',
    icon: 'notifications-outline',
    iconBg: '#EA580C',
    badge: null,
    lastSlide: true,
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const flatRef = useRef(null);

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const skip = () => navigation.replace('Login');

  const slide = slides[currentIndex];

  return (
    <LinearGradient
      colors={['#ffedd5', '#fff7ed', '#f9fafb', '#f9fafb', '#f9fafb']}
      locations={[0, 0.3, 0.55, 0.8, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Illustration Area */}
      <View style={styles.illustrationWrap}>
        <View style={styles.illustrationCard}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name={slide.icon} size={64} color="#EA580C" />
            </View>
          </View>

          {slide.badge && (
            <View style={styles.badge}>
              <View style={styles.badgeIcon}>
                <Ionicons name={slide.badge.icon} size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.badgeLabel}>{slide.badge.label}</Text>
                <Text style={styles.badgeValue}>{slide.badge.value}</Text>
              </View>
            </View>
          )}

          {slide.lastSlide && (
            <View style={styles.notifStack}>
              <View style={styles.notifItem}>
                <View style={styles.notifIcon}>
                  <Ionicons name="notifications-outline" size={20} color="#EA580C" />
                </View>
                <View style={styles.notifLines}>
                  <View style={styles.notifLine} />
                  <View style={[styles.notifLine, { width: '70%' }]} />
                </View>
              </View>
              <View style={[styles.notifItem, styles.notifItemActive]}>
                <View style={[styles.notifIcon, styles.notifIconActive]}>
                  <Ionicons name="school-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.notifLines}>
                  <View style={[styles.notifLine, styles.notifLineLight]} />
                  <View style={[styles.notifLine, { width: '70%' }, styles.notifLineLight]} />
                </View>
              </View>
              <View style={styles.notifItem}>
                <View style={styles.notifIcon}>
                  <Ionicons name="calendar-outline" size={20} color="#EA580C" />
                </View>
                <View style={styles.notifLines}>
                  <View style={styles.notifLine} />
                  <View style={[styles.notifLine, { width: '70%' }]} />
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>
          {slide.title}{'\n'}
          <Text style={styles.titleAccent}>{slide.titleAccent}</Text>
        </Text>
        <Text style={styles.description}>{slide.description}</Text>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        {/* Buttons */}
        {slide.lastSlide ? (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
              <Text style={styles.primaryBtnText}>Enable Notifications</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={skip}>
              <Text style={styles.maybeLaterText}>Maybe Later</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
            <Text style={styles.primaryBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  illustrationWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  illustrationCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    minHeight: 260,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 20,
    backgroundColor: '#EA580C20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
    letterSpacing: 0.5,
  },
  badgeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  notifStack: {
    width: '100%',
    gap: 10,
    marginTop: 16,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  notifItemActive: {
    backgroundColor: '#EA580C',
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EA580C20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconActive: {
    backgroundColor: '#FFFFFF30',
  },
  notifLines: {
    flex: 1,
  },
  notifLine: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  notifLineLight: {
    backgroundColor: '#FFFFFF80',
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 14,
  },
  titleAccent: {
    color: '#EA580C',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    width: 28,
    backgroundColor: '#EA580C',
  },
  primaryBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  maybeLaterText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default OnboardingScreen;