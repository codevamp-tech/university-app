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

const { width } = Dimensions.get('window');

const SPICE_LEVELS = ['Mild', 'Medium', 'Hot'];

const ADD_ONS = [
  { id: 'a1', label: 'Extra Paneer', icon: 'cheese', price: 45, color: '#FFF7ED', iconColor: '#8B4B00' },
  { id: 'a2', label: 'Cool Curd', icon: 'ice-cream', price: 20, color: '#F0FDFA', iconColor: '#006666' },
  { id: 'a3', label: 'Masala Chaas', icon: 'cup', price: 35, color: '#EFF6FF', iconColor: '#4953AC' },
];

const FoodItemDetailScreen = ({ navigation, route }) => {
  const { item } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [qty, setQty] = useState(1);
  const [spice, setSpice] = useState('Medium');
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [note, setNote] = useState('');

  const toggleAddOn = (id) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addOnTotal = selectedAddOns.reduce((acc, id) => {
    const ao = ADD_ONS.find((a) => a.id === id);
    return acc + (ao ? ao.price : 0);
  }, 0);

  const total = (item.price + addOnTotal) * qty;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0D0D0D' : '#F5F6F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 4, backgroundColor: isDark ? 'rgba(13,13,13,0.9)' : 'rgba(255,255,255,0.9)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={isDark ? '#F5F6F7' : '#2C2F30'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FE9832' : '#8B4B00' }]}>Item Detail</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Image ── */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: item.image }} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.35)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroBadges}>
            <View style={[styles.badge, { backgroundColor: '#FE9832' }]}>
              <Text style={[styles.badgeText, { color: '#4D2700' }]}>Bestseller</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#8DEDEC' }]}>
              <Text style={[styles.badgeText, { color: '#005858' }]}>{item.veg ? 'Pure Veg' : 'Non-Veg'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.contentWrap, { backgroundColor: isDark ? '#0D0D0D' : '#F5F6F7' }]}>
          {/* ── Info ── */}
          <View style={styles.infoSection}>
            <Text style={[styles.itemName, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}>
              {item.name}
            </Text>
            <View style={styles.priceRatingRow}>
              <Text style={[styles.itemPrice, { color: isDark ? '#CBCEFF' : '#4953AC' }]}>₹{item.price}</Text>
              <View style={styles.ratingBadge}>
                <MaterialIcons name="star" size={14} color="#FE9832" />
                <Text style={styles.ratingTxt}>{item.rating}</Text>
              </View>
            </View>
            <Text style={[styles.itemDesc, { color: isDark ? '#757778' : '#595C5D' }]}>{item.desc}</Text>

            {/* Qty Row */}
            <View style={styles.qtyRow}>
              <Text style={[styles.qtyLabel, { color: isDark ? '#9B9D9E' : '#595C5D' }]}>Quantity</Text>
              <View style={[styles.qtyControls, { backgroundColor: isDark ? '#1A1A1A' : '#EFF1F2' }]}>
                <TouchableOpacity
                  onPress={() => setQty(Math.max(1, qty - 1))}
                  style={[styles.qtyBtn, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}
                >
                  <MaterialIcons name="remove" size={18} color="#8B4B00" />
                </TouchableOpacity>
                <Text style={[styles.qtyNum, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}>{qty}</Text>
                <TouchableOpacity
                  onPress={() => setQty(qty + 1)}
                  style={styles.qtyBtnFill}
                >
                  <MaterialIcons name="add" size={18} color="#FFF0E6" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Add-ons ── */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionBlockHeader}>
              <MaterialIcons name="auto-awesome" size={20} color={isDark ? '#CBCEFF' : '#4953AC'} />
              <Text style={[styles.sectionBlockTitle, { color: isDark ? '#CBCEFF' : '#4953AC' }]}>Make it yours</Text>
            </View>
            {ADD_ONS.map((ao) => {
              const selected = selectedAddOns.includes(ao.id);
              return (
                <TouchableOpacity
                  key={ao.id}
                  style={[
                    styles.addOnCard,
                    {
                      backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                      borderColor: selected ? '#8B4B00' : 'transparent',
                      borderWidth: selected ? 1.5 : 0,
                    },
                  ]}
                  onPress={() => toggleAddOn(ao.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.addOnIconWrap, { backgroundColor: isDark ? '#2A2A2A' : ao.color }]}>
                    <MaterialCommunityIcons name={ao.icon} size={22} color={ao.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.addOnLabel, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}>{ao.label}</Text>
                    <Text style={[styles.addOnPrice, { color: isDark ? '#757778' : '#595C5D' }]}>+ ₹{ao.price}</Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    {
                      backgroundColor: selected ? '#8B4B00' : isDark ? '#2A2A2A' : '#EFF1F2',
                      borderColor: selected ? '#8B4B00' : '#ABADAE',
                    }
                  ]}>
                    {selected && <MaterialIcons name="check" size={14} color="#FFF0E6" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Preferences ── */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionBlockHeader}>
              <MaterialIcons name="tune" size={20} color={isDark ? '#CBCEFF' : '#4953AC'} />
              <Text style={[styles.sectionBlockTitle, { color: isDark ? '#CBCEFF' : '#4953AC' }]}>Preferences</Text>
            </View>

            <Text style={[styles.prefLabel, { color: isDark ? '#757778' : '#757778' }]}>SPICE LEVEL</Text>
            <View style={styles.spiceRow}>
              {SPICE_LEVELS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSpice(s)}
                  style={[
                    styles.spiceBtn,
                    spice === s
                      ? { backgroundColor: '#8B4B00' }
                      : { backgroundColor: isDark ? '#1A1A1A' : '#EFF1F2' },
                  ]}
                >
                  <Text style={[styles.spiceBtnText, { color: spice === s ? '#FFF0E6' : isDark ? '#9B9D9E' : '#595C5D' }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.noteCard, { backgroundColor: isDark ? '#1A1A1A' : '#EFF1F2' }]}>
              <Text style={[styles.noteLabel, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}>Special Instructions</Text>
              <TextInput
                style={[styles.noteInput, { color: isDark ? '#F5F6F7' : '#2C2F30', borderColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}
                placeholder="e.g., No Spicy, Less Oil, Extra Chutney..."
                placeholderTextColor="#757778"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: isDark ? 'rgba(13,13,13,0.95)' : 'rgba(255,255,255,0.95)' }]}>
        <View style={styles.footerLeft}>
          <Text style={[styles.totalLabel, { color: isDark ? '#757778' : '#757778' }]}>Total Price</Text>
          <Text style={[styles.totalAmt, { color: isDark ? '#F5F6F7' : '#2C2F30' }]}>₹{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.9}>
          <LinearGradient
            colors={['#8B4B00', '#FE9832']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGrad}
          >
            <MaterialCommunityIcons name="shopping-outline" size={20} color="#FFF0E6" />
            <Text style={styles.ctaText}>Add to Cart</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FoodItemDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },

  heroWrap: { width: '100%', height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroBadges: {
    position: 'absolute', top: 16, left: 16,
    flexDirection: 'row', gap: 8,
  },
  badge: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  contentWrap: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -16 },

  infoSection: { padding: 24, paddingBottom: 8 },
  itemName: { fontSize: 32, fontWeight: '900', letterSpacing: -0.8, lineHeight: 36, marginBottom: 10 },
  priceRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  itemPrice: { fontSize: 26, fontWeight: '900' },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10,
  },
  ratingTxt: { fontSize: 13, fontWeight: '800', color: '#8B4B00' },
  itemDesc: { fontSize: 15, lineHeight: 22, marginBottom: 20 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyLabel: { fontSize: 14, fontWeight: '700' },
  qtyControls: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 999, padding: 4,
  },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnFill: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#8B4B00', justifyContent: 'center', alignItems: 'center',
  },
  qtyNum: { fontSize: 18, fontWeight: '900', minWidth: 28, textAlign: 'center' },

  sectionBlock: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  sectionBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionBlockTitle: { fontSize: 18, fontWeight: '800' },

  addOnCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  addOnIconWrap: {
    width: 46, height: 46, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  addOnLabel: { fontSize: 15, fontWeight: '700' },
  addOnPrice: { fontSize: 13, marginTop: 2 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
  },

  prefLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  spiceRow: { flexDirection: 'row', gap: 8 },
  spiceBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
  },
  spiceBtnText: { fontSize: 14, fontWeight: '700' },

  noteCard: { borderRadius: 16, padding: 16, marginTop: 4 },
  noteLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  noteInput: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontSize: 14, lineHeight: 20, minHeight: 80, textAlignVertical: 'top',
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 8,
  },
  footerLeft: { flex: 1 },
  totalLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  totalAmt: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  ctaBtn: { width: 200, height: 56, borderRadius: 18, overflow: 'hidden' },
  ctaGrad: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8,
  },
  ctaText: { color: '#FFF0E6', fontSize: 16, fontWeight: '900' },
});
