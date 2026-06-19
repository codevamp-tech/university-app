import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Animated, Pressable, Dimensions, Platform, Alert,
} from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Send, Avatar } from 'react-native-gifted-chat';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { useChatSocket } from '../../hooks/useChatSocket';
import {
  getChatChannelsAPI,
  getChannelHistoryAPI,
  getDMContactsAPI,
} from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.78;

// ── Default channels shown before API loads ──────────────────────────────────
const DEFAULT_CHANNELS = [
  { id: null, name: 'Campus Pulse',    slug: 'campus-pulse',    icon: 'lightning-bolt', desc: 'Daily campus life & vibes 🎓' },
  { id: null, name: 'Career Launchpad',slug: 'career-launchpad', icon: 'rocket-launch',  desc: 'Placements, internships & prep 🚀' },
  { id: null, name: "Maker's Den",     slug: 'makers-den',      icon: 'hammer-wrench',  desc: 'Hackathons & side projects 🛠️' },
];

const ChatScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useUser();
  const { colors, isDark } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [activeChannel, setActiveChannel] = useState(DEFAULT_CHANNELS[0]);
  const [dmContacts, setDmContacts] = useState([]);
  const [inputText, setInputText] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const {
    connected,
    onlineUsers,
    channelMessages,
    sendChannelMessage,
    joinChannel,
    loadChannelHistory,
  } = useChatSocket();

  // ── Fetch channels & DM contacts ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [chs, dms] = await Promise.all([
          getChatChannelsAPI(accessToken),
          getDMContactsAPI(accessToken),
        ]);
        if (chs?.length) setChannels(chs);
        if (dms?.length) setDmContacts(dms);
      } catch (e) {
        // Network error: keep defaults
      }
    };
    if (accessToken) load();
  }, [accessToken]);

  // ── Join channel & load history when active channel changes ───────────────
  useEffect(() => {
    if (!activeChannel?.id) return;
    joinChannel(activeChannel.id);
    getChannelHistoryAPI(accessToken, activeChannel.id).then((history) => {
      if (history?.length) loadChannelHistory(activeChannel.id, history);
    }).catch(() => {});
  }, [activeChannel?.id]);

  // ── Drawer animation ──────────────────────────────────────────────────────
  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setIsDrawerOpen(false));
    } else {
      setIsDrawerOpen(true);
      Animated.timing(slideAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  };

  const drawerTranslateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-DRAWER_WIDTH, 0] });
  const overlayOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  // ── Send message ──────────────────────────────────────────────────────────
  const onSend = useCallback((msgs = []) => {
    const text = msgs[0]?.text?.trim();
    if (!text || !activeChannel?.id) return;
    const sent = sendChannelMessage(activeChannel.id, text);
    if (!sent) Alert.alert('Not connected', 'Reconnecting to server...');
  }, [activeChannel, sendChannelMessage]);

  // Current channel messages from socket
  const messages = (activeChannel?.id ? channelMessages[activeChannel.id] : []) || [];

  // GiftedChat user object
  const giftedUser = {
    _id: user?.id || 'me',
    name: user?.username || 'You',
    avatar: user?.avatar_url || getAvatarUrl(user?.username || 'me'),
  };

  // ── Renders ───────────────────────────────────────────────────────────────
  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: { backgroundColor: colors.primary, borderRadius: 18, borderTopRightRadius: 4 },
        left:  { backgroundColor: isDark ? colors.card : '#F3F4F6', borderRadius: 18, borderTopLeftRadius: 4 },
      }}
      textStyle={{
        right: { color: '#FFFFFF', fontSize: 15, lineHeight: 22 },
        left:  { color: colors.textPrimary, fontSize: 15, lineHeight: 22 },
      }}
    />
  );

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={[styles.inputToolbar, { backgroundColor: colors.card, borderTopColor: colors.border }]}
      primaryStyle={{ alignItems: 'center' }}
    />
  );

  const renderSend = (props) => (
    <Send {...props} containerStyle={styles.sendContainer}>
      <View style={[styles.sendBtn, { backgroundColor: colors.primary }]}>
        <MaterialIcons name="send" size={18} color="#FFFFFF" />
      </View>
    </Send>
  );

  const renderAvatar = (props) => (
    <Avatar
      {...props}
      imageStyle={{ left: { width: 36, height: 36, borderRadius: 18 } }}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* ── Main Content ── */}
      <Animated.View style={[styles.mainContent]}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 6 }}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn} onPress={toggleDrawer}>
              <Ionicons name="menu" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerLogo, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} Channels</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Connection status dot */}
            <View style={[styles.connDot, { backgroundColor: connected ? '#10B981' : '#EF4444' }]} />
            <TouchableOpacity onPress={() => navigation.navigate('StudentSearch')}>
              <Ionicons name="search" size={24} color={colors.textMuted || "#6B7280"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Channel Bar */}
        <View style={[styles.activeChannelBar, { backgroundColor: isDark ? colors.background : '#FAFAFA', borderBottomColor: colors.border }]}>
          <MaterialCommunityIcons
            name={activeChannel?.icon || 'lightning-bolt'}
            size={20}
            color={colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.activeChannelName, { color: colors.textPrimary }]}>{activeChannel?.name || 'Campus Pulse'}</Text>
            <Text style={styles.activeChannelDesc} numberOfLines={1}>{activeChannel?.desc || ''}</Text>
          </View>
          <Text style={{ fontSize: 12, color: onlineUsers.length > 0 ? '#10B981' : (colors.textMuted || '#9CA3AF'), fontWeight: '700' }}>
            {onlineUsers.length} online
          </Text>
        </View>

        {/* GiftedChat */}
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={giftedUser}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderSend={renderSend}
          renderAvatar={renderAvatar}
          alwaysShowSend
          scrollToBottom
          scrollToBottomStyle={styles.scrollToBottom}
          placeholder={`Message #${activeChannel?.slug || 'campus-pulse'}`}
          keyboardShouldPersistTaps="handled"
          bottomOffset={Platform.OS === 'ios' ? insets.bottom : 0}
          messagesContainerStyle={{ paddingBottom: 8 }}
          listViewProps={{ showsVerticalScrollIndicator: false }}
        />
      </Animated.View>

      {/* ── Backdrop Overlay ── */}
      {isDrawerOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={{ flex: 1 }} onPress={toggleDrawer} />
        </Animated.View>
      )}

      {/* ── Side Drawer ── */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }], backgroundColor: colors.card }]}>
        <View style={[styles.drawerHeader, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
          <LinearGradient colors={isDark ? [colors.primary, '#6D28D9'] : ['#EA580C', '#9A3412']} style={styles.drawerLogoIcon}>
            <MaterialCommunityIcons name="school" size={24} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={[styles.drawerBrand, { color: colors.textPrimary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME}</Text>
            <Text style={styles.drawerSubBrand}>Community Hub</Text>
          </View>
        </View>

        <Animated.ScrollView style={styles.drawerList} showsVerticalScrollIndicator={false}>
          {/* AI Section */}
          <Text style={styles.drawerSectionTitle}>AI ASSISTANT</Text>
          <TouchableOpacity
            style={[styles.channelItem, { backgroundColor: isDark ? 'rgba(234,88,12,0.1)' : '#FFF7ED', borderColor: colors.primary, borderWidth: 1 }]}
            onPress={() => { toggleDrawer(); navigation.navigate('CampusAIWelcome'); }}
          >
            <MaterialIcons name="smart-toy" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.channelItemText, { color: colors.primary }]}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} AI Assistant</Text>
              <Text style={styles.channelItemDesc}>Ask me anything 🤖</Text>
            </View>
            <View style={[styles.newBadge, { backgroundColor: colors.primary }]}><Text style={styles.newBadgeText}>AI</Text></View>
          </TouchableOpacity>

          <View style={[styles.drawerDivider, { backgroundColor: colors.border }]} />

          {/* Channels */}
          <Text style={styles.drawerSectionTitle}>CHANNELS</Text>
          {channels.map((channel) => {
            const isActive = activeChannel?.slug === channel.slug || activeChannel?.id === channel.id;
            return (
              <TouchableOpacity
                key={channel.id || channel.slug}
                style={[styles.channelItem, isActive && { backgroundColor: isDark ? 'rgba(234,88,12,0.1)' : '#FFF7ED' }]}
                onPress={() => { setActiveChannel(channel); toggleDrawer(); }}
              >
                <MaterialCommunityIcons
                  name={channel.icon || 'hashtag'}
                  size={20}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.channelItemText, { color: isActive ? colors.primary : colors.textSecondary }]}>
                    {channel.name}
                  </Text>
                  <Text style={styles.channelItemDesc} numberOfLines={1}>{channel.desc || channel.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={[styles.drawerDivider, { backgroundColor: colors.border }]} />

          {/* Direct Messages */}
          <Text style={styles.drawerSectionTitle}>DIRECT MESSAGES</Text>
          {dmContacts.length === 0 && (
            <Text style={{ fontSize: 13, color: '#9CA3AF', paddingHorizontal: 12, paddingBottom: 8 }}>
              Connect with students to start DMing 👋
            </Text>
          )}
          {dmContacts.map((dm) => {
            const isOnline = onlineUsers.includes(dm.user_id);
            return (
              <TouchableOpacity
                key={dm.user_id}
                style={styles.dmItem}
                onPress={() => {
                  toggleDrawer();
                  navigation.navigate('DMConversation', { contact: dm });
                }}
              >
                <View style={styles.dmAvatarWrap}>
                  <Image source={{ uri: dm.avatar_url || getAvatarUrl(dm.user_id) }} style={styles.dmAvatar} />
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#D1D5DB' }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dmName, { color: colors.textPrimary }]}>{dm.username || 'Student'}</Text>
                  {dm.last_message && (
                    <Text style={styles.dmLastMsg} numberOfLines={1}>{dm.last_message}</Text>
                  )}
                </View>
                <Text style={{ fontSize: 10, color: isOnline ? '#10B981' : '#9CA3AF', fontWeight: '700' }}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.ScrollView>

        <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.footerAction} onPress={() => { toggleDrawer(); navigation.navigate('Settings'); }}>
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerAction} onPress={() => { toggleDrawer(); navigation.navigate('Notifications'); }}>
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Notifications</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  mainContent: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuBtn: { padding: 4 },
  headerLogo: { fontSize: 18, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  activeChannelBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  activeChannelName: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  activeChannelDesc: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 1 },
  inputToolbar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: 24,
    marginHorizontal: 8,
    marginBottom: 4,
  },
  sendContainer: { justifyContent: 'center', alignItems: 'center', paddingRight: 4 },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EA580C',
    justifyContent: 'center', alignItems: 'center',
  },
  scrollToBottom: { backgroundColor: '#EA580C', borderRadius: 20 },
  overlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99,
  },
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: DRAWER_WIDTH, backgroundColor: '#FFFFFF',
    zIndex: 100, shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 12,
  },
  drawerHeader: {
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  drawerLogoIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  drawerBrand: { fontSize: 20, fontWeight: '900', color: '#111827' },
  drawerSubBrand: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  drawerList: { flex: 1, padding: 16 },
  drawerSectionTitle: {
    fontSize: 10, fontWeight: '900', color: '#9CA3AF',
    letterSpacing: 1.5, marginBottom: 12, marginTop: 8,
  },
  channelItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 4, gap: 12,
  },
  channelItemActive: { backgroundColor: '#FFF7ED' },
  channelItemText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  channelItemTextActive: { color: '#EA580C' },
  channelItemDesc: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  drawerDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  dmItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 8, gap: 12, marginBottom: 4,
  },
  dmAvatarWrap: { position: 'relative' },
  dmAvatar: { width: 40, height: 40, borderRadius: 20 },
  statusDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  dmName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  dmLastMsg: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  drawerFooter: {
    padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6',
    flexDirection: 'row', justifyContent: 'space-around',
  },
  footerAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  newBadge: { backgroundColor: '#EA580C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  newBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
});

export default ChatScreen;
