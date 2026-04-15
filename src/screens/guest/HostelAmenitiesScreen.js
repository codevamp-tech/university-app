import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HostelAmenitiesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeType, setActiveType] = useState('Boys');

  const types = ['Boys', 'Girls'];

  const hostels = {
    Boys: [
      {
        name: 'Shivalik Boys Hostel',
        rooms: '200 Rooms',
        type: 'Single & Double Sharing',
        fee: '₹60,000/year',
        image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=400',
        facilities: ['24/7 Security', 'WiFi', 'Gym', 'Common Room', 'Laundry'],
        color: ['#4338CA', '#312E81'],
      },
      {
        name: 'Himalaya Boys Hostel',
        rooms: '150 Rooms',
        type: 'Triple Sharing',
        fee: '₹45,000/year',
        image: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?q=80&w=400',
        facilities: ['CCTV Security', 'WiFi', 'Indoor Sports', 'Study Hall'],
        color: ['#0891B2', '#065F73'],
      },
    ],
    Girls: [
      {
        name: 'Sahyadri Girls Hostel',
        rooms: '180 Rooms',
        type: 'Single & Double Sharing',
        fee: '₹65,000/year',
        image: 'https://images.unsplash.com/photo-1543071220-6ee5bf71a54e?q=80&w=400',
        facilities: ['24/7 Lady Warden', 'CCTV', 'WiFi', 'Beauty Parlour', 'Common Room'],
        color: ['#DB2777', '#9D174D'],
      },
      {
        name: 'Aravalli Girls Hostel',
        rooms: '120 Rooms',
        type: 'Triple Sharing',
        fee: '₹48,000/year',
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=400',
        facilities: ['Lady Security', 'WiFi', 'Garden Area', 'Study Room'],
        color: ['#7C3AED', '#5B21B6'],
      },
    ],
  };

  const messFees = [
    { plan: 'Veg Mess (Monthly)', fee: '₹3,200', note: 'Breakfast + Lunch + Dinner' },
    { plan: 'Non-Veg Mess (Monthly)', fee: '₹3,800', note: 'Includes 3 meals/day' },
    { plan: 'Canteen (Daily)', fee: '₹150–250', note: 'À la carte available' },
  ];

  const campusAmenities = [
    { icon: 'dumbbell', label: 'Gymnasium', detail: 'Modern equipment • 6 AM – 9 PM', color: '#EA580C', gradient: ['#FFF7ED', '#FFEDD5'] },
    { icon: 'book-open-variant', label: 'Central Library', detail: '50,000+ books • 24/7 E-access', color: '#4338CA', gradient: ['#EEF2FF', '#E0E7FF'] },
    { icon: 'soccer', label: 'Sports Complex', detail: 'Cricket, Football, Basketball, TT', color: '#16A34A', gradient: ['#ECFDF5', '#DCFCE7'] },
    { icon: 'hospital-building', label: 'Medical Centre', detail: 'On-campus doctor • Ambulance', color: '#EF4444', gradient: ['#FEF2F2', '#FEE2E2'] },
    { icon: 'wifi', label: 'Campus Wi-Fi', detail: '1 Gbps campus-wide network', color: '#0891B2', gradient: ['#F0FDFF', '#E0F7FF'] },
    { icon: 'bank', label: 'Bank & ATM', detail: 'SBI branch inside campus', color: '#B45309', gradient: ['#FFFBEB', '#FEF3C7'] },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#16A34A', '#0A6C34']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hostel & Amenities</Text>
          <Text style={styles.headerSub}>Campus Living Experience</Text>
        </View>
        <MaterialCommunityIcons name="home-city" size={22} color="rgba(255,255,255,0.7)" />
      </LinearGradient>

      {/* Type Switcher */}
      <View style={styles.typeRow}>
        {types.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, activeType === t && styles.typeBtnActive]}
            onPress={() => setActiveType(t)}
          >
            <MaterialCommunityIcons
              name={t === 'Boys' ? 'human-male' : 'human-female'}
              size={18}
              color={activeType === t ? '#FFFFFF' : '#6B7280'}
            />
            <Text style={[styles.typeText, activeType === t && styles.typeTextActive]}>{t} Hostel</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hostel Cards */}
        {hostels[activeType].map((hostel, i) => (
          <View key={i} style={styles.hostelCard}>
            <Image source={{ uri: hostel.image }} style={styles.hostelImage} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.hostelOverlay}>
              <LinearGradient colors={hostel.color} style={styles.hostelFeeBadge}>
                <Text style={styles.hostelFeeText}>{hostel.fee}</Text>
              </LinearGradient>
            </LinearGradient>
            <View style={styles.hostelInfo}>
              <Text style={styles.hostelName}>{hostel.name}</Text>
              <View style={styles.hostelMeta}>
                <View style={styles.metaChip}>
                  <MaterialIcons name="hotel" size={12} color="#6B7280" />
                  <Text style={styles.metaChipText}>{hostel.rooms}</Text>
                </View>
                <View style={styles.metaChip}>
                  <MaterialIcons name="people" size={12} color="#6B7280" />
                  <Text style={styles.metaChipText}>{hostel.type}</Text>
                </View>
              </View>
              <View style={styles.facilitiesRow}>
                {hostel.facilities.map((f, fi) => (
                  <View key={fi} style={styles.facilityChip}>
                    <Text style={styles.facilityChipText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}

        {/* Mess & Food */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🍽️ Mess & Food Plans</Text>
          {messFees.map((m, i) => (
            <View key={i} style={styles.messRow}>
              <View>
                <Text style={styles.messPlan}>{m.plan}</Text>
                <Text style={styles.messNote}>{m.note}</Text>
              </View>
              <Text style={styles.messFee}>{m.fee}</Text>
            </View>
          ))}
        </View>

        {/* Campus Amenities */}
        <Text style={styles.bigTitle}>Campus Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {campusAmenities.map((a, i) => (
            <LinearGradient key={i} colors={a.gradient} style={styles.amenityCard}>
              <MaterialCommunityIcons name={a.icon} size={28} color={a.color} />
              <Text style={[styles.amenityLabel, { color: a.color }]}>{a.label}</Text>
              <Text style={styles.amenityDetail}>{a.detail}</Text>
            </LinearGradient>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  typeRow: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
  },
  typeBtnActive: { backgroundColor: '#16A34A' },
  typeText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  typeTextActive: { color: '#FFFFFF', fontWeight: '900' },
  scroll: { padding: 16, paddingTop: 0 },
  hostelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  hostelImage: { width: '100%', height: 160 },
  hostelOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 160,
    justifyContent: 'flex-end',
    padding: 14,
  },
  hostelFeeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 10,
  },
  hostelFeeText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  hostelInfo: { padding: 16 },
  hostelName: { fontSize: 17, fontWeight: '900', color: '#111827', marginBottom: 8 },
  hostelMeta: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8,
  },
  metaChipText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  facilitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  facilityChip: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10,
  },
  facilityChipText: { fontSize: 11, color: '#16A34A', fontWeight: '700' },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 },
  messRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  messPlan: { fontSize: 14, fontWeight: '700', color: '#111827' },
  messNote: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  messFee: { fontSize: 16, fontWeight: '900', color: '#16A34A' },
  bigTitle: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 14 },
  amenitiesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  amenityCard: {
    width: (width - 44) / 2,
    borderRadius: 20, padding: 18,
    gap: 6,
  },
  amenityLabel: { fontSize: 15, fontWeight: '800' },
  amenityDetail: { fontSize: 11, color: '#6B7280', lineHeight: 16 },
});

export default HostelAmenitiesScreen;
