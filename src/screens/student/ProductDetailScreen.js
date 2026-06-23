import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../context/UserContext';
import { getPublicProfile } from '../../data/apiService';
import { fetchStudentsFromSheet } from '../../data/googleSheetsService';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useUser();
  
  const product = route.params?.product || {};
  const seller = product.seller || {};

  const [sellerProfile, setSellerProfile] = React.useState(null);
  const [isLoadingSeller, setIsLoadingSeller] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    const fetchSellerDetails = async () => {
      if (!product.seller_id || !accessToken) {
        setIsLoadingSeller(false);
        return;
      }
      try {
        const dbProfile = await getPublicProfile(accessToken, product.seller_id);
        if (dbProfile && isMounted) {
          try {
            const students = await fetchStudentsFromSheet();
            const richStudent = students.find(s => s.id.toLowerCase() === dbProfile.username.toLowerCase());
            if (richStudent) {
              setSellerProfile({
                user_id: product.seller_id,
                username: richStudent.name,
                rollno: dbProfile.rollno,
                avatar_url: dbProfile.avatar_url || (richStudent.gender === 'F' || richStudent.gender === 'Female' 
                  ? 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500'
                  : 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500'),
                course: richStudent.course,
                year: richStudent.year,
              });
            } else {
              setSellerProfile({
                user_id: product.seller_id,
                username: dbProfile.username,
                rollno: dbProfile.rollno,
                avatar_url: dbProfile.avatar_url,
                course: '',
                year: dbProfile.current_year,
              });
            }
          } catch (sheetError) {
            setSellerProfile({
              user_id: product.seller_id,
              username: dbProfile.username,
              rollno: dbProfile.rollno,
              avatar_url: dbProfile.avatar_url,
              course: '',
              year: dbProfile.current_year,
            });
          }
        }
      } catch (err) {
        console.warn('[ProductDetail] Error fetching seller public profile:', err);
      } finally {
        if (isMounted) setIsLoadingSeller(false);
      }
    };

    fetchSellerDetails();
    return () => { isMounted = false; };
  }, [product.seller_id, accessToken]);

  const isOwnListing = user && user.user_id === product.seller_id;

  const handleRequestToBuy = () => {
    if (isOwnListing) return;
    const contactInfo = sellerProfile || seller;
    navigation.navigate('DMConversation', { contact: contactInfo, source: 'marketplace' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Product Image Cover */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.image_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2000' }} 
            style={styles.coverImage} 
          />
          
          <TouchableOpacity 
            style={[styles.backBtnWrapper, { top: insets.top + 10 }]} 
            onPress={() => navigation.goBack()}
          >
            <View style={styles.backBtnInner}>
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED', marginBottom: 0 }]}>
                <Text style={[styles.badgeText, { color: isDark ? colors.primary : '#EA580C' }]}>
                  {product.category?.toUpperCase() || 'MISC'}
                </Text>
              </View>
              {isOwnListing && (
                <View style={[styles.ownListingBadge, { backgroundColor: colors.successLight }]}>
                  <Text style={[styles.ownListingBadgeText, { color: colors.success }]}>
                    YOUR LISTING
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{product.title}</Text>
            <Text style={[styles.price, { color: colors.primary }]}>₹{product.price}</Text>
          </View>

          {/* Seller Info */}
          <View style={[styles.sellerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image 
              source={{ 
                uri: sellerProfile?.avatar_url || seller.avatar_url || 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150' 
              }} 
              style={styles.sellerAvatar} 
            />
            <View style={styles.sellerInfo}>
              <Text style={[styles.sellerName, { color: colors.textPrimary }]}>
                {sellerProfile?.username || seller.username || 'Campus Seller'}
              </Text>
              <Text style={[styles.sellerRole, { color: colors.textSecondary }]}>
                {sellerProfile?.course 
                  ? `${sellerProfile.course} • Year ${sellerProfile.year}` 
                  : sellerProfile?.year
                  ? `Student Seller • Year ${sellerProfile.year}`
                  : 'Student Seller'}
              </Text>
            </View>
            {!isOwnListing && (
              <TouchableOpacity 
                style={[styles.chatIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}
                onPress={handleRequestToBuy}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {product.description || 'No description provided.'}
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </View>

      </ScrollView>

      {/* Footer CTA */}
      {!isOwnListing && (
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom || 20 }]}>
          <TouchableOpacity style={styles.buyBtn} onPress={handleRequestToBuy} activeOpacity={0.8}>
            <LinearGradient
              colors={isDark ? ['#9A3412', '#78350F'] : ['#EA580C', '#C2410C']}
              style={styles.buyBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buyBtnText}>Message Seller to Buy</Text>
              <MaterialCommunityIcons name="chat-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 0 },
  imageContainer: {
    width: '100%',
    height: width, // Square aspect ratio
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backBtnWrapper: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  backBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBody: {
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30,
    backgroundColor: 'transparent',
  },
  headerInfo: {
    marginBottom: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  ownListingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ownListingBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 32,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '800',
  },
  sellerRole: {
    fontSize: 13,
    marginTop: 2,
  },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
  },
  buyBtn: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buyBtnGradient: {
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  }
});

export default ProductDetailScreen;
