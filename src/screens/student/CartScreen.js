import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CartScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // Mock cart data
  const [cartItems, setCartItems] = React.useState([
    {
      id: 1,
      title: 'B.Tech 3rd Sem Books',
      price: 650,
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2098&auto=format&fit=crop',
      qty: 1,
    },
    {
      id: 2,
      title: 'Lab Coat (Size M)',
      price: 250,
      image: 'https://images.unsplash.com/photo-1584031908035-776eb8a40552?q=80&w=2000&auto=format&fit=crop',
      qty: 1,
    }
  ]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const platformFee = 20;
  const total = subtotal + platformFee;

  const removeItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQty = (id, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <TouchableOpacity onPress={() => setCartItems([])}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {cartItems.length > 0 ? (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.itemList}>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <Image source={{ uri: item.image }} style={styles.itemImg} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                    
                    <View style={styles.itemActions}>
                      <View style={styles.qtyContainer}>
                        <TouchableOpacity 
                          onPress={() => updateQty(item.id, -1)}
                          style={styles.qtyBtn}
                        >
                          <Ionicons name="remove" size={16} color="#4B5563" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.qty}</Text>
                        <TouchableOpacity 
                          onPress={() => updateQty(item.id, 1)}
                          style={styles.qtyBtn}
                        >
                          <Ionicons name="add" size={16} color="#4B5563" />
                        </TouchableOpacity>
                      </View>
                      
                      <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                        <Feather name="trash-2" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Price Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Bill Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items Total</Text>
                <Text style={styles.summaryValue}>₹{subtotal}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Platform Fee</Text>
                <Text style={styles.summaryValue}>₹{platformFee}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{total}</Text>
              </View>
            </View>

            {/* Delivery Info */}
            <View style={styles.deliveryCard}>
              <MaterialIcons name="local-shipping" size={24} color="#EA580C" />
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryTitle}>Campus Delivery</Text>
                <Text style={styles.deliverySub}>Meet at Block B Ground Floor (Today)</Text>
              </View>
            </View>
            
            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Checkout Bar */}
          <View style={[styles.checkoutBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View>
              <Text style={styles.totalAmountLabel}>Total</Text>
              <Text style={styles.totalAmountValue}>₹{total}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn}>
              <LinearGradient
                colors={['#EA580C', '#C2410C']}
                style={styles.checkoutGradient}
              >
                <Text style={styles.checkoutText}>Checkout</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Looks like you haven't added anything to your cart yet.</Text>
          <TouchableOpacity 
            style={styles.shopBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  itemList: {
    padding: 20,
    gap: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemImg: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#EA580C',
    marginVertical: 4,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginHorizontal: 10,
  },
  deleteBtn: {
    padding: 4,
  },
  summaryContainer: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  deliveryCard: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    gap: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9A3412',
  },
  deliverySub: {
    fontSize: 12,
    color: '#EA580C',
    marginTop: 2,
    fontWeight: '600',
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  totalAmountLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  totalAmountValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  checkoutBtn: {
    width: 160,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
  },
  checkoutGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  checkoutText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconBg: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  shopBtn: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  shopBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default CartScreen;
