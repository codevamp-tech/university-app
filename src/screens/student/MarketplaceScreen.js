import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions, Alert, Modal, TouchableWithoutFeedback, DeviceEventEmitter
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { useFocusEffect } from '@react-navigation/native';
import { getShopListings, createOrder, getShopGigs, getShopRequests, getWalletBalance, processWalletPurchaseMock } from '../../data/apiService';

const { width } = Dimensions.get('window');

const MarketplaceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();
  const avatarUrl = user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop';

  const defaultListings = [
    {
      id: 'mock_lst_1',
      title: 'Stethoscope (Littmann Classic III)',
      description: 'Excellent condition Littmann stethoscope, used for 1 year in clinical postings. Special plum tube.',
      price: 4500,
      category: 'medical',
      image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=600'
    },
    {
      id: 'mock_lst_2',
      title: "Gray's Anatomy for Students",
      description: 'South Asia Edition. Minor highlights on anatomy diagrams, otherwise brand new condition.',
      price: 1200,
      category: 'books',
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600'
    },
    {
      id: 'mock_lst_3',
      title: 'iPad Air (4th Gen) 64GB',
      description: 'Perfect for taking clinical notes and viewing medical slides. Includes Apple Pencil 2 clone.',
      price: 24000,
      category: 'electronics',
      image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600'
    },
    {
      id: 'mock_lst_4',
      title: 'Lab Coat & scrubs (Medium)',
      description: 'Pure white cotton lab coat with university crest patch and sky blue scrubs.',
      price: 500,
      category: 'gear',
      image_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=600'
    }
  ];

  const defaultGigs = [
    {
      id: 'mock_gig_1',
      title: 'Differential Diagnosis Tutoring',
      description: 'Providing 1-on-1 tutoring sessions for second year students preparing for pathology and microbiology exams.',
      price: 250,
      category: 'education',
      image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600'
    },
    {
      id: 'mock_gig_2',
      title: 'Clinical Case Study Writing',
      description: 'Help with formatting and structuring medical case reports for PubMed journal submissions.',
      price: 350,
      category: 'research',
      image_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600'
    }
  ];

  const defaultRequests = [
    {
      id: 'mock_req_1',
      title: 'Need Biochemistry Lab Notes',
      reward: 150,
      price: 150,
      category: 'request',
      description: 'Looking for detailed handwritten notes for Unit 3 (Enzyme Kinetics) biochemistry.'
    },
    {
      id: 'mock_req_2',
      title: 'Urgent: Ward Duty Swap',
      reward: 300,
      price: 300,
      category: 'request',
      description: 'Need someone to cover my pediatric ward posting on Thursday evening (5 PM - 8 PM).'
    }
  ];

  const [apiListings, setApiListings] = React.useState([]);
  const [apiGigs, setApiGigs] = React.useState([]);
  const [apiRequests, setApiRequests] = React.useState([]);
  const [walletBalance, setWalletBalance] = React.useState(0);
  const [isFabMenuVisible, setIsFabMenuVisible] = React.useState(false);

  const loadMarketplaceData = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getShopListings(accessToken);
      if (data && data.length > 0) {
        setApiListings(data.filter(l => l.category !== 'gig' && l.category !== 'request'));
      } else {
        setApiListings(defaultListings);
      }
    } catch (err) {
      console.warn('[MarketplaceScreen] Error fetching listings:', err);
      setApiListings(defaultListings);
    }
    try {
      const gigs = await getShopGigs(accessToken);
      if (gigs && gigs.length > 0) {
        setApiGigs(gigs);
      } else {
        setApiGigs(defaultGigs);
      }
    } catch (err) {
      console.warn('[MarketplaceScreen] Error fetching gigs:', err);
      setApiGigs(defaultGigs);
    }
    try {
      const reqs = await getShopRequests(accessToken);
      if (reqs && reqs.length > 0) {
        setApiRequests(reqs);
      } else {
        setApiRequests(defaultRequests);
      }
    } catch (err) {
      console.warn('[MarketplaceScreen] Error fetching requests:', err);
      setApiRequests(defaultRequests);
    }
  }, [accessToken]);

  useFocusEffect(
    React.useCallback(() => {
      loadMarketplaceData();

      // Load wallet
      if (accessToken) {
        getWalletBalance(accessToken)
          .then(w => setWalletBalance(w.balance))
          .catch(() => { });
      }
    }, [loadMarketplaceData, accessToken])
  );

  React.useEffect(() => {
    const subProduct = DeviceEventEmitter.addListener('newProductAdded', (item) => {
      setApiListings(prev => [item, ...prev]);
    });
    const subGig = DeviceEventEmitter.addListener('newGigAdded', (item) => {
      setApiGigs(prev => [item, ...prev]);
    });
    const subReq = DeviceEventEmitter.addListener('newRequestAdded', (item) => {
      setApiRequests(prev => [item, ...prev]);
    });
    return () => {
      subProduct.remove();
      subGig.remove();
      subReq.remove();
    };
  }, []);

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
        {/* Quick Requests - Redesigned to match screen.png */}
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

      {/* Sell FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            bottom: 120 + (insets.bottom || 0)
          }
        ]}
        activeOpacity={0.9}
        onPress={() => setIsFabMenuVisible(true)}
      >
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Post</Text>
      </TouchableOpacity>

      {/* FAB Menu Modal */}
      <Modal
        visible={isFabMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFabMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFabMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Create New Post</Text>

                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: colors.border }]}
                  onPress={() => { setIsFabMenuVisible(false); navigation.navigate('AddProduct'); }}
                >
                  <MaterialIcons name="shopping-bag" size={24} color={colors.primary} />
                  <View style={styles.modalOptionTextContainer}>
                    <Text style={[styles.modalOptionTitle, { color: colors.textPrimary }]}>Sell an Item</Text>
                    <Text style={[styles.modalOptionDesc, { color: colors.textSecondary }]}>List a product for sale</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: colors.border }]}
                  onPress={() => { setIsFabMenuVisible(false); navigation.navigate('AddGig'); }}
                >
                  <MaterialIcons name="work" size={24} color={colors.primary} />
                  <View style={styles.modalOptionTextContainer}>
                    <Text style={[styles.modalOptionTitle, { color: colors.textPrimary }]}>Offer a Gig</Text>
                    <Text style={[styles.modalOptionDesc, { color: colors.textSecondary }]}>Offer your services or coaching</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => { setIsFabMenuVisible(false); navigation.navigate('AddRequest'); }}
                >
                  <MaterialIcons name="live-help" size={24} color={colors.primary} />
                  <View style={styles.modalOptionTextContainer}>
                    <Text style={[styles.modalOptionTitle, { color: colors.textPrimary }]}>Post a Request</Text>
                    <Text style={[styles.modalOptionDesc, { color: colors.textSecondary }]}>Ask for something you need</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalCancelBtn, { backgroundColor: colors.background }]}
                  onPress={() => setIsFabMenuVisible(false)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
