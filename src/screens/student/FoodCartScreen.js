import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';

const { width } = Dimensions.get('window');

const FOOD_ITEMS = [
  { id: 1, name: 'Paneer Tikka', price: 120, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&auto=format&fit=crop' },
  { id: 2, name: 'Chole Bhature', price: 85, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop' },
  { id: 3, name: 'Masala Dosa', price: 95, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop' },
  { id: 4, name: 'Pani Puri', price: 40, image: 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=400&auto=format&fit=crop' },
  { id: 5, name: 'Masala Chai', price: 25, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop' },
  { id: 6, name: 'Gulab Jamun', price: 50, image: 'https://images.unsplash.com/photo-1666274844038-7a10cbf1a47d?w=400&auto=format&fit=crop' },
  { id: 7, name: 'Special Veg Thali', price: 249, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&auto=format&fit=crop' },
  { id: 8, name: 'Cold Coffee', price: 70, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&auto=format&fit=crop' },
];

const FoodCartScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Build initial cart from route params or a default demo
  const initialCart = route?.params?.cartItems || { 1: 1, 5: 2 };
  const [cartItems, setCartItems] = useState(initialCart);
  const [rewardApplied, setRewardApplied] = useState(false);

  const cartEntries = FOOD_ITEMS.filter((f) => cartItems[f.id] > 0).map((f) => ({
    ...f,
    qty: cartItems[f.id],
  }));

  const itemTotal = cartEntries.reduce((acc, item) => acc + item.price * item.qty, 0);
  const gst = Math.round(itemTotal * 0.05);
  const platformFee = 5;
  const rewardDiscount = rewardApplied ? 50 : 0;
  const grandTotal = itemTotal + gst + platformFee - rewardDiscount;

  const updateQty = (id, delta) => {
    setCartItems((prev) => {
      const updated = { ...prev };
      const next = (updated[id] || 0) + delta;
      if (next <= 0) delete updated[id];
      else updated[id] = next;
      return updated;
    });
  };

  const isEmpty = cartEntries.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0D0D0D' : '#F5F6F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 4, backgroundColor: isDark ? 'rgba(13,13,13,0.92)' : 'rgba(255,255,255,0.92)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={isDark ? '#F5F6F7' : '#2C2F30'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FE9832' : '#8B4B00' }]}>Your Tray</Text>
        {!isEmpty && (
          <TouchableOpacity onPress={() => setCartItems({})}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        )}
        {isEmpty && <View style={{ width: 48 }} />}
      </View>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBg, { backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6' }]}>
            <MaterialCommunityIcons name="food-off" size={72} color={isDark ? '#333' : '#D1D5DB'} />
          </View>
          <Text style={[styles.emptyTitle, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}>Your tray is empty</Text>
          <Text style={[styles.emptySub, { color: isDark ? '#757778' : '#595C5D' }]}>Add some delicious food from {APP_CONFIG.CAMPUS_BITES_NAME}!</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('CampusBitesMenu')}
          >
            <LinearGradient colors={['#8B4B00', '#FE9832']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.browseBtnGrad}>
              <Text style={styles.browseBtnText}>Browse Menu</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 180 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Ready for Pickup Card */}
            <View style={styles.pickupCard}>
              <LinearGradient
                colors={isDark ? ['#003333', '#006666'] : ['#E6FFFE', '#8DEDEC']}
                style={styles.pickupGrad}
              >
                <View style={[styles.pickupIcon, { backgroundColor: '#006666' }]}>
                  <MaterialCommunityIcons name="timer-outline" size={22} color="#BBFFFE" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickupTitle, { color: isDark ? '#BBFFFE' : '#004343' }]}>Ready for Pickup</Text>
                  <Text style={[styles.pickupSub, { color: isDark ? '#8DEDEC' : '#006262' }]}>Estimated in 15–20 minutes</Text>
                </View>
                <Text style={[styles.quickService, { color: isDark ? '#8DEDEC' : '#006262' }]}>Quick Service</Text>
              </LinearGradient>
            </View>

            {/* Cart Items */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}>Your Order</Text>
              {cartEntries.map((item) => (
                <View
                  key={item.id}
                  style={[styles.cartCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}
                >
                  <Image source={{ uri: item.image }} style={styles.cartItemImg} />
                  <View style={styles.cartItemInfo}>
                    <Text style={[styles.cartItemName, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}>{item.name}</Text>
                    <Text style={[styles.cartItemPrice, { color: isDark ? '#FE9832' : '#8B4B00' }]}>₹{item.price}</Text>
                  </View>
                  <View style={[styles.qtyControls, { backgroundColor: isDark ? '#2A2A2A' : '#EFF1F2' }]}>
                    <TouchableOpacity
                      onPress={() => updateQty(item.id, -1)}
                      style={[styles.qtyBtn, { backgroundColor: isDark ? '#3A3A3A' : '#FFFFFF' }]}
                    >
                      <MaterialIcons name="remove" size={15} color={isDark ? '#F5F6F7' : '#2C2F30'} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyNum, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}>{item.qty}</Text>
                    <TouchableOpacity
                      onPress={() => updateQty(item.id, 1)}
                      style={[styles.qtyBtn, { backgroundColor: isDark ? '#3A3A3A' : '#FFFFFF' }]}
                    >
                      <MaterialIcons name="add" size={15} color={isDark ? '#F5F6F7' : '#2C2F30'} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Pulse Points / Rewards */}
            <View style={styles.sectionWrap}>
              <View style={[styles.rewardsCard, {
                backgroundColor: isDark ? 'rgba(139,75,0,0.12)' : '#FFF7ED',
                borderColor: isDark ? 'rgba(139,75,0,0.25)' : '#FFEDD5',
              }]}>
                <View style={styles.rewardsTop}>
                  <View style={styles.rewardsLeft}>
                    <MaterialIcons name="stars" size={22} color="#8B4B00" />
                    <Text style={[styles.rewardsTitle, { color: '#8B4B00' }]}>Pulse Points</Text>
                  </View>
                  <Text style={[styles.rewardsAvail, { color: isDark ? '#FE9832' : '#7A4100' }]}>450 available</Text>
                </View>
                <View style={styles.rewardsBottom}>
                  <Text style={[styles.rewardsTip, { color: isDark ? '#9B9D9E' : '#595C5D' }]}>
                    Use 100 points to get ₹50 off your order
                  </Text>
                  <TouchableOpacity
                    style={[styles.applyBtn, rewardApplied && { backgroundColor: '#22C55E' }]}
                    onPress={() => setRewardApplied(!rewardApplied)}
                  >
                    <Text style={styles.applyBtnText}>{rewardApplied ? 'Applied!' : 'Apply'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Bill Summary */}
            <View style={styles.sectionWrap}>
              <View style={[styles.billCard, { backgroundColor: isDark ? '#1A1A1A' : '#EFF1F2' }]}>
                <View style={styles.billHeader}>
                  <MaterialIcons name="receipt" size={20} color={isDark ? '#CBCEFF' : '#4953AC'} />
                  <Text style={[styles.billTitle, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}>Bill Summary</Text>
                </View>

                <BillRow label="Item Total" value={`₹${itemTotal}`} isDark={isDark} />
                <BillRow label="GST (5%)" value={`₹${gst}`} isDark={isDark} />
                <BillRow label="Platform Fee" value={`₹${platformFee}`} isDark={isDark} />
                {rewardApplied && (
                  <BillRow label="Reward Discount" value={`- ₹${rewardDiscount}`} isDark={isDark} green />
                )}

                <View style={[styles.billDivider, { backgroundColor: isDark ? '#2A2A2A' : '#DADDDF' }]} />

                <View style={styles.billRow}>
                  <Text style={[styles.billTotalLabel, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}>Grand Total</Text>
                  <Text style={[styles.billTotalValue, { color: isDark ? '#CBCEFF' : '#4953AC' }]}>₹{grandTotal}</Text>
                </View>
              </View>
            </View>

            {/* Trust Badge */}
            <View style={styles.trustRow}>
              <MaterialIcons name="verified-user" size={14} color={isDark ? '#555' : '#ABADAE'} />
              <Text style={[styles.trustText, { color: isDark ? '#555' : '#ABADAE' }]}>Secure Campus Payment</Text>
            </View>
          </ScrollView>

          {/* ── Footer Pay Button ── */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: isDark ? 'rgba(13,13,13,0.97)' : 'rgba(255,255,255,0.97)' }]}>
            <TouchableOpacity style={styles.payBtn} activeOpacity={0.9}>
              <LinearGradient
                colors={['#8B4B00', '#7A4100']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payGrad}
              >
                <Text style={styles.payText}>Pay & Order  ·  ₹{grandTotal}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFF0E6" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

// Helper
const BillRow = ({ label, value, isDark, green }) => (
  <View style={styles.billRow}>
    <Text style={[styles.billLabel, { color: isDark ? '#757778' : '#595C5D' }]}>{label}</Text>
    <Text style={[styles.billValue, { color: green ? '#22C55E' : isDark ? '#9B9D9E' : '#595C5D' }]}>{value}</Text>
  </View>
);

export default FoodCartScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  clearBtn: { fontSize: 13, fontWeight: '700', color: '#B02500' },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  emptyIconBg: {
    width: 160, height: 160, borderRadius: 80,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 22, fontWeight: '900' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  browseBtn: { width: 200, height: 52, borderRadius: 16, overflow: 'hidden' },
  browseBtnGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  browseBtnText: { color: '#FFF0E6', fontSize: 16, fontWeight: '800' },

  // Pickup
  pickupCard: { margin: 16, borderRadius: 20, overflow: 'hidden' },
  pickupGrad: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  pickupIcon: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  pickupTitle: { fontSize: 16, fontWeight: '800' },
  pickupSub: { fontSize: 13, marginTop: 2 },
  quickService: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  // Section
  sectionWrap: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 12 },

  // Cart Card
  cartCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cartItemImg: { width: 72, height: 72, borderRadius: 12 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  cartItemPrice: { fontSize: 16, fontWeight: '900' },

  qtyControls: {
    flexDirection: 'column', alignItems: 'center', gap: 4,
    borderRadius: 24, paddingHorizontal: 6, paddingVertical: 6,
  },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyNum: { fontSize: 14, fontWeight: '900', minWidth: 20, textAlign: 'center' },

  // Rewards
  rewardsCard: {
    borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderStyle: 'dashed',
    gap: 12,
  },
  rewardsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardsLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rewardsTitle: { fontSize: 16, fontWeight: '800' },
  rewardsAvail: { fontSize: 13, fontWeight: '700' },
  rewardsBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rewardsTip: { fontSize: 13, flex: 1, lineHeight: 18 },
  applyBtn: {
    backgroundColor: '#8B4B00',
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999,
  },
  applyBtnText: { color: '#FFF0E6', fontWeight: '800', fontSize: 13 },

  // Bill
  billCard: { borderRadius: 20, padding: 20, gap: 12 },
  billHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  billTitle: { fontSize: 16, fontWeight: '800' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billLabel: { fontSize: 14, fontWeight: '500' },
  billValue: { fontSize: 14, fontWeight: '700' },
  billDivider: { height: 1, marginVertical: 4 },
  billTotalLabel: { fontSize: 16, fontWeight: '800' },
  billTotalValue: { fontSize: 22, fontWeight: '900' },

  // Trust
  trustRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 20 },
  trustText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  payBtn: { borderRadius: 20, overflow: 'hidden', height: 58 },
  payGrad: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 10,
  },
  payText: { color: '#FFF0E6', fontSize: 17, fontWeight: '900' },
});
