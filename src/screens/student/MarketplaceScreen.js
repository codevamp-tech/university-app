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

        {/* Invertis Marketplace Hero Banner */}
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
                  <Text style={styles.heroBadgeText}>Invertis MARKETPLACE</Text>
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
              <Text style={styles.sectionTitle}>Quick Requests</Text>
              <Text style={styles.sectionSubtitle}>Help others & earn rewards</Text>
            </View>
            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="arrow-forward" size={14} color="#EA580C" />
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
              <View key={item.id} style={styles.quickCard}>
                <View style={styles.quickCardHeader}>
                  <View style={[styles.quickIconWrapper, { backgroundColor: item.color + '15' }]}>
                    <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={[styles.quickBadge, { backgroundColor: item.color + '15' }]}>
                    <Text style={[styles.quickBadgeText, { color: item.color }]}>{item.type}</Text>
                  </View>
                </View>
                <Text style={styles.quickTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.quickDivider} />
                <View style={styles.quickFooter}>
                  <View>
                    <Text style={styles.quickRewardLabel}>{item.reward === 'Perk' ? 'BENEFIT' : 'REWARD'}</Text>
                    <Text style={[styles.quickReward, { color: '#111827' }]}>{item.reward === 'Perk' ? 'Certificate' : item.reward}</Text>
                  </View>
                  <TouchableOpacity style={styles.quickBtn}>
                    <LinearGradient colors={['#EA580C', '#C2410C']} style={styles.quickBtnGradient}>
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
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
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
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#991B1B' }]}>BEST DEAL</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>MacBook Air M1</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Perfect for coding, 8GB/256GB.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹45,000</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1589118949245-7d48d24f8450?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#374151' }]}>BIKE</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Hercules Cycle</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>21 speed, disc brakes, 1yr old.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹5,500</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1544244015-0cd4b3ffc6b0?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#92400E' }]}>GADGET</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>iPad Air 4th Gen</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>With Apple Pencil 2 support.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹28,000</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#065F46' }]}>FOOTWEAR</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Nike Air Jordan 1</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Size 9, rarely used, original box.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹8,900</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#FFFFFF' }]}>
                  <Text style={styles.itemBadgeText}>ELECTRONICS</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Sony WH-1000XM4</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Noise cancelling headphones.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹14,500</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#1E40AF' }]}>FASHION</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Fossil Gen 6 Smartwatch</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Black leather strap, mint cond.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹7,200</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#EF4444' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#FFFFFF' }]}>HOT</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Marshall Major IV</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Iconic headphones with 80+ hours.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹11,999</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#374151' }]}>GAMING</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Razer DeathAdder V2</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Ergonomic wired gaming mouse.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹3,250</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#FFFFFF' }]}>
                  <Text style={styles.itemBadgeText}>OPEN BOX</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Dell XPS 13</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Touch screen, i7, 16GB RAM.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹72,000</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#0369A1' }]}>TV</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>PlayStation 5 Console</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Disc edition with 2 dualsense.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹38,500</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#991B1B' }]}>APPAREL</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Invertis Hoodie</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Limited edition, size L.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹899</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#F5F3FF' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#5B21B6' }]}>SNEAKERS</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Adidas Ultraboost</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Cloud white, size 10, unworn.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹6,200</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1611186871348-b1ec696e52c9?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#374151' }]}>GADGET</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Kindle Paperwhite</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Waterproof, 32GB, with case.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹7,500</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#FFFFFF' }]}>
                  <Text style={styles.itemBadgeText}>FURNITURE</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Ergonomic Chair</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Mesh back, perfect for hostellers.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹3,800</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#B45309' }]}>ACCESSORY</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Ray-Ban Aviators</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Classic gold G-15, original case.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹5,200</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#374151' }]}>UTIL</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Steel Water Bottle</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Insulated, 1L, keeps cold 24h.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹450</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            <View style={styles.itemCard}>
              <View style={styles.itemImgBox}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?q=80&w=2000&auto=format&fit=crop' }} style={styles.itemImg} />
                <View style={[styles.itemBadge, { backgroundColor: '#F9FAFB' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#111827' }]}>LAPTOP</Text>
                </View>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>HP Pavilion Gaming</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>Ryzen 5, GTX 1650, 512GB SSD.</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>₹42,000</Text>
                  <MaterialIcons name="favorite-outline" size={18} color="#6B7280" />
                </View>
              </View>
            </View>

            {/* Repeat items to match image grid */}
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
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#111827',
    marginBottom: 16,
    lineHeight: 22,
    height: 44,
  },
  quickDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
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
    color: '#9CA3AF',
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
