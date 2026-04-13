import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SmartCampusScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
            style={styles.avatarTiny}
          />
          <Text style={styles.headerLogo}>Invertis Smart Campus</Text>
        </View>
        <View style={styles.creditPill}>
          <MaterialCommunityIcons name="wallet-outline" size={16} color="#EA580C" />
          <Text style={styles.creditText}>1,250 Credits</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Live Now Card */}
        <View style={styles.sectionContainer}>
          <View style={styles.liveCard}>
            <View style={styles.liveIconBox}>
              <MaterialCommunityIcons name="access-point" size={28} color="#9A3412" />
            </View>
            <View style={styles.liveContent}>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE NOW</Text>
              </View>
              <Text style={styles.liveTitle}>Computer Networks</Text>
              <Text style={styles.liveSub}>Room 202 • Dr. Malhotra</Text>
            </View>
            <TouchableOpacity style={styles.checkInBtn}>
              <MaterialCommunityIcons name="wifi-marker" size={16} color="#FFFFFF" />
              <Text style={styles.checkInText}>Tap to Check-in</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionBlock}>
              <View style={styles.actionIconPill}>
                <MaterialCommunityIcons name="camera-metering-center" size={24} color="#9A3412" />
              </View>
              <Text style={styles.actionLabel}>AR Navigator</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBlock}>
              <View style={styles.actionIconPill}>
                <MaterialCommunityIcons name="lock-smart" size={24} color="#9A3412" />
              </View>
              <Text style={styles.actionLabel}>Smart Key</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBlock}>
              <View style={styles.actionIconPill}>
                <MaterialCommunityIcons name="qrcode-scan" size={24} color="#9A3412" />
              </View>
              <Text style={styles.actionLabel}>Campus Pay</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBlock}>
              <View style={styles.actionIconPill}>
                <MaterialCommunityIcons name="calendar-multiselect" size={24} color="#9A3412" />
              </View>
              <Text style={styles.actionLabel}>Room Booking</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AR Campus Feed */}
        <View style={styles.sectionContainer}>
          <View style={styles.arCard}>
            <ImageBackground 
              source={{ uri: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop' }} 
              style={styles.arBg}
              imageStyle={{ borderRadius: 32 }}
            >
              <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.9)']} style={styles.arOverlay}>
                <View style={styles.arTop}>
                  <View style={styles.arLiveFeed}>
                    <View style={styles.redDot} />
                    <Text style={styles.arLiveText}>LIVE AR FEED</Text>
                  </View>
                  <Text style={styles.arScanningText}>Scanning for points of interest...</Text>
                  
                  <View style={styles.arFloatingLabels}>
                    <View style={styles.arLabelBrown}>
                      <MaterialIcons name="business" size={12} color="#FFFFFF" />
                      <Text style={styles.arLabelText}>Engineering Block A</Text>
                    </View>
                    <View style={styles.arLabelTeal}>
                      <MaterialIcons name="event" size={12} color="#FFFFFF" />
                      <Text style={styles.arLabelText}>Tech Fest Expo '24</Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.arCamText}>AR CAMPUS VIEW</Text>
                
                <View style={styles.arBottomNav}>
                  <TouchableOpacity style={[styles.arNavItem, styles.arNavActive]}>
                    <Text style={[styles.arNavText, styles.arNavTextActive]}>Navigation</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.arNavItem}>
                    <Text style={styles.arNavText}>Events</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.arNavItem}>
                    <Text style={styles.arNavText}>Utilities</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        </View>

        {/* Current Location & Utilities */}
        <View style={styles.sectionContainer}>
          <View style={styles.locationHeader}>
            <View>
              <Text style={styles.locationSub}>CURRENT LOCATION</Text>
              <Text style={styles.locationTitle}>Academic Block A</Text>
            </View>
            <View style={styles.locationPinBox}>
              <MaterialIcons name="my-location" size={24} color="#4338CA" />
            </View>
          </View>
          
          <Text style={styles.utilitiesTitle}>NEARBY UTILITIES</Text>
          
          <View style={styles.utilityCard}>
            <MaterialCommunityIcons name="bookshelf" size={28} color="#065F46" />
            <View style={styles.utilityContent}>
              <Text style={styles.utilityName}>Library</Text>
              <Text style={styles.utilityDistance}>30m away</Text>
            </View>
            <View style={styles.utilityBadgeTeal}>
              <Text style={styles.utilityBadgeTextTeal}>5 SEATS FREE</Text>
            </View>
          </View>
          
          <View style={styles.utilityCard}>
            <MaterialIcons name="restaurant" size={28} color="#9A3412" />
            <View style={styles.utilityContent}>
              <Text style={styles.utilityName}>Canteen</Text>
              <Text style={styles.utilityDistance}>100m away</Text>
            </View>
            <View style={styles.utilityBadgeOrange}>
              <Text style={styles.utilityBadgeTextOrange}>SPECIAL: PAV BHAJI</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  avatarTiny: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  creditText: {
    color: '#EA580C',
    fontWeight: '800',
    fontSize: 12,
  },
  scroll: {
    paddingBottom: 20,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  liveCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
  },
  liveIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveContent: {
    alignItems: 'center',
  },
  liveBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9A3412',
    letterSpacing: 1,
  },
  liveTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  liveSub: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#78350F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    gap: 8,
  },
  checkInText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4338CA',
  },
  divider: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E7FF',
    borderRadius: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBlock: {
    alignItems: 'center',
    width: '23%',
  },
  actionIconPill: {
    backgroundColor: '#FFFFFF',
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  arCard: {
    height: 480,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  arBg: {
    width: '100%',
    height: '100%',
  },
  arOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  arLiveFeed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  arLiveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  arScanningText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginTop: 12,
  },
  arFloatingLabels: {
    marginTop: 30,
    alignItems: 'center',
    gap: 16,
  },
  arLabelBrown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#78350F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  arLabelTeal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065F46',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  arLabelText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  arCamText: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 40,
  },
  arBottomNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    padding: 6,
    justifyContent: 'space-between',
    backdropFilter: 'blur(10px)',
  },
  arNavItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 24,
  },
  arNavActive: {
    backgroundColor: '#FFFFFF',
  },
  arNavText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  arNavTextActive: {
    color: '#111827',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  locationSub: {
    color: '#9A3412',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  locationTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  locationPinBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  utilitiesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 1,
    marginBottom: 16,
  },
  utilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  utilityContent: {
    flex: 1,
    marginLeft: 16,
  },
  utilityName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  utilityDistance: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  utilityBadgeTeal: {
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  utilityBadgeTextTeal: {
    color: '#064E3B',
    fontSize: 9,
    fontWeight: '800',
  },
  utilityBadgeOrange: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  utilityBadgeTextOrange: {
    color: '#9A3412',
    fontSize: 9,
    fontWeight: '800',
  },
});

export default SmartCampusScreen;
