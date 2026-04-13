import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const MarketplaceScreen = () => {
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
          <Text style={styles.headerLogo}>Invertis Hub</Text>
        </View>
        <View style={styles.creditPill}>
          <MaterialCommunityIcons name="wallet-outline" size={16} color="#9A3412" />
          <Text style={styles.creditText}>₹1,250</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Agora Marketplace Hero Banner */}
        <View style={styles.sectionContainer}>
          <View style={styles.heroCard}>
            <ImageBackground 
              source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop' }} 
              style={styles.heroBg}
            >
              <LinearGradient 
                colors={['rgba(234,88,12,0.8)', 'rgba(154,52,18,0.9)']} 
                style={styles.heroOverlay}
              >
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>AGORA MARKETPLACE</Text>
                </View>
                <Text style={styles.heroTitle}>Turn your skills into Campus Credits.</Text>
                <Text style={styles.heroSub}>The student economy is booming. Hire a peer or sell your gear.</Text>
              </LinearGradient>
            </ImageBackground>
          </View>
        </View>

        {/* Quick Requests */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Requests</Text>
            <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            <View style={styles.quickCard}>
              <View style={styles.quickHeader}>
                <MaterialCommunityIcons name="lightning-bolt" size={16} color="#065F46" />
                <Text style={styles.quickBadge}>FLASH TASK</Text>
              </View>
              <Text style={styles.quickTitle}>Need a calculator at Seminar Hall 1</Text>
              <View style={styles.quickFooter}>
                <Text style={styles.quickReward}>₹50 Reward</Text>
                <TouchableOpacity style={styles.quickBtn}>
                  <Text style={styles.quickBtnText}>I'll do it</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.quickCard, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
              <View style={styles.quickHeader}>
                <MaterialCommunityIcons name="printer" size={16} color="#3730A3" />
                <Text style={[styles.quickBadge, { color: '#3730A3' }]}>URGENT</Text>
              </View>
              <Text style={styles.quickTitle}>Need printouts of lab manual at Block B</Text>
              <View style={styles.quickFooter}>
                <Text style={[styles.quickReward, { color: '#3730A3' }]}>₹100 Reward</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Featured Gigs */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Featured Gigs</Text>
          
          {/* Gig 1 */}
          <View style={styles.gigCard}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop' }} style={styles.gigImg} />
            <View style={styles.gigPopularBadge}>
              <Text style={styles.gigPopularText}>Popular</Text>
            </View>
            
            <View style={styles.gigContent}>
              <Text style={styles.gigTitle}>Python Debugging & Code Review</Text>
              <Text style={styles.gigDesc}>Struggling with your semester projects? I provide professional code audits and logic debugging for Python applications.</Text>
              
              <View style={styles.gigAuthorRow}>
                <Image source={{ uri: 'https://i.pravatar.cc/100?u=rahul' }} style={styles.gigAuthorImg} />
                <View>
                  <Text style={styles.gigAuthorName}>Rahul Verma</Text>
                  <Text style={styles.gigAuthorSub}>B.Tech CS, 3rd Year</Text>
                </View>
              </View>
              
              <View style={styles.gigFooter}>
                <Text style={styles.gigPrice}>₹499<Text style={styles.gigPriceSub}>/hr</Text></Text>
                <TouchableOpacity style={styles.bookGigBtn}>
                  <Text style={styles.bookGigText}>Book Gig</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Gig 2 */}
          <View style={styles.gigCardSmall}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop' }} style={styles.gigImgSmall} />
            <View style={styles.gigContentSmall}>
              <Text style={styles.gigTitleSmall}>Logo Design for Startups</Text>
              <View style={styles.gigFooterSmall}>
                <Text style={styles.gigAuthorSmall}>by Sneha Kapoor</Text>
                <Text style={styles.gigPriceSmall}>₹750</Text>
              </View>
            </View>
          </View>

          {/* Gig 3 */}
          <View style={styles.gigCardSmall}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2000&auto=format&fit=crop' }} style={styles.gigImgSmall} />
            <View style={styles.gigContentSmall}>
              <Text style={styles.gigTitleSmall}>Photography for TechFest</Text>
              <View style={styles.gigFooterSmall}>
                <Text style={styles.gigAuthorSmall}>by Aryan Singh</Text>
                <Text style={styles.gigPriceSmall}>₹1,200</Text>
              </View>
            </View>
          </View>

        </View>

        {/* The Bazaar */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>The Bazaar</Text>
          
          <View style={styles.bazaarGrid}>
            
            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2098&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#FFFFFF' }]}>
                  <Text style={styles.itemBadgeText}>USED - GOOD</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>B.Tech 3rd Sem Books</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>All core subjects included.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹650</Text>
                  <MaterialIcons name="favorite" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1584031908035-776eb8a40552?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#E5E7EB' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#374151' }]}>NEAR NEW</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Lab Coat (Size M)</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Only used for one semester.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹250</Text>
                  <MaterialIcons name="favorite" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            {/* Repeat items to match image grid */}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Item Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  creditText: {
    color: '#9A3412',
    fontWeight: '800',
    fontSize: 12,
  },
  scroll: {
    paddingBottom: 20,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  heroCard: {
    height: 180,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  heroBg: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9A3412',
  },
  hScroll: {
    gap: 16,
    paddingRight: 16,
  },
  quickCard: {
    backgroundColor: '#D1FAE5',
    width: 240,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  quickBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 1,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  quickFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickReward: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  quickBtn: {
    backgroundColor: '#065F46',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  gigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  gigImg: {
    width: '100%',
    height: 180,
  },
  gigPopularBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#9A3412',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gigPopularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  gigContent: {
    padding: 24,
  },
  gigTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  gigDesc: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 8,
  },
  gigAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  gigAuthorImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  gigAuthorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  gigAuthorSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  gigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  gigPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#9A3412',
  },
  gigPriceSub: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  bookGigBtn: {
    backgroundColor: '#78350F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  bookGigText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  gigCardSmall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  gigImgSmall: {
    width: '100%',
    height: 120,
  },
  gigContentSmall: {
    padding: 16,
  },
  gigTitleSmall: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  gigFooterSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  gigAuthorSmall: {
    fontSize: 12,
    color: '#6B7280',
  },
  gigPriceSmall: {
    fontSize: 16,
    fontWeight: '900',
    color: '#9A3412',
  },
  bazaarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  itemImgBox: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  itemBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#111827',
  },
  itemContent: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  itemDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4338CA',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#78350F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default MarketplaceScreen;
