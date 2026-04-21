import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

const MainWalletScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();


  const transactions = [
    { id: 1, title: 'Bazaar Sale: Sem 3 Books', amount: '+₹650', type: 'credit', time: 'Today, 2:30 PM', icon: 'book-outline', color: '#10B981' },
    { id: 2, title: 'Central Canteen: Coffee', amount: '-₹40', type: 'debit', time: 'Today, 11:15 AM', icon: 'coffee-outline', color: '#EF4444' },
    { id: 3, title: 'Airtel Recharge', amount: '-₹199', type: 'debit', time: 'Yesterday', icon: 'smartphone', color: '#3B82F6' },
    { id: 4, title: 'Reward: Lab Assistant', amount: '+₹500', type: 'credit', time: 'Oct 15', icon: 'star-outline', color: '#F59E0B' },
    { id: 5, title: 'Library Fine', amount: '-₹25', type: 'debit', time: 'Oct 14', icon: 'library-outline', color: '#6B7280' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Campus Wallet</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>


      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Balance Card */}
        <LinearGradient
          colors={isDark ? [colors.card, '#000000'] : ['#1E293B', '#0F172A']}
          style={[styles.balanceCard, { borderColor: isDark ? colors.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >

          <View style={styles.cardTop}>
            <View>
              <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
              <Text style={styles.balanceAmount}>₹1,250.00</Text>
            </View>
            <View style={styles.chipLogo}>
              <MaterialCommunityIcons name="chip" size={32} color="#F59E0B" />
            </View>
          </View>
          
          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardHolderLabel}>STUDENT ID</Text>
              <Text style={styles.cardHolderValue}>INV-2022-094</Text>
            </View>
            <TouchableOpacity style={styles.rechargeBtn}>
              <Text style={styles.rechargeText}>ADD MONEY</Text>
            </TouchableOpacity>
          </View>
          
          {/* Decorative design elements */}
          <View style={styles.circleDecor} />
        </LinearGradient>

        {/* Quick Actions Row */}
        <View style={styles.actionsRow}>
          {[
            { label: 'Send', icon: 'send', color: '#3B82F6' },
            { label: 'Receive', icon: 'qr-code', color: '#10B981' },
            { label: 'Services', icon: 'grid-outline', color: '#8B5CF6' },
            { label: 'Help', icon: 'help-circle-outline', color: '#F43F5E' },
          ].map((action, i) => (
            <TouchableOpacity key={i} style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: action.color + (isDark ? '20' : '15') }]}>
                {action.icon === 'qr-code' ? (
                  <Ionicons name={action.icon} size={24} color={action.color} />
                ) : action.icon === 'send' ? (
                  <Feather name={action.icon} size={22} color={action.color} />
                ) : (
                  <Ionicons name={action.icon} size={24} color={action.color} />
                )}
              </View>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>


        {/* Transactions Section */}
        <View style={[styles.txnSection, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
            <TouchableOpacity><Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text></TouchableOpacity>
          </View>


          {transactions.map((txn) => (
            <TouchableOpacity key={txn.id} style={[styles.txnItem, { borderBottomColor: colors.border }]}>
              <View style={[styles.txnIcon, { backgroundColor: txn.color + '10' }]}>
                {txn.icon.includes('smartphone') ? (
                  <MaterialIcons name={txn.icon} size={22} color={txn.color} />
                ) : (
                  <Ionicons name={txn.icon} size={22} color={txn.color} />
                )}
              </View>
              <View style={styles.txnInfo}>
                <Text style={[styles.txnTitle, { color: colors.textPrimary }]}>{txn.title}</Text>
                <Text style={[styles.txnTime, { color: colors.textSecondary }]}>{txn.time}</Text>
              </View>
              <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? '#10B981' : colors.textPrimary }]}>
                {txn.amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>


        {/* Categories / Services Grid */}
        <View style={styles.servicesSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Campus Services</Text>
          <View style={styles.servicesGrid}>
            {[
              { label: 'Central Canteen', icon: 'fast-food' },
              { label: 'Laundry Pay', icon: 'water' },
              { label: 'ERP Fees', icon: 'school' },
              { label: 'Bus Pass', icon: 'bus' },
            ].map((service, i) => (
              <TouchableOpacity key={i} style={styles.serviceBtn}>
                <LinearGradient 
                  colors={isDark ? [colors.card, colors.background] : ['#FFFFFF', '#F9FAFB']}
                  style={[styles.serviceInner, { borderColor: colors.border, borderWidth: 1 }]}
                >
                  <Ionicons name={service.icon} size={24} color={colors.primary} />
                  <Text style={[styles.serviceLabel, { color: colors.textSecondary }]}>{service.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  moreBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  balanceCard: {
    margin: 20,
    borderRadius: 32,
    padding: 28,
    height: 220,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
  },
  chipLogo: {
    opacity: 0.8,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  cardHolderLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardHolderValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  rechargeBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  rechargeText: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '900',
  },
  circleDecor: {
    position: 'absolute',
    right: -50,
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  txnSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    minHeight: 400,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
  txnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  txnIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txnInfo: {
    flex: 1,
    marginLeft: 16,
  },
  txnTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  txnTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  servicesSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  serviceBtn: {
    width: (width - 64) / 2,
    height: 100,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  serviceInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4B5563',
  },
});

export default MainWalletScreen;
