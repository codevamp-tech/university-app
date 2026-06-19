import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions, Alert
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { getShopListings, createOrder, getShopGigs, getShopRequests } from '../../data/apiService';

const { width } = Dimensions.get('window');

const MarketplaceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { accessToken } = useUser();
  
  const [cartCount, setCartCount] = React.useState(0);
  const [apiListings, setApiListings] = React.useState([]);
  const [apiGigs, setApiGigs] = React.useState([]);
  const [apiRequests, setApiRequests] = React.useState([]);

  const loadMarketplaceData = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getShopListings(accessToken);
      if (data) setApiListings(data);
    } catch (err) {
      console.warn('[MarketplaceScreen] Error fetching listings:', err);
    }
    try {
      const gigs = await getShopGigs(accessToken);
      if (gigs) setApiGigs(gigs);
    } catch (err) {
      console.warn('[MarketplaceScreen] Error fetching gigs:', err);
    }
    try {
      const reqs = await getShopRequests(accessToken);
      if (reqs) setApiRequests(reqs);
    } catch (err) {
      console.warn('[MarketplaceScreen] Error fetching requests:', err);
    }
  }, [accessToken]);

  React.useEffect(() => {
    loadMarketplaceData();
  }, [loadMarketplaceData]);

  const handleBuyItem = async (listingId, price) => {
    try {
      if (accessToken) {
        await createOrder(accessToken, listingId, 1);
        Alert.alert('Order Placed', `Successfully placed order for ${price}. Your wallet will be debited.`);
      } else {
        Alert.alert('Success', 'Item added to cart (Simulation).');
      }
      setCartCount(prev => prev + 1);
    } catch (err) {
      Alert.alert('Order Failed', err.message || 'An error occurred.');
    }
  };


  const addToCart = () => {
    setCartCount(prev => prev + 1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>



      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>

        <View style={styles.headerLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
            style={[styles.avatarTiny, { borderColor: colors.border, borderWidth: 1 }]}
          />
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Hub</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.cartIconBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <MaterialIcons name="shopping-cart" size={22} color={colors.textPrimary} />

            {cartCount > 0 && (
              <View style={[styles.cartBadge, { borderColor: colors.card }]}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>

            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.creditPill, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(234, 88, 12, 0.1)' : '#FFF7ED' }]}
            onPress={() => navigation.navigate('MainWallet')}
          >
            <MaterialCommunityIcons name="wallet-outline" size={16} color={isDark ? colors.primary : '#9A3412'} />
            <Text style={[styles.creditText, { color: isDark ? colors.primary : '#9A3412' }]}>₹1,250</Text>
          </TouchableOpacity>


        </View>
      </View>


      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Marketplace Hero Banner */}
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
                  <Text style={styles.heroBadgeText}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} MARKETPLACE</Text>
                </View>
                <Text style={styles.heroTitle}>Turn your skills into Campus Credits.</Text>
                <Text style={styles.heroSub}>The student economy is booming. Hire a peer or sell your gear.</Text>
              </LinearGradient>
            </ImageBackground>
          </View>
        </View>        {/* Quick Requests - Redesigned to match screen.png */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Requests</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Help others & earn rewards</Text>
            </View>

            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={[styles.viewAllText, { color: isDark ? colors.primary : '#9A3412' }]}>View All</Text>
              <MaterialIcons name="arrow-forward" size={14} color={isDark ? colors.primary : "#EA580C"} />
            </TouchableOpacity>
          </View>

          {apiRequests.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderColor: colors.border, borderWidth: 1 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>No requests active</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {apiRequests.map(item => (
                <View key={item.id} style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                  <View style={styles.quickCardHeader}>
                    <View style={[styles.quickIconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#10B98115' }]}>
                      <MaterialCommunityIcons name="lightning-bolt" size={20} color={colors.primary} />
                    </View>
                    <View style={[styles.quickBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#10B98115' }]}>
                      <Text style={[styles.quickBadgeText, { color: colors.primary }]}>{item.category || 'REQUEST'}</Text>
                    </View>
                  </View>
                  <Text style={[styles.quickTitle, { color: colors.textPrimary }]} numberOfLines={2}>{item.title}</Text>

                  <View style={[styles.quickDivider, { backgroundColor: colors.border }]} />

                  <View style={styles.quickFooter}>
                    <View>
                      <Text style={[styles.quickRewardLabel, { color: colors.textSecondary }]}>REWARD</Text>
                      <Text style={[styles.quickReward, { color: colors.textPrimary }]}>₹{item.price || item.reward || '0'}</Text>
                    </View>

                    <TouchableOpacity style={styles.quickBtn}>
                      <LinearGradient colors={isDark ? ['#9A3412', '#78350F'] : ['#EA580C', '#C2410C']} style={styles.quickBtnGradient}>
                        <Text style={styles.quickBtnText}>Accept</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Featured Gigs */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Featured Gigs</Text>

          {apiGigs.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderColor: colors.border, borderWidth: 1 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>No gigs active</Text>
            </View>
          ) : (
            apiGigs.map((item) => (
              <View key={item.id} style={[styles.gigCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, marginBottom: 12 }]}>
                <Image source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop' }} style={styles.gigImg} />
                <View style={styles.gigContent}>
                  <Text style={[styles.gigTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.gigDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                  <View style={[styles.gigFooter, { borderTopColor: colors.border }]}>
                    <Text style={[styles.gigPrice, { color: isDark ? colors.primary : '#9A3412' }]}>₹{item.price}<Text style={[styles.gigPriceSub, { color: colors.textSecondary }]}>/hr</Text></Text>
                    <TouchableOpacity style={[styles.bookGigBtn, { backgroundColor: isDark ? colors.primary : '#78350F' }]}>
                      <Text style={styles.bookGigText}>Book Gig</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* The Bazaar */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>The Bazaar</Text>

          {apiListings.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderColor: colors.border, borderWidth: 1, marginTop: 16 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>No listings available</Text>
            </View>
          ) : (
            <View style={styles.bazaarGrid}>
              {apiListings.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => handleBuyItem(item.id, `₹${item.price}`)}
                >
                  <View style={styles.itemImgBox}>
                    <Image source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2000' }} style={styles.itemImg} />
                    {item.category && (
                      <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                        <Text style={[styles.itemBadgeText, { color: colors.textPrimary }]}>{item.category.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
                    <View style={styles.itemFooter}>
                      <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹{item.price}</Text>
                      <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sell FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        activeOpacity={0.9}
        onPress={() => {}}
      >
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Sell Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: '900',
  },

  avatarTiny: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  creditText: {
    fontWeight: '800',
    fontSize: 12,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartIconBtn: {
    padding: 4,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EA580C',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  itemActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  },

  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
  },

  hScroll: {
    gap: 16,
    paddingRight: 16,
  },
  quickCard: {
    width: 280,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  quickCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  quickBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 22,
    height: 44,
  },

  quickDivider: {
    height: 1,
    marginBottom: 16,
  },

  quickFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickRewardLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  quickReward: {
    fontSize: 18,
    fontWeight: '900',
  },
  quickBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickBtnGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  quickBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  gigCard: {
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
  },

  gigDesc: {
    fontSize: 14,
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
  },

  gigFooterSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  gigAuthorSmall: {
    fontSize: 12,
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
  },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 130,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },

});

export default MarketplaceScreen;
