import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { APP_CONFIG } from '../../../config/appConfig';

const { width } = Dimensions.get('window');

const CounsellorBookingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const counsellors = [
    {
      id: 1,
      name: 'Dr. Shalini Singh',
      specialty: 'Clinical Psychologist',
      experience: '12+ Years',
      price: '₹1000',
      duration: '30 Mins',
      rating: '4.9',
      reviews: 128,
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
      bio: 'Expert in student anxiety, stress management and academic pressure therapy.'
    },
    {
      id: 2,
      name: 'Mr. Rohan Khanna',
      specialty: 'Mental Health Coach',
      experience: '8 Years',
      price: '₹800',
      duration: '30 Mins',
      rating: '4.8',
      reviews: 95,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      bio: 'Specializes in digital detox, focus enhancement and habit formation.'
    },
    {
      id: 3,
      name: 'Dr. Amit Verma',
      specialty: 'Behavioral Expert',
      experience: '15 Years',
      price: '₹1200',
      duration: '30 Mins',
      rating: '5.0',
      reviews: 210,
      avatar: 'https://randomuser.me/api/portraits/men/44.jpg',
      bio: 'Helping students overcome severe exam fear and personality development.'
    },
    {
      id: 4,
      name: `${APP_CONFIG.UNIVERSITY_SHORT_NAME} AI (Asha)`,
      specialty: 'AI THERAPIST',
      experience: 'Real-time',
      price: '₹500',
      duration: '30 Mins',
      rating: '4.9',
      reviews: '5k+',
      avatar: 'https://images.unsplash.com/photo-1531746790731-6c087fdec0ed?q=80&w=1000&auto=format&fit=crop',
      bio: 'Available 24/7. High-fidelity voice support for cognitive behavioral therapy.',
      isAI: true
    },
    {
      id: 5,
      name: `${APP_CONFIG.UNIVERSITY_SHORT_NAME} AI (Vigyan)`,
      specialty: 'AI THERAPIST',
      experience: 'Real-time',
      price: '₹500',
      duration: '30 Mins',
      rating: '4.8',
      reviews: '3k+',
      avatar: 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?q=80&w=1000&auto=format&fit=crop',
      bio: 'Advanced logic-based coping mechanisms with real-time vocal therapy feedback.',
      isAI: true
    }
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Book a Therapist</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={[styles.introTitle, { color: colors.textPrimary }]}>Professional Guidance</Text>
          <Text style={[styles.introSub, { color: colors.textSecondary }]}>Connect with verified experts for personalized mental health support.</Text>
        </View>

        {counsellors.map((c) => (
          <TouchableOpacity key={c.id} style={[styles.cCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardTop}>
              <Image source={{ uri: c.avatar }} style={styles.avatar} />
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.textPrimary }]}>{c.name}</Text>
                  {c.isAI && (
                    <View style={styles.aiBadge}>
                      <MaterialCommunityIcons name="robot" size={10} color="#FFFFFF" />
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  )}
                  <View style={styles.ratingBadge}>
                    <MaterialIcons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{c.rating}</Text>
                  </View>
                </View>
                <Text style={[styles.specialty, { color: colors.primary }]}>{c.specialty}</Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{c.experience} exp</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{c.reviews} reviews</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>{c.bio}</Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.cardFooter}>
              <View>
                <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Session • {c.duration}</Text>
                <Text style={[styles.price, { color: colors.textPrimary }]}>{c.price}<Text style={styles.priceSub}> / session</Text></Text>
              </View>
              <TouchableOpacity style={styles.bookBtn}>
                <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.bookBtnGradient}>
                  <Text style={styles.bookBtnText}>Book Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoBoxText, { color: colors.textSecondary }]}>All sessions are 100% confidential and end-to-end encrypted.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scroll: { padding: 20 },
  introSection: { marginBottom: 24 },
  introTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  introSub: { fontSize: 15, lineHeight: 22 },
  cCard: { borderRadius: 28, padding: 20, borderWidth: 1, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  cardTop: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 20 },
  info: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '800' },
  aiBadge: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 8,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingText: { fontSize: 12, fontWeight: '900', color: '#B45309' },
  specialty: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaText: { fontSize: 12, fontWeight: '500' },
  metaDot: { fontSize: 12, color: '#9CA3AF' },
  bio: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  divider: { height: 1, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  price: { fontSize: 20, fontWeight: '900' },
  priceSub: { fontSize: 12, fontWeight: '600', opacity: 0.5 },
  bookBtn: { borderRadius: 14, overflow: 'hidden' },
  bookBtnGradient: { paddingHorizontal: 20, paddingVertical: 10 },
  bookBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 16, marginTop: 10 },
  infoBoxText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 18 },
});

export default CounsellorBookingScreen;
