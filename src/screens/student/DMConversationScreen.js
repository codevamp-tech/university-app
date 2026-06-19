import React, { useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Platform,
} from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Send, Avatar } from 'react-native-gifted-chat';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import { useChatSocket } from '../../hooks/useChatSocket';
import { getDMHistoryAPI } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { useTheme } from '../../hooks/useTheme';

/**
 * DMConversationScreen
 *
 * One-to-one direct message chat.
 * Only accessible when there is an accepted connection between two users.
 *
 * route.params.contact = { user_id, username, avatar_url, status }
 */
const DMConversationScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useUser();
  const { colors, isDark } = useTheme();
  const contact = route.params?.contact || {};

  const {
    connected,
    onlineUsers,
    dmMessages,
    sendDM,
    loadDmHistory,
  } = useChatSocket();

  const isOnline = onlineUsers.includes(contact.user_id);
  const messages = dmMessages[contact.user_id] || [];

  // ── Load DM history ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!contact.user_id) return;
    getDMHistoryAPI(accessToken, contact.user_id).then((history) => {
      if (history?.length) loadDmHistory(contact.user_id, history);
    }).catch(() => {});
  }, [contact.user_id, accessToken]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const onSend = useCallback((msgs = []) => {
    const text = msgs[0]?.text?.trim();
    if (!text || !contact.user_id) return;
    sendDM(contact.user_id, text);
  }, [contact.user_id, sendDM]);

  // ── GiftedChat helpers ────────────────────────────────────────────────────
  const giftedUser = {
    _id: user?.id || 'me',
    name: user?.username || 'You',
    avatar: user?.avatar_url || getAvatarUrl(user?.username || 'me'),
  };

  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: { backgroundColor: colors.primary, borderRadius: 20, borderTopRightRadius: 4 },
        left:  { backgroundColor: isDark ? colors.card : '#F3F4F6', borderRadius: 20, borderTopLeftRadius: 4 },
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
      containerStyle={styles.inputToolbar}
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactInfo}
          onPress={() => navigation.navigate('OtherStudentProfile', {
            student: { name: contact.username, id: contact.user_id, avatar_url: contact.avatar_url }
          })}
        >
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: contact.avatar_url || getAvatarUrl(contact.user_id) }}
              style={styles.avatar}
            />
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#D1D5DB' }]} />
          </View>
          <View>
            <Text style={[styles.contactName, { color: colors.textPrimary }]}>{contact.username || 'Student'}</Text>
            <Text style={[styles.statusText, { color: isOnline ? '#10B981' : colors.textSecondary }]}>
              {isOnline ? '● Online' : '○ Offline'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Connection indicator */}
        <View style={[styles.connDot, { backgroundColor: connected ? '#10B981' : '#EF4444' }]} />
      </View>

      {/* GiftedChat */}
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={giftedUser}
        renderBubble={renderBubble}
        renderInputToolbar={(props) => (
          <InputToolbar
            {...props}
            containerStyle={[styles.inputToolbar, { backgroundColor: colors.card, borderTopColor: colors.border }]}
            primaryStyle={{ alignItems: 'center' }}
          />
        )}
        renderSend={renderSend}
        renderAvatar={renderAvatar}
        alwaysShowSend
        scrollToBottom
        placeholder={`Message ${contact.username || 'student'}...`}
        keyboardShouldPersistTaps="handled"
        bottomOffset={Platform.OS === 'ios' ? insets.bottom : 0}
        messagesContainerStyle={{ paddingBottom: 8 }}
        listViewProps={{ showsVerticalScrollIndicator: false }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  backBtn: { padding: 4 },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  statusDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  contactName: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  statusText: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
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
});

export default DMConversationScreen;
