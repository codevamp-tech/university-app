import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, Dimensions, Animated, Pressable
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

const ChatScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState('General');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setIsDrawerOpen(false));
    } else {
      setIsDrawerOpen(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  };

  const drawerTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const contentTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0], // Content stays put, drawer overlays
  });

  const overlayOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const CHANNELS = [
    { id: '1', name: 'General', icon: 'hashtag' },
    { id: '2', name: 'Hackathon-2024', icon: 'code-braces' },
    { id: '3', name: 'Venture-Lab', icon: 'rocket-launch' },
    { id: '4', name: 'Placement-Prep', icon: 'briefcase' },
    { id: '5', name: 'Campus-Vibes', icon: 'party-popper' },
  ];

  const DIRECT_MESSAGES = [
    { id: '1', name: 'Ishaan Reddy', status: 'online', avatar: 'https://i.pravatar.cc/150?u=ishaan' },
    { id: '2', name: 'Ananya Singh', status: 'away', avatar: 'https://i.pravatar.cc/150?u=ananya' },
    { id: '3', name: 'Kabir Malik', status: 'online', avatar: 'https://i.pravatar.cc/150?u=kabir' },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        
        {/* Main Content Area */}
        <Animated.View style={[styles.mainContent, { transform: [{ translateX: contentTranslateX }] }]}>
          {/* Main Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.menuBtn} onPress={toggleDrawer}>
                <Ionicons name="menu" size={28} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.headerLogo}>Invertis Channels</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => navigation.navigate('StudentSearch')}>
                <Ionicons name="search" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
                style={styles.avatarTiny}
              />
            </View>
          </View>

          {/* Active Channel Label */}
          <View style={styles.activeChannelBar}>
            <MaterialCommunityIcons name="hashtag" size={20} color="#EA580C" />
            <Text style={styles.activeChannelName}>{activeChannel}</Text>
          </View>

          {/* Chat Area */}
          <ScrollView contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
            {/* Message 1 */}
            <View style={styles.messageWrap}>
              <Image source={{ uri: 'https://i.pravatar.cc/150?u=ishaan' }} style={styles.msgAvatar} />
              <View style={styles.msgContent}>
                <View style={styles.msgHeader}>
                  <Text style={styles.msgAuthor}>Ishaan Reddy</Text>
                  <Text style={styles.msgTime}>10:45 AM</Text>
                </View>
                <View style={[styles.bubbleLeft, styles.bubble]}>
                  <Text style={styles.msgText}>Hey everyone! Has anyone checked the new schedule for the Innovation Lab workshop? I heard they've added some cool AI modules.</Text>
                </View>
              </View>
            </View>

            {/* Message 2 */}
            <View style={[styles.messageWrap, { justifyContent: 'flex-end' }]}>
              <View style={[styles.msgContent, { alignItems: 'flex-end', marginLeft: 0, marginRight: 12 }]}>
                <View style={[styles.msgHeader, { justifyContent: 'flex-end' }]}>
                  <Text style={styles.msgTime}>10:48 AM</Text>
                  <Text style={[styles.msgAuthor, { marginLeft: 8, marginRight: 0, color: '#EA580C' }]}>Ananya</Text>
                </View>
                <View style={[styles.bubbleRight, styles.bubble]}>
                  <Text style={styles.msgTextRight}>Yes Ishaan! Just saw the mail. It starts this Friday. We should definitely go together. 🚀</Text>
                </View>
              </View>
              <Image source={{ uri: 'https://i.pravatar.cc/150?u=ananya' }} style={styles.msgAvatar} />
            </View>

            {/* Date Divider */}
            <View style={styles.dateDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dateText}>YESTERDAY</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Message 3 */}
            <View style={styles.messageWrap}>
              <Image source={{ uri: 'https://i.pravatar.cc/150?u=kabir' }} style={styles.msgAvatar} />
              <View style={styles.msgContent}>
                <View style={styles.msgHeader}>
                  <Text style={styles.msgAuthor}>Kabir Malik</Text>
                  <Text style={styles.msgTime}>02:15 PM</Text>
                </View>
                <View style={[styles.bubbleLeft, styles.bubble]}>
                  <Text style={styles.msgText}>Guys, don't forget the library is closing early today for maintenance. Return your books before 4 PM!</Text>
                  <View style={styles.noticeCard}>
                    <View style={styles.noticeIcon}>
                      <Ionicons name="notifications" size={18} color="#EA580C" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.noticeTitle}>Campus Notice #402</Text>
                      <Text style={styles.noticeDesc}>Library maintenance at 4 PM.</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputArea}>
            <TouchableOpacity style={styles.attachBtn}>
              <Ionicons name="add" size={24} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder={`Message #${activeChannel}`}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.emojiBtn}>
                <Ionicons name="happy-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.sendBtn}>
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Backdrop Overlay */}
        {isDrawerOpen && (
          <Animated.View 
            style={[styles.overlay, { opacity: overlayOpacity }]}
          >
            <Pressable style={{ flex: 1 }} onPress={toggleDrawer} />
          </Animated.View>
        )}

        {/* Side Drawer */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }] }]}>
          <View style={[styles.drawerHeader, { paddingTop: insets.top + 20 }]}>
            <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.drawerLogoIcon}>
              <MaterialCommunityIcons name="school" size={24} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text style={styles.drawerBrand}>Invertis</Text>
              <Text style={styles.drawerSubBrand}>University Community</Text>
            </View>
          </View>

          <ScrollView style={styles.drawerList} showsVerticalScrollIndicator={false}>
            <Text style={styles.drawerSectionTitle}>CHANNELS</Text>
            {CHANNELS.map((channel) => (
              <TouchableOpacity 
                key={channel.id} 
                style={[styles.channelItem, activeChannel === channel.name && styles.channelItemActive]}
                onPress={() => {
                  setActiveChannel(channel.name);
                  toggleDrawer();
                }}
              >
                <MaterialCommunityIcons 
                  name={channel.icon} 
                  size={20} 
                  color={activeChannel === channel.name ? '#EA580C' : '#6B7280'} 
                />
                <Text style={[styles.channelItemText, activeChannel === channel.name && styles.channelItemTextActive]}>
                  {channel.name}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.drawerDivider} />

            <Text style={styles.drawerSectionTitle}>DIRECT MESSAGES</Text>
            {DIRECT_MESSAGES.map((dm) => (
              <TouchableOpacity key={dm.id} style={styles.dmItem}>
                <View style={styles.dmAvatarWrap}>
                  <Image source={{ uri: dm.avatar }} style={styles.dmAvatar} />
                  <View style={[styles.statusDot, { backgroundColor: dm.status === 'online' ? '#10B981' : '#F59E0B' }]} />
                </View>
                <Text style={styles.dmName}>{dm.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.drawerFooter}>
            <TouchableOpacity style={styles.footerAction}>
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
              <Text style={styles.footerText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerAction}>
              <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
              <Text style={styles.footerText}>Help</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    padding: 4,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarTiny: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  activeChannelBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  activeChannelName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  chatScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  messageWrap: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  msgAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  msgContent: {
    flex: 1,
    marginLeft: 12,
    maxWidth: '80%',
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  msgAuthor: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginRight: 8,
  },
  msgTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  bubble: {
    padding: 14,
    borderRadius: 20,
  },
  bubbleLeft: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: '#EA580C',
    borderTopRightRadius: 4,
  },
  msgText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  msgTextRight: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noticeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  noticeDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  dateText: {
    marginHorizontal: 16,
    fontSize: 10,
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  emojiBtn: {
    padding: 4,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerLogoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerBrand: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  drawerSubBrand: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  drawerList: {
    flex: 1,
    padding: 20,
  },
  drawerSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginTop: 12,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  channelItemActive: {
    backgroundColor: '#FFF7ED',
  },
  channelItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  channelItemTextActive: {
    color: '#EA580C',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  },
  dmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 12,
  },
  dmAvatarWrap: {
    position: 'relative',
  },
  dmAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dmName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
});

export default ChatScreen;
