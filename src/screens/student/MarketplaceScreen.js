import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions, Alert, Modal, TouchableWithoutFeedback
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { useFocusEffect } from '@react-navigation/native';
import { getShopListings, createOrder, getShopGigs, getShopRequests, getWalletBalance, processWalletPurchaseMock, getMyShopListings } from '../../data/apiService';

const { width } = Dimensions.get('window');

const MarketplaceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();

  const [apiListings, setApiListings] = React.useState([]);
  const [myListings, setMyListings] = React.useState([]);
  const [walletBalance, setWalletBalance] = React.useState(0);

  const loadMarketplaceData = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const [data, mine] = await Promise.all([
        getShopListings(accessToken),
        getMyShopListings(accessToken).catch(() => []),
      ]);
      if (data) {
        setApiListings(data.filter(l => l.category !== 'gig' && l.category !== 'request'));
      } else {
        setApiListings([]);
      }
      if (Array.isArray(mine)) {
        setMyListings(mine.filter(l => l.category !== 'gig' && l.category !== 'request'));
      }
    } catch (err) {
      console.warn('[MarketplaceScreen] Error fetching listings:', err);
      setApiListings([]);
    }
  }, [accessToken]);

  useFocusEffect(
    React.useCallback(() => {
      loadMarketplaceData();
      if (accessToken) {
        getWalletBalance(accessToken)
          .then(w => setWalletBalance(w.balance))
          .catch(() => {});
      }
    }, [loadMarketplaceData, accessToken])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={isDark ? ['#9A3412', '#7C2D12'] : ['#EA580C', '#9A3412']}
            style={styles.logoIconBg}
          >
            <MaterialIcons name="storefront" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Hub</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.creditPill, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(234, 88, 12, 0.1)' : '#FFF7ED' }]}
            onPress={() => Alert.alert('Premium Feature', 'Wallet and credits are locked in this demo.')}
          >
            <MaterialIcons name="lock" size={12} color={isDark ? colors.primary : '#9A3412'} style={{ marginRight: 2 }} />
            <MaterialCommunityIcons name="wallet-outline" size={16} color={isDark ? colors.primary : '#9A3412'} />
            <Text style={[styles.creditText, { color: isDark ? colors.primary : '#9A3412' }]}>
              ₹{Number(walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
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
        </View>

        {/* My Listings (student's own — includes pending) */}
        {myListings.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Listings</Text>
            <View style={styles.bazaarGrid}>
              {myListings.map((item) => {
                const isPending = item.status === 'pending' || item.status === 'pending_review' || item.status === 'submitted';
                return (
                  <View
                    key={item.id}
                    style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, opacity: isPending ? 0.82 : 1 }]}
                  >
                    <View style={styles.itemImgBox}>
                      <Image
                        source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2000' }}
                        style={[styles.itemImg, isPending && { opacity: 0.4 }]}
                        blurRadius={isPending ? 3 : 0}
                      />
                      {isPending && (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                          <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800', marginTop: 4, textAlign: 'center' }}>APPROVAL{'
'}PENDING</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                      <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
                      <View style={styles.itemFooter}>
                        <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹{item.price}</Text>
                        <View style={{ backgroundColor: isPending ? '#FEF3C7' : '#D1FAE5', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: isPending ? '#D97706' : '#059669' }}>
                            {isPending ? 'PENDING' : 'ACTIVE'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

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
                  onPress={() => navigation.navigate('ProductDetail', { product: item })}
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

      {/* Post FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            bottom: 120 + (insets.bottom || 0),
          },
        ]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Post</Text>
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
  logoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
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
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 4,
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
  gigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  gigPrice: {
    fontSize: 24,
    fontWeight: '900',
  },
  gigPriceSub: {
    fontSize: 14,
    fontWeight: '600',
  },
  bookGigBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  bookGigText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
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
  },
  itemContent: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '800',
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
    bottom: 110,
    right: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOptionTextContainer: {
    marginLeft: 16,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOptionDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  modalCancelBtn: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '700',
  }
});

export default MarketplaceScreen;
