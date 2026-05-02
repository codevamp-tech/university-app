import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { APP_CONFIG } from '../../config/appConfig';

const { width } = Dimensions.get('window');

// ─── Data ────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Snacks', 'Meals', 'Beverages', 'Desserts'];

const VENDORS = [
  { id: 'v1', name: 'Main Canteen', location: 'Block A', icon: 'food-fork-drink', color: '#EA580C', image: 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=400&auto=format&fit=crop' },
  { id: 'v2', name: 'Block B Canteen', location: 'Block B', icon: 'silverware-fork-knife', color: '#4338CA', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop' },
  { id: 'v3', name: 'Maggi Point', location: 'Main Garden', icon: 'bowl-mix-outline', color: '#EAB308', image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&auto=format&fit=crop' },
  { id: 'v4', name: 'Chai Corner', location: 'North Block', icon: 'tea-outline', color: '#92400E', image: 'https://images.unsplash.com/photo-1544787210-2213d84ad13b?w=400&auto=format&fit=crop' },
  { id: 'v5', name: 'Juice Corner', location: 'Fitness Area', icon: 'cup-water', color: '#10B981', image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b4?w=400&auto=format&fit=crop' },
];

const SPECIALS = [
  {
    id: 's1',
    label: 'Campus Favorite',
    labelColor: '#FE9832',
    labelText: '#4D2700',
    title: 'Authentic North Indian Thali',
    subtitle: 'Experience the richness of home-style cooking.',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop',
  },
  {
    id: 's2',
    label: 'Afternoon Refreshment',
    labelColor: '#8DEDEC',
    labelText: '#005858',
    title: 'Ginger Masala Tea',
    subtitle: 'Perfectly brewed with fresh spices for the break.',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop',
  },
];

const FOOD_ITEMS = [
  {
    id: 1,
    name: 'Paneer Tikka',
    desc: 'Clay oven grilled cottage cheese cubes',
    price: 120,
    rating: 4.8,
    category: 'Snacks',
    veg: true,
    vendorId: 'v1',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&auto=format&fit=crop',
  },
  {
    id: 2,
    name: 'Chole Bhature',
    desc: 'Classic spiced chickpeas with fluffy bread',
    price: 85,
    rating: 4.9,
    category: 'Meals',
    veg: true,
    vendorId: 'v1',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop',
  },
  {
    id: 3,
    name: 'Masala Dosa',
    desc: 'Crispy crepe filled with potato masala',
    price: 95,
    rating: 4.7,
    category: 'Meals',
    veg: true,
    vendorId: 'v2',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop',
  },
  {
    id: 4,
    name: 'Pani Puri',
    desc: '8pcs of tangy and spicy street joy',
    price: 40,
    rating: 4.6,
    category: 'Snacks',
    veg: true,
    vendorId: 'v2',
    image: 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=400&auto=format&fit=crop',
  },
  {
    id: 5,
    name: 'Masala Chai',
    desc: 'Fresh brewed spiced Indian tea',
    price: 25,
    rating: 4.8,
    category: 'Beverages',
    veg: true,
    vendorId: 'v4',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop',
  },
  {
    id: 6,
    name: 'Maggi Noodles',
    desc: 'Classic masala maggi with veggies',
    price: 45,
    rating: 4.9,
    category: 'Snacks',
    veg: true,
    vendorId: 'v3',
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&auto=format&fit=crop',
  },
  {
    id: 7,
    name: 'Mixed Fruit Juice',
    desc: 'Freshly squeezed seasonal fruits',
    price: 60,
    rating: 4.7,
    category: 'Beverages',
    veg: true,
    vendorId: 'v5',
    image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b4?w=400&auto=format&fit=crop',
  },
  {
    id: 8,
    name: 'Cheese Maggi',
    desc: 'Loaded with extra cheese and herbs',
    price: 65,
    rating: 4.8,
    category: 'Snacks',
    veg: true,
    vendorId: 'v3',
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&auto=format&fit=crop',
  },
  {
    id: 9,
    name: 'Special Thali',
    desc: 'Full meal with Dal, Paneer, Rice & Roti',
    price: 150,
    rating: 4.9,
    category: 'Meals',
    veg: true,
    vendorId: 'v1',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop',
  },
  {
    id: 10,
    name: 'Veg Biryani',
    desc: 'Fragrant basmati rice with veggies',
    price: 130,
    rating: 4.7,
    category: 'Meals',
    veg: true,
    vendorId: 'v1',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=400&auto=format&fit=crop',
  },
  {
    id: 11,
    name: 'Idli Sambhar',
    desc: 'Steamed rice cakes with tangy lentil soup',
    price: 60,
    rating: 4.8,
    category: 'Meals',
    veg: true,
    vendorId: 'v2',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop',
  },
  {
    id: 12,
    name: 'Vada Pav',
    desc: 'Mumbai style spicy potato burger',
    price: 30,
    rating: 4.9,
    category: 'Snacks',
    veg: true,
    vendorId: 'v2',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea8c5119c85?w=400&auto=format&fit=crop',
  },
  {
    id: 13,
    name: 'Cold Coffee',
    desc: 'Blended coffee with vanilla ice cream',
    price: 70,
    rating: 4.8,
    category: 'Beverages',
    veg: true,
    vendorId: 'v3',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&auto=format&fit=crop',
  },
  {
    id: 14,
    name: 'Samosa (2 pcs)',
    desc: 'Crispy pastry with spicy potato filling',
    price: 30,
    rating: 4.7,
    category: 'Snacks',
    veg: true,
    vendorId: 'v4',
    image: 'https://images.unsplash.com/photo-1601050638917-3f80fc014d02?w=400&auto=format&fit=crop',
  },
  {
    id: 15,
    name: 'Bun Makkhan',
    desc: 'Freshly toasted bun with dollop of butter',
    price: 40,
    rating: 4.8,
    category: 'Snacks',
    veg: true,
    vendorId: 'v4',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop',
  },
  {
    id: 16,
    name: 'Orange Juice',
    desc: 'Pure freshly squeezed orange juice',
    price: 70,
    rating: 4.9,
    category: 'Beverages',
    veg: true,
    vendorId: 'v5',
    image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b4?w=400&auto=format&fit=crop',
  },
  {
    id: 17,
    name: 'Banana Shake',
    desc: 'Creamy shake with fresh bananas & milk',
    price: 50,
    rating: 4.8,
    category: 'Beverages',
    veg: true,
    vendorId: 'v5',
    image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400&auto=format&fit=crop',
  },
];

// ─── Component ────────────────────────────────────────────────────────────
const CampusBitesMenuScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeVendor, setActiveVendor] = useState('v1');
  const [cartItems, setCartItems] = useState({});

  const totalCartItems = Object.values(cartItems).reduce((a, b) => a + b, 0);

  const filtered = FOOD_ITEMS.filter((item) => {
    const matchVendor = item.vendorId === activeVendor || activeVendor === 'all';
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchVendor && matchCat && matchSearch;
  });

  const addToCart = (id) => {
    setCartItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => {
      const updated = { ...prev };
      if (updated[id] > 1) updated[id] -= 1;
      else delete updated[id];
      return updated;
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0D0D0D' : '#F5F6F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 4, backgroundColor: isDark ? 'rgba(13,13,13,0.92)' : 'rgba(255,255,255,0.92)' }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={isDark ? '#F5F6F7' : '#2C2F30'} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <LinearGradient colors={['#EA580C', '#8B4B00']} style={styles.brandIcon}>
              <MaterialCommunityIcons name="food" size={16} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.brandName, { color: isDark ? '#FE9832' : '#8B4B00' }]}>{APP_CONFIG.CAMPUS_BITES_NAME}</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.creditPill, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.1)' : '#FFF7ED' }]}
              onPress={() => navigation.navigate('MainWallet')}
            >
              <MaterialCommunityIcons name="wallet-outline" size={16} color={isDark ? '#FE9832' : '#8B4B00'} />
              <Text style={[styles.creditText, { color: isDark ? '#FE9832' : '#8B4B00' }]}>₹1,250</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cartBtn}
              onPress={() => navigation.navigate('FoodCart', { cartItems, foodItems: FOOD_ITEMS })}
            >
              <MaterialCommunityIcons name="shopping-outline" size={24} color={isDark ? '#FE9832' : '#8B4B00'} />
              {totalCartItems > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalCartItems}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1A1A1A' : '#EFF1F2' }]}>
          <MaterialIcons name="search" size={20} color={isDark ? '#757778' : '#757778'} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}
            placeholder="Search Paneer Tikka or Masala Chai..."
            placeholderTextColor="#757778"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color="#757778" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Vendor Selector (New) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Food Hub</Text>
            <TouchableOpacity onPress={() => setActiveVendor('all')}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>Show All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {VENDORS.map((v) => (
              <TouchableOpacity
                key={v.id}
                onPress={() => setActiveVendor(v.id)}
                style={[
                  styles.vendorCard,
                  { 
                    backgroundColor: activeVendor === v.id ? v.color : colors.card,
                    borderColor: activeVendor === v.id ? v.color : colors.border,
                    borderWidth: 1
                  }
                ]}
              >
                <View style={[styles.vendorIconBg, { backgroundColor: activeVendor === v.id ? 'rgba(255,255,255,0.2)' : v.color + '10' }]}>
                  <MaterialCommunityIcons name={v.icon} size={20} color={activeVendor === v.id ? '#FFF' : v.color} />
                </View>
                <Text style={[styles.vendorName, { color: activeVendor === v.id ? '#FFF' : colors.textPrimary }]}>{v.name}</Text>
                <Text style={[styles.vendorLoc, { color: activeVendor === v.id ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>{v.location}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* ── Today's Specials ── */}
        {search === '' && activeCategory === 'All' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#CBCEFF' : '#4953AC' }]}>Today's Specials</Text>
              <Text style={[styles.viewAll, { color: isDark ? '#FE9832' : '#8B4B00' }]}>View All</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 16 }}>
              {SPECIALS.map((s) => (
                <View key={s.id} style={styles.specialCard}>
                  <Image source={{ uri: s.image }} style={styles.specialImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.82)']}
                    style={styles.specialOverlay}
                  >
                    <View style={[styles.specialBadge, { backgroundColor: s.labelColor }]}>
                      <Text style={[styles.specialBadgeText, { color: s.labelText }]}>{s.label}</Text>
                    </View>
                    <Text style={styles.specialTitle}>{s.title}</Text>
                    <Text style={styles.specialSub}>{s.subtitle}</Text>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Category Chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.chip,
                activeCategory === cat
                  ? { backgroundColor: '#8B4B00' }
                  : { backgroundColor: isDark ? '#1A1A1A' : '#E0E3E4' },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: activeCategory === cat ? '#FFF0E6' : isDark ? '#9B9D9E' : '#595C5D' },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Food Grid ── */}
        <View style={styles.gridWrap}>
          {filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.foodCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}
              onPress={() => navigation.navigate('FoodItemDetail', { item, cartItems, onUpdateCart: () => {} })}
              activeOpacity={0.85}
            >
              <Image source={{ uri: item.image }} style={styles.foodImage} />
              <View style={styles.foodInfo}>
                <View style={styles.foodTopRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.vegRow}>
                      <View style={[styles.vegDot, { borderColor: item.veg ? '#22C55E' : '#EF4444' }]}>
                        <View style={[styles.vegInner, { backgroundColor: item.veg ? '#22C55E' : '#EF4444' }]} />
                      </View>
                      <Text style={[styles.vegLabel, { color: item.veg ? '#22C55E' : '#EF4444' }]}>
                        {item.veg ? 'Veg' : 'Non-Veg'}
                      </Text>
                    </View>
                    <Text style={[styles.foodName, { color: isDark ? '#F5F6F7' : '#2C2F30' }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.foodDesc, { color: isDark ? '#757778' : '#595C5D' }]} numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </View>
                  <View style={styles.ratingPill}>
                    <MaterialIcons name="star" size={12} color="#FE9832" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>

                <View style={styles.foodBottomRow}>
                  <Text style={[styles.foodPrice, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}>₹{item.price}</Text>

                  {cartItems[item.id] ? (
                    <View style={styles.qtyControls}>
                      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.qtyBtn}>
                        <MaterialIcons name="remove" size={16} color="#8B4B00" />
                      </TouchableOpacity>
                      <Text style={styles.qtyNum}>{cartItems[item.id]}</Text>
                      <TouchableOpacity onPress={() => addToCart(item.id)} style={styles.qtyBtnFill}>
                        <MaterialIcons name="add" size={16} color="#FFF0E6" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => addToCart(item.id)}
                    >
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="food-off" size={48} color={isDark ? '#333' : '#DDD'} />
              <Text style={[styles.emptyTxt, { color: isDark ? '#555' : '#9CA3AF' }]}>No items found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Floating Cart Bar ── */}
      {totalCartItems > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { bottom: insets.bottom + 16 }]}
          onPress={() => navigation.navigate('FoodCart', { cartItems, foodItems: FOOD_ITEMS })}
          activeOpacity={0.9}
        >
          <LinearGradient colors={['#8B4B00', '#FE9832']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.floatingCartGrad}>
            <View style={styles.floatingCartLeft}>
              <View style={styles.floatingCartBadge}>
                <Text style={styles.floatingCartBadgeText}>{totalCartItems}</Text>
              </View>
              <Text style={styles.floatingCartLabel}>items in your tray</Text>
            </View>
            <View style={styles.floatingCartRight}>
              <Text style={styles.floatingCartAction}>View Cart</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#FFF0E6" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CampusBitesMenuScreen;

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  brandName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  creditText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cartBtn: { padding: 4, position: 'relative' },
  cartBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#B02500',
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },

  // Section
  sectionWrap: { marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  viewAll: { fontSize: 13, fontWeight: '700' },

  // Vendor Card
  vendorCard: {
    width: 140,
    padding: 16,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  vendorIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  vendorLoc: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  specialCard: {
    width: width * 0.78, height: 200,
    borderRadius: 20, overflow: 'hidden',
    marginRight: 16,
  },
  specialImage: { width: '100%', height: '100%', position: 'absolute' },
  specialOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, justifyContent: 'flex-end',
  },
  specialBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 999, marginBottom: 6,
  },
  specialBadgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  specialTitle: { color: '#FFF', fontSize: 17, fontWeight: '800', lineHeight: 22 },
  specialSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },

  // Chips
  chipRow: {
    paddingHorizontal: 16, paddingVertical: 14, gap: 8,
  },
  chip: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '700' },

  // Grid
  gridWrap: { paddingHorizontal: 16, gap: 12, paddingTop: 4 },
  foodCard: {
    borderRadius: 20, flexDirection: 'row', gap: 12,
    padding: 12, alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  foodImage: { width: 108, height: 108, borderRadius: 14, flexShrink: 0 },
  foodInfo: { flex: 1, justifyContent: 'space-between', gap: 6 },
  foodTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  vegRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  vegDot: {
    width: 14, height: 14, borderRadius: 3, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  vegInner: { width: 7, height: 7, borderRadius: 999 },
  vegLabel: { fontSize: 10, fontWeight: '700' },
  foodName: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  foodDesc: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#FFF7ED', paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  ratingText: { fontSize: 11, fontWeight: '800', color: '#8B4B00' },
  foodBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  foodPrice: { fontSize: 18, fontWeight: '900' },

  // Add / Qty
  addBtn: {
    backgroundColor: '#8B4B00',
    paddingHorizontal: 20, paddingVertical: 7, borderRadius: 999,
  },
  addBtnText: { color: '#FFF0E6', fontSize: 13, fontWeight: '800' },
  qtyControls: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF7ED', borderRadius: 999,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnFill: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#8B4B00', justifyContent: 'center', alignItems: 'center',
  },
  qtyNum: { fontSize: 14, fontWeight: '900', color: '#8B4B00', minWidth: 18, textAlign: 'center' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTxt: { fontSize: 15, fontWeight: '600' },

  // Floating Cart
  floatingCart: { position: 'absolute', left: 16, right: 16 },
  floatingCartGrad: {
    borderRadius: 20, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    shadowColor: '#8B4B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  floatingCartLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floatingCartBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  floatingCartBadgeText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  floatingCartLabel: { color: '#FFF0E6', fontWeight: '700', fontSize: 14 },
  floatingCartRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  floatingCartAction: { color: '#FFF0E6', fontWeight: '800', fontSize: 15 },
});
