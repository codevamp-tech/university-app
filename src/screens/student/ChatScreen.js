import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Animated, Pressable, Dimensions, Platform, Alert,
  FlatList, TextInput, KeyboardAvoidingView, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../config/appConfig';
import { useUser } from '../../context/UserContext';
import { useChatSocketContext } from '../../context/ChatSocketContext';
import {
  getChatChannelsAPI,
  getChannelHistoryAPI,
  getDMContactsAPI,
  getFacultyGroupChats,
  sendPortalChatMessage,
} from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.78;

const PORTAL_SUBJECTS = [
  { id: 'Physiology-BinduGarg', name: 'Physiology', subcode: 'PY', department: 'PHYSIOLOGY', facultyId: '202314130', facultyName: 'BINDU GARG' },
  { id: 'Physiology-KranthiKumar', name: 'Physiology (Lab/Clinical)', subcode: 'PY', department: 'PHYSIOLOGY', facultyId: 'D/11/093', facultyName: 'KRANTHI KUMAR GARIKAPATI' },
  { id: 'Anatomy-AnandKumar', name: 'Anatomy', subcode: 'AN', department: 'ANATOMY', facultyId: 'D/11/094', facultyName: 'ANAND KUMAR' },
  { id: 'Biochemistry-ShaliniGupta', name: 'Biochemistry', subcode: 'BI', department: 'BIOCHEMISTRY', facultyId: 'D/11/095', facultyName: 'SHALINI GUPTA' }
];

// ── Default channels shown before API loads ──────────────────────────────────
const DEFAULT_CHANNELS = [
  { id: 'official-batch-chat', name: 'Official Batch Chat', slug: 'official-batch-chat', icon: 'chat-outline', desc: 'Sync of ERP Official Batch Chat 🏛️' },
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
  const [portalMessages, setPortalMessages] = useState([]);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [sendingPortalMessage, setSendingPortalMessage] = useState(false);
  const [activePortalSubject, setActivePortalSubject] = useState(PORTAL_SUBJECTS[0]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const {
    connected,
    onlineUsers,
    channelMessages,
    sendChannelMessage,
    joinChannel,
    loadChannelHistory,
    lastError,
    clearError,
  } = useChatSocketContext();

  // ── Fetch channels & DM contacts ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [chs, dms] = await Promise.all([
          getChatChannelsAPI(accessToken),
          getDMContactsAPI(accessToken),
        ]);
        if (chs?.length) {
          const merged = [
            { id: 'official-batch-chat', name: 'Official Batch Chat', slug: 'official-batch-chat', icon: 'chat-outline', desc: 'Sync of ERP Official Batch Chat 🏛️' },
            ...chs
          ];
          setChannels(merged);
          // Auto-switch activeChannel to the real channel matching the current slug
          // (default channels have id: null, so we upgrade to the real API channel)
          setActiveChannel(prev => {
            if (prev?.id) return prev; // already has a real ID
            const matchBySlug = chs.find(c => c.slug === prev?.slug);
            return matchBySlug || chs[0];
          });
        }
        if (dms?.length) {
          const enrichedDms = dms.map(dm => ({
            ...dm,
            username: dm.full_name || dm.username,
          }));
          setDmContacts(enrichedDms);
        }
      } catch (e) {
        console.warn('[ChatScreen] load error', e);
      }
    };
    if (accessToken) load();
  }, [accessToken]);

  // ── Join channel & load history when active channel changes ───────────────
  useEffect(() => {
    if (!activeChannel?.id) return;
    if (activeChannel.id === 'official-batch-chat') return; // Bypass WebSocket for portal chat
    joinChannel(activeChannel.id);
    getChannelHistoryAPI(accessToken, activeChannel.id).then((history) => {
      if (history?.length) loadChannelHistory(activeChannel.id, history);
    }).catch(() => {});
  }, [activeChannel?.id]);

  // ── Load legacy portal messages ───────────────────────────────────────────
  const loadPortalMessages = useCallback(async (clearFirst = false) => {
    if (!accessToken || activeChannel?.id !== 'official-batch-chat') {
      console.log('[ChatScreen] loadPortalMessages skipped. activeChannel.id:', activeChannel?.id);
      return;
    }
    if (clearFirst) {
      setPortalMessages([]);
    }
    setLoadingPortal(true);
    try {
      const batchYear = user?.batch_year || user?.batch || '2025';
      console.log('[ChatScreen] Fetching chats for batch:', batchYear, 'subject:', activePortalSubject.name, 'facultyId:', activePortalSubject.facultyId);
      let history = await getFacultyGroupChats(
        activePortalSubject.facultyId,
        String(batchYear),
        '1', // phase
        '1'  // subphase
      );
      console.log('[ChatScreen] Received portal history length:', history?.length);
      // Real production behavior: load only messages of the logged-in student's batch
      const mappedHistory = (history || [])
        .map(msg => {
          const isMeUser = user?.role === 'teacher'
            ? msg.classlabel === 'left'
            : msg.classlabel !== 'left';
          return {
            ...msg,
            isMe: isMeUser
          };
        })
        .filter(msg => {
          return String(msg.subcode || 'PY').trim().toUpperCase() === String(activePortalSubject.subcode).trim().toUpperCase();
        });
      console.log('[ChatScreen] Mapped and filtered history length:', mappedHistory.length);
      setPortalMessages([...mappedHistory].reverse());
    } catch (e) {
      console.warn('[ChatScreen] error loading portal messages:', e);
    } finally {
      setLoadingPortal(false);
    }
  }, [accessToken, activeChannel, activePortalSubject, user]);

  useEffect(() => {
    if (activeChannel?.id === 'official-batch-chat') {
      loadPortalMessages(true);
    }
  }, [activeChannel?.id, activePortalSubject, loadPortalMessages]);

  useEffect(() => {
    if (activeChannel?.id !== 'official-batch-chat') return;
    const interval = setInterval(() => {
      loadPortalMessages(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeChannel?.id, activePortalSubject, loadPortalMessages]);

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

  const flatListRef = useRef(null);

  // ── Show server errors ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (lastError) {
      Alert.alert('Message Failed', lastError);
      clearError();
    }
  }, [lastError]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const textVal = inputText.trim();
    if (!textVal || !activeChannel?.id) return;

    if (activeChannel.id === 'official-batch-chat') {
      setSendingPortalMessage(true);
      try {
        const batchYear = user?.batch_year || user?.batch || '2025';
        const colgcd = user?.emp_id ? (user.emp_id.split('/')[1] || '11') : '11';
        const isFaculty = user?.role === 'teacher';

        const formatCrtDt = (date) => {
          const pad = (n) => String(n).padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };

        const payload = {
          chatid: 0,
          ChatFacId: activePortalSubject.facultyId,
          FacultyName: activePortalSubject.facultyName,
          ChatStudId: String(batchYear),
          StudentName: isFaculty ? String(batchYear) : (user?.name || user?.id || 'Student'),
          Chat_Desc: textVal,
          classlabel: isFaculty ? 'left' : 'right',
          Crt_dt: formatCrtDt(new Date()),
          colgcd: colgcd,
          course_cd: '1',
          cbme: String(parseInt(batchYear) - 1),
          batch: String(batchYear),
          phase: '1',
          sub_phase: '1',
          sub_phase_part: '1',
          department: activePortalSubject.department,
          attachfile: '',
          subcode: activePortalSubject.subcode,
          msgflg: 0
        };

        const res = await sendPortalChatMessage(payload);
        if (res && res.Mess === 'Success') {
          setInputText('');
          loadPortalMessages();
        } else {
          Alert.alert('Send Failed', res?.Mess || 'An error occurred while sending message to portal.');
        }
      } catch (err) {
        Alert.alert('Send Failed', 'Failed to connect to the portal server.');
      } finally {
        setSendingPortalMessage(false);
      }
      return;
    }

    sendChannelMessage(activeChannel.id, textVal, {
      id: user?.id,
      name: user?.name,
      username: user?.username,
      avatar_url: user?.avatar_url,
    });
    setInputText('');
  }, [inputText, activeChannel, sendChannelMessage, user, activePortalSubject, loadPortalMessages]);

  // Current channel messages from socket or REST
  const messages = activeChannel?.id === 'official-batch-chat'
    ? portalMessages
    : (activeChannel?.id ? channelMessages[activeChannel.id] : []) || [];

  const socialDMs = dmContacts.filter(dm => !dm.is_marketplace);
  const marketplaceDMs = dmContacts.filter(dm => dm.is_marketplace);

  // Scroll to latest when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
    }
  }, [messages.length]);

  const renderMessage = ({ item }) => {
    let isMe, senderName, messageText, timeText, avatarSource;

    if (activeChannel?.id === 'official-batch-chat') {
      isMe = item.isMe;
      senderName = item.sender || 'Portal User';
      messageText = item.text || '';
      timeText = item.timestamp || '';
      avatarSource = { uri: getAvatarUrl(item.ChatFacId || item.StudentName || 'u') };
    } else {
      isMe = item.user?._id === user?.user_id || 
             item.user?._id === user?.id || 
             item.user?.user_id === user?.user_id || 
             item.user?.user_id === user?.id;
      senderName = item.user?.name || 'Student';
      messageText = item.text || '';
      timeText = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      avatarSource = { uri: getAvatarUrl(item.user?.avatar || item.user?._id || 'u') };
    }

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMe && (
          <Image
            source={avatarSource}
            style={styles.msgAvatar}
          />
        )}
        <View style={[
          styles.bubble,
          isMe
            ? [styles.bubbleRight, { backgroundColor: colors.primary }]
            : [styles.bubbleLeft, { backgroundColor: isDark ? colors.card : '#F3F4F6' }]
        ]}>
          {!isMe && (
            <Text style={[styles.bubbleSender, { color: colors.primary }]}>
              {senderName} {activeChannel?.id === 'official-batch-chat' && item.department ? `(${item.department})` : ''}
            </Text>
          )}
          <Text style={[styles.bubbleText, { color: isMe ? '#FFFFFF' : colors.textPrimary }]}>{messageText}</Text>
          {item.attachment ? (
            <TouchableOpacity style={styles.attachmentButton} activeOpacity={0.8}>
              <Ionicons name="document-attach-outline" size={16} color={isMe ? '#FFF' : colors.primary} />
              <Text style={{ color: isMe ? '#FFF' : colors.primary, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                {item.attachment.split('/').pop() || 'Attachment'}
              </Text>
            </TouchableOpacity>
          ) : null}
          <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>
            {timeText}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={{ paddingTop: insets.top, backgroundColor: colors.background }}>
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
            <View style={[styles.connDot, { backgroundColor: connected ? '#10B981' : '#EF4444' }]} />
            <TouchableOpacity onPress={() => navigation.navigate('StudentSearch')}>
              <Ionicons name="search" size={24} color={colors.textMuted || "#6B7280"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Channel Bar */}
        <View style={[styles.activeChannelBar, { backgroundColor: isDark ? colors.background : '#FAFAFA', borderBottomColor: colors.border }]}>
          <MaterialCommunityIcons name={activeChannel?.icon || 'lightning-bolt'} size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.activeChannelName, { color: colors.textPrimary }]}>{activeChannel?.name || 'Campus Pulse'}</Text>
            <Text style={styles.activeChannelDesc} numberOfLines={1}>{activeChannel?.desc || ''}</Text>
          </View>
          <Text style={{ fontSize: 12, color: onlineUsers.length > 0 ? '#10B981' : (colors.textMuted || '#9CA3AF'), fontWeight: '700' }}>
            {onlineUsers.length} online
          </Text>
        </View>

        {activeChannel?.id === 'official-batch-chat' && (
          <View style={[styles.subjectSelector, { borderBottomColor: colors.border, backgroundColor: isDark ? colors.card : '#F3F4F6' }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectScrollContent}>
              {PORTAL_SUBJECTS.map((sub) => {
                const isSel = activePortalSubject.id === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.subjectPill,
                      { backgroundColor: isSel ? colors.primary : (isDark ? '#1F2937' : '#FFFFFF'), borderColor: isSel ? colors.primary : colors.border }
                    ]}
                    onPress={() => setActivePortalSubject(sub)}
                  >
                    <Text style={[styles.subjectPillText, { color: isSel ? '#FFFFFF' : colors.textPrimary }]}>
                      {sub.name} ({sub.subcode})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Messages */}
      {activeChannel?.id === 'official-batch-chat' && loadingPortal && portalMessages.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>Fetching portal messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => (item.id || item._id || Math.random()).toString()}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>No messages yet. Say hi! 👋</Text>
            </View>
          }
        />
      )}

      {/* Input Bar */}
      <View style={[
        styles.inputBar,
        { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }
      ]}>
        <TextInput
          style={[
            styles.textInput,
            { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.textPrimary }
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={activeChannel?.id === 'official-batch-chat' ? `Message Dr. ${activePortalSubject.facultyName.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}...` : `Message #${activeChannel?.slug || 'campus-pulse'}`}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
          returnKeyType="default"
          blurOnSubmit={false}
          autoCorrect={true}
          autoCapitalize="sentences"
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: (inputText.trim() && !sendingPortalMessage) ? colors.primary : (isDark ? '#374151' : '#E5E7EB') }]}
          onPress={handleSend}
          disabled={!inputText.trim() || sendingPortalMessage}
          activeOpacity={0.8}
        >
          {sendingPortalMessage ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="send" size={20} color={inputText.trim() ? '#FFFFFF' : (isDark ? '#6B7280' : '#9CA3AF')} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Backdrop Overlay ── */}
      {isDrawerOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={{ flex: 1 }} onPress={toggleDrawer} />
        </Animated.View>
      )}

      {/* ── Side Drawer ── */}
      <Animated.View
        pointerEvents={isDrawerOpen ? 'auto' : 'none'}
        style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }], backgroundColor: colors.card }]}>
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
          {socialDMs.length === 0 && (
            <Text style={{ fontSize: 13, color: '#9CA3AF', paddingHorizontal: 12, paddingBottom: 8 }}>
              Connect with students to start DMing 👋
            </Text>
          )}
          {socialDMs.map((dm) => {
            const isOnline = onlineUsers.includes(dm.user_id);
            return (
              <TouchableOpacity
                key={dm.user_id}
                style={styles.dmItem}
                onPress={() => {
                  toggleDrawer();
                  navigation.navigate('DMConversation', { contact: dm, source: 'social' });
                }}
              >
                <View style={styles.dmAvatarWrap}>
                  <Image source={{ uri: getAvatarUrl(dm.avatar_url || dm.user_id) }} style={styles.dmAvatar} />
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

          <View style={[styles.drawerDivider, { backgroundColor: colors.border }]} />

          {/* Marketplace Messages */}
          <Text style={styles.drawerSectionTitle}>MARKETPLACE MESSAGES</Text>
          {marketplaceDMs.length === 0 && (
            <Text style={{ fontSize: 13, color: '#9CA3AF', paddingHorizontal: 12, paddingBottom: 8 }}>
              No marketplace messages yet 🛒
            </Text>
          )}
          {marketplaceDMs.map((dm) => {
            const isOnline = onlineUsers.includes(dm.user_id);
            return (
              <TouchableOpacity
                key={dm.user_id}
                style={styles.dmItem}
                onPress={() => {
                  toggleDrawer();
                  navigation.navigate('DMConversation', { contact: dm, source: 'marketplace' });
                }}
              >
                <View style={styles.dmAvatarWrap}>
                  <Image source={{ uri: getAvatarUrl(dm.avatar_url || dm.user_id) }} style={styles.dmAvatar} />
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 15,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Messages
  msgRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    maxWidth: '82%',
  },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 6 },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '100%',
  },
  bubbleLeft: { borderTopLeftRadius: 4 },
  bubbleRight: { borderTopRightRadius: 4 },
  bubbleSender: { fontSize: 11, fontWeight: '700', marginBottom: 3 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
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
  subjectSelector: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  subjectScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
  },
  subjectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  subjectPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
});

export default ChatScreen;
