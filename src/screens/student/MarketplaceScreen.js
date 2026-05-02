import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';


const { width } = Dimensions.get('window');

const MarketplaceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [cartCount, setCartCount] = React.useState(0);


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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {[
              { id: 1, title: 'Need a calculator at Seminar Hall 1', reward: '₹50', type: 'FLASH', icon: 'lightning-bolt', color: '#10B981' },
              { id: 2, title: 'Need lab manual prints at Block B', reward: '₹100', type: 'URGENT', icon: 'printer', color: '#3B82F6' },
              { id: 3, title: 'Python help needed in Library', reward: '₹80', type: 'STUDY', icon: 'account-group', color: '#F59E0B' },
              { id: 4, title: 'Coffee pickup from Canteen', reward: '₹40', type: 'FOOD', icon: 'coffee', color: '#EC4899' },
              { id: 5, title: 'Lost USB drive near Block C', reward: '₹200', type: 'LOST', icon: 'magnify', color: '#8B5CF6' },
              { id: 6, title: 'Tech Fest setup volunteers', reward: 'Perk', type: 'VOLUNTEER', icon: 'calendar-star', color: '#EF4444' },
            ].map(item => (
              <View key={item.id} style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <View style={styles.quickCardHeader}>
                  <View style={[styles.quickIconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : item.color + '15' }]}>
                    <MaterialCommunityIcons name={item.icon} size={20} color={isDark ? colors.primary : item.color} />
                  </View>
                  <View style={[styles.quickBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : item.color + '15' }]}>
                    <Text style={[styles.quickBadgeText, { color: isDark ? colors.primary : item.color }]}>{item.type}</Text>
                  </View>
                </View>
                <Text style={[styles.quickTitle, { color: colors.textPrimary }]} numberOfLines={2}>{item.title}</Text>


                <View style={[styles.quickDivider, { backgroundColor: colors.border }]} />

                <View style={styles.quickFooter}>
                  <View>
                    <Text style={[styles.quickRewardLabel, { color: colors.textSecondary }]}>{item.reward === 'Perk' ? 'BENEFIT' : 'REWARD'}</Text>
                    <Text style={[styles.quickReward, { color: colors.textPrimary }]}>{item.reward === 'Perk' ? 'Certificate' : item.reward}</Text>
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
        </View>


        {/* Featured Gigs */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Featured Gigs</Text>
          {/* Gig 1 */}
          <View style={[styles.gigCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>

            <Image source={{ uri: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop' }} style={styles.gigImg} />
            <View style={[styles.gigPopularBadge, { backgroundColor: isDark ? colors.primary : '#9A3412' }]}>
              <Text style={styles.gigPopularText}>Popular</Text>
            </View>

            <View style={styles.gigContent}>
              <Text style={[styles.gigTitle, { color: colors.textPrimary }]}>Python Mentorship from a Senior</Text>
              <Text style={[styles.gigDesc, { color: colors.textSecondary }]}>Get 1-on-1 guidance from a senior developer. Master Python concepts, architecture patterns, and industry best practices.</Text>


              <View style={[styles.gigAuthorRow, { borderBottomColor: colors.border }]}>
                <Image source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.gigAuthorImg} />
                <View>
                  <Text style={[styles.gigAuthorName, { color: colors.textPrimary }]}>Rahul Verma</Text>
                  <Text style={[styles.gigAuthorSub, { color: colors.textSecondary }]}>B.Tech CS, 4th Year</Text>
                </View>
              </View>


              <View style={[styles.gigFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.gigPrice, { color: isDark ? colors.primary : '#9A3412' }]}>₹499<Text style={[styles.gigPriceSub, { color: colors.textSecondary }]}>/hr</Text></Text>

                <TouchableOpacity style={[styles.bookGigBtn, { backgroundColor: isDark ? colors.primary : '#78350F' }]}>
                  <Text style={styles.bookGigText}>Book Gig</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>


          {/* Gig 2 */}
          <View style={[styles.gigCardSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop' }} style={styles.gigImgSmall} />
            <View style={styles.gigContentSmall}>
              <Text style={[styles.gigTitleSmall, { color: colors.textPrimary }]}>Logo Design for Startups</Text>

              <View style={styles.gigFooterSmall}>
                <Text style={[styles.gigAuthorSmall, { color: colors.textSecondary }]}>by Sneha Kapoor</Text>
                <Text style={[styles.gigPriceSmall, { color: isDark ? colors.primary : '#9A3412' }]}>₹750</Text>
              </View>
            </View>
          </View>

          {/* Gig 3 */}
          <View style={[styles.gigCardSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2000&auto=format&fit=crop' }} style={styles.gigImgSmall} />
            <View style={styles.gigContentSmall}>
              <Text style={[styles.gigTitleSmall, { color: colors.textPrimary }]}>Photography for TechFest</Text>

              <View style={styles.gigFooterSmall}>
                <Text style={[styles.gigAuthorSmall, { color: colors.textSecondary }]}>by Aryan Singh</Text>
                <Text style={[styles.gigPriceSmall, { color: isDark ? colors.primary : '#9A3412' }]}>₹1,200</Text>
              </View>
            </View>
          </View>


        </View>

        {/* The Bazaar */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>The Bazaar</Text>


          <View style={styles.bazaarGrid}>

            <TouchableOpacity 
              style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}

              onPress={() => navigation.navigate('ProductDetail', {
                item: {
                  id: 1,
                  title: 'B.Tech 3rd Sem Books',
                  price: '₹650',
                  image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop',
                  desc: 'Complete set of core subject books for B.Tech CS 3rd Semester. Perfect for exam prep.',
                  badge: 'USED - GOOD',
                  seller: { name: 'Rahul Verma', year: '4th Year, CS', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' }
                }
              })}
            >
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
                  <Text style={[styles.itemBadgeText, { color: colors.textPrimary }]}>USED - GOOD</Text>
                </View>
              </View>

              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>B.Tech 3rd Sem Books</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>All core subjects included.</Text>

                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: isDark ? colors.primaryLight : colors.primary }]}>₹650</Text>

                  <View style={styles.itemActionRow}>
                    <TouchableOpacity onPress={addToCart}>
                      <MaterialIcons name="add-shopping-cart" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                  </View>
                </View>

              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}

              onPress={() => navigation.navigate('ProductDetail', {
                item: {
                  id: 2,
                  title: 'Lab Coat (Size M)',
                  price: '₹250',
                  image: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=2070&auto=format&fit=crop',
                  desc: 'Standard white lab coat, clean and ironed. Mandatory for chemistry and physics labs.',
                  badge: 'NEAR NEW',
                  seller: { name: 'Aryan Singh', year: '2nd Year, ME', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' }
                }
              })}
            >
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=2070&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
                  <Text style={[styles.itemBadgeText, { color: isDark ? '#E5E7EB' : '#374151' }]}>NEAR NEW</Text>
                </View>
              </View>

              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Lab Coat (Size M)</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Only used for one semester.</Text>

                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.primary }]}>₹250</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />

                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ProductDetail', {
                item: {
                  id: 3,
                  title: 'MacBook Air M1',
                  price: '₹45,000',
                  image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2000&auto=format&fit=crop',
                  desc: 'M1 Space Grey, 8GB/256GB. Battery health 92%. Best for CS students.',
                  badge: 'BEST DEAL',
                  seller: { name: 'Sneha Kapoor', year: '3rd Year, IT', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' }
                }
              })}
            >
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
                  <Text style={[styles.itemBadgeText, { color: isDark ? '#FECACA' : '#991B1B' }]}>BEST DEAL</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>MacBook Air M1</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Perfect for coding, 8GB/256GB.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: isDark ? colors.primaryLight : colors.primary }]}>₹45,000</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </TouchableOpacity>


            <TouchableOpacity 
              style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => navigation.navigate('ProductDetail', {
                item: {
                  id: 4,
                  title: 'Hercules Cycle',
                  price: '₹5,500',
                  image: 'https://images.unsplash.com/photo-1532298229144-0ee0505adfe0?q=80&w=2000&auto=format&fit=crop',
                  desc: '21 speed, disc brakes, 1yr old. Well maintained and perfect for campus commutes.',
                  badge: 'BIKE',
                  seller: { name: 'Karan Mehra', year: '2nd Year, BBA', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' }
                }
              })}
            >
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1532298229144-0ee0505adfe0?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                  <Text style={[styles.itemBadgeText, { color: colors.textPrimary }]}>BIKE</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Hercules Cycle</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>21 speed, disc brakes, 1yr old.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹5,500</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => navigation.navigate('ProductDetail', {
                item: {
                  id: 5,
                  title: 'iPad Air 4th Gen',
                  price: '₹28,000',
                  image: 'https://images.unsplash.com/photo-1544244015-0cd4b3ffc6b0?q=80&w=2000&auto=format&fit=crop',
                  desc: 'Sky Blue, 64GB. Perfect for digital note taking. Supports Apple Pencil 2.',
                  badge: 'GADGET',
                  seller: { name: 'Isha Goel', year: '3rd Year, B.Des', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' }
                }
              })}
            >
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1544244015-0cd4b3ffc6b0?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                  <Text style={[styles.itemBadgeText, { color: isDark ? colors.primary : '#92400E' }]}>GADGET</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>iPad Air 4th Gen</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>With Apple Pencil 2 support.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹28,000</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => navigation.navigate('ProductDetail', {
                item: {
                  id: 6,
                  title: 'Nike Air Jordan 1',
                  price: '₹8,900',
                  image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop',
                  desc: 'Classic Chicago colorway. Size 9, rarely used. Original box and bill available.',
                  badge: 'FOOTWEAR',
                  seller: { name: 'Aryan Singh', year: '2nd Year, ME', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' }
                }
              })}
            >
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }]}>
                  <Text style={[styles.itemBadgeText, { color: isDark ? '#10B981' : '#065F46' }]}>FOOTWEAR</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Nike Air Jordan 1</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Size 9, rarely used, original box.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹8,900</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => navigation.navigate('ProductDetail', {
                item: {
                  id: 7,
                  title: 'Sony WH-1000XM4',
                  price: '₹14,500',
                  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2000&auto=format&fit=crop',
                  desc: 'Industry leading noise cancelling headphones. 30 hours battery. Mint condition.',
                  badge: 'ELECTRONICS',
                  seller: { name: 'Rahul Verma', year: '4th Year, CS', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' }
                }
              })}
            >
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }]}>
                  <Text style={[styles.itemBadgeText, { color: isDark ? '#60A5FA' : '#1E40AF' }]}>ELECTRONICS</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Sony WH-1000XM4</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Noise cancelling headphones.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹14,500</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }]}>
                  <Text style={[styles.itemBadgeText, { color: isDark ? '#60A5FA' : '#1E40AF' }]}>FASHION</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Fossil Gen 6 Smartwatch</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Black leather strap, mint cond.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹7,200</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => navigation.navigate('ProductDetail', {
                item: {
                  id: 8,
                  title: 'Marshall Major IV',
                  price: '₹11,999',
                  image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=2000&auto=format&fit=crop',
                  desc: 'Iconic headphones with 80+ hours of wireless playtime. Bluetooth 5.0.',
                  badge: 'HOT',
                  seller: { name: ' Aryan Singh', year: '2nd Year, ME', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' }
                }
              })}
            >
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#EF4444' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#FFFFFF' }]}>HOT</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Marshall Major IV</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Iconic headphones with 80+ hours.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹11,999</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                  <Text style={[styles.itemBadgeText, { color: colors.textPrimary }]}>GAMING</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Razer DeathAdder V2</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Ergonomic wired gaming mouse.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹3,250</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </View>

            <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? colors.border : '#FFFFFF' }]}>
                  <Text style={[styles.itemBadgeText, { color: colors.textPrimary }]}>OPEN BOX</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Dell XPS 13</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Touch screen, i7, 16GB RAM.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹72,000</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => navigation.navigate('ProductDetail', {
                item: {
                  id: 9,
                  title: 'PlayStation 5 Console',
                  price: '₹38,500',
                  image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=2000&auto=format&fit=crop',
                  desc: 'Disc edition with 2 DualSense controllers. Includes Marvel’s Spider-Man 2.',
                  badge: 'TV',
                  seller: { name: 'Karan Mehra', year: '2nd Year, BBA', avatar: 'https://i.pravatar.cc/150?u=karan' }
                }
              })}
            >
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(3, 105, 161, 0.2)' : '#E0F2FE' }]}>
                  <Text style={[styles.itemBadgeText, { color: isDark ? '#0ea5e9' : '#0369A1' }]}>TV</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>PlayStation 5 Console</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Disc edition with 2 dualsense.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹38,500</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(153, 27, 27, 0.2)' : '#FEE2E2' }]}>
                  <Text style={[styles.itemBadgeText, { color: isDark ? '#f87171' : '#991B1B' }]}>APPAREL</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Hoodie</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Limited edition, size L.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹899</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </View>

            <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(91, 33, 182, 0.2)' : '#F5F3FF' }]}>
                  <Text style={[styles.itemBadgeText, { color: isDark ? '#a78bfa' : '#5B21B6' }]}>SNEAKERS</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Adidas Ultraboost</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Cloud white, size 10, unworn.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹6,200</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </View>

            <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1611186871348-b1ec696e52c9?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                  <Text style={[styles.itemBadgeText, { color: colors.textPrimary }]}>GADGET</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Kindle Paperwhite</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Waterproof, 32GB, with case.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹7,500</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </View>

            <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? colors.border : '#FFFFFF' }]}>
                  <Text style={[styles.itemBadgeText, { color: colors.textPrimary }]}>FURNITURE</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Ergonomic Chair</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Mesh back, perfect for hostellers.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹3,800</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </View>

            <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(180, 83, 9, 0.2)' : '#FEF3C7' }]}>
                  <Text style={[styles.itemBadgeText, { color: isDark ? '#D97706' : '#B45309' }]}>ACCESSORY</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Ray-Ban Aviators</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Classic gold G-15, original case.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹5,200</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </View>

            <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                  <Text style={[styles.itemBadgeText, { color: colors.textPrimary }]}>UTIL</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>Steel Water Bottle</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Insulated, 1L, keeps cold 24h.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹450</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </View>

            <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: isDark ? colors.border : '#F9FAFB' }]}>
                  <Text style={[styles.itemBadgeText, { color: colors.textPrimary }]}>LAPTOP</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>HP Pavilion Gaming</Text>
                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>Ryzen 5, GTX 1650, 512GB SSD.</Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>₹42,000</Text>
                  <MaterialIcons name="favorite-border" size={18} color={colors.textMuted} />
                </View>
              </View>
            </View>


            {/* Repeat items to match image grid */}
          </View>
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
