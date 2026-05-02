import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { item } = route.params || {
    item: {
      title: 'B.Tech 3rd Sem Books',
      price: '₹650',
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2098&auto=format&fit=crop',
      desc: 'Complete set of core subject books for B.Tech CS 3rd Semester. In excellent condition with no markings.',
      badge: 'USED - GOOD',
      seller: {
        name: 'Rahul Verma',
        year: '4th Year, CS',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Image Section */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.mainImage} />
          
          {/* Top Overlay Actions */}
          <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.overlayBtn}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.overlayBtn}>
              <Ionicons name="share-outline" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Badge Overlay */}
          <View style={styles.badgeOverlay}>
            <Text style={styles.badgeText}>{item.badge || 'CAMPUS VERIFIED'}</Text>
          </View>
        </View>

        {/* Product Content */}
        <View style={styles.content}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{item.price}</Text>
            <TouchableOpacity>
              <Ionicons name="heart-outline" size={28} color="#EA580C" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          
          <View style={styles.tagsRow}>
            <View style={styles.tag}><Text style={styles.tagText}>Academic</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Near Library</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Verified</Text></View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {item.desc || "No description provided for this item. Please contact the student seller for more details about the condition and pickup location."}
          </Text>

          <View style={styles.divider} />

          {/* Seller Card */}
          <Text style={styles.sectionTitle}>Student Seller</Text>
          <View style={styles.sellerCard}>
            <Image 
              source={{ uri: item.seller?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
              style={styles.sellerAvatar} 
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{item.seller?.name || `${APP_CONFIG.UNIVERSITY_SHORT_NAME} Student`}</Text>
              <Text style={styles.sellerYear}>{item.seller?.year || APP_CONFIG.UNIVERSITY_NAME}</Text>
            </View>
            <TouchableOpacity style={styles.chatBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Safety Tips */}
          <View style={styles.safetyCard}>
            <MaterialIcons name="security" size={20} color="#EA580C" />
            <Text style={styles.safetyText}>
              Meet the seller in an open campus area (Canteen, Library) for a safe exchange.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.addToCartBtn}>
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyNowBtn}>
          <LinearGradient
            colors={['#EA580C', '#C2410C']}
            style={styles.buyNowGradient}
          >
            <Text style={styles.buyNowText}>Buy Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: width,
    height: width * 1.1,
    backgroundColor: '#F3F4F6',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  overlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 1,
  },
  content: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 28,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  sellerYear: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 20,
    marginTop: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 18,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  addToCartBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  buyNowBtn: {
    flex: 1.5,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
  buyNowGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});

export default ProductDetailScreen;
