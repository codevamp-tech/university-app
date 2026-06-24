import React, { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Platform, Alert,
  KeyboardAvoidingView, TextInput, FlatList, Keyboard,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import { useChatSocketContext } from '../../context/ChatSocketContext';
import { getDMHistoryAPI } from '../../data/apiService';
import { getAvatarUrl } from '../../utils/avatar';
import { useTheme } from '../../hooks/useTheme';
import { fetchStudentsFromSheet } from '../../data/googleSheetsService';

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
  const dmSource = route.params?.source || 'social'; // 'marketplace' | 'social'
  const [text, setText] = React.useState('');
  const [contactName, setContactName] = React.useState(contact.username || 'Student');

  useEffect(() => {
    let isMounted = true;
    if (contact.username) {
      const isRollNo = /^\d+$/.test(contact.username.trim());
      if (isRollNo) {
        fetchStudentsFromSheet().then((students) => {
          if (!isMounted) return;
          const match = students.find(s => s.id.toLowerCase() === contact.username.toLowerCase());
          if (match) {
            setContactName(match.name);
          }
        }).catch(() => {});
      } else {
        setContactName(contact.username);
      }
    }
    return () => { isMounted = false; };
  }, [contact.username]);

  const {
    connected,
    onlineUsers,
    dmMessages,
    sendDM,
    loadDmHistory,
    lastError,
    clearError,
  } = useChatSocketContext();

  const isOnline = onlineUsers.includes(contact.user_id);
  const messages = dmMessages[contact.user_id] || [];

  // ── Load DM history ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!contact.user_id) return;
    getDMHistoryAPI(accessToken, contact.user_id, 50, dmSource).then((history) => {
      if (history?.length) loadDmHistory(contact.user_id, history);
    }).catch(() => {});
  }, [contact.user_id, accessToken]);

  const flatListRef = useRef(null);

  // ── Show server errors (e.g. DM permission denied) ───────────────────────────
  useEffect(() => {
    if (lastError) {
      Alert.alert('Message Failed', lastError + '\n\nYou may need to connect with this user first.');
      clearError();
    }
  }, [lastError]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !contact.user_id) return;
    sendDM(contact.user_id, trimmed, {
      id: user?.id,
      username: user?.username,
      avatar_url: user?.avatar_url,
    }, dmSource);
    setText('');
  }, [text, contact.user_id, sendDM, user, dmSource]);

  // ── Scroll to bottom when messages change ─────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
    }
  }, [messages.length]);

  const renderMessage = ({ item }) => {
    const isMe = item.user?._id === user?.user_id || 
                 item.user?._id === user?.id || 
                 item.user?.user_id === user?.user_id || 
                 item.user?.user_id === user?.id;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMe && (
          <Image
            source={{ uri: getAvatarUrl(item.user?.avatar || contact.user_id) }}
            style={styles.msgAvatar}
          />
        )}
        <View style={[
          styles.bubble,
          isMe
            ? [styles.bubbleRight, { backgroundColor: colors.primary }]
            : [styles.bubbleLeft, { backgroundColor: isDark ? colors.card : '#F3F4F6' }]
        ]}>
          <Text style={[styles.bubbleText, { color: isMe ? '#FFFFFF' : colors.textPrimary }]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>
            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
      {/* Header */}
      <View style={{ paddingTop: insets.top, backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
        <View style={styles.header}>
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
                source={{ uri: getAvatarUrl(contact.avatar_url || contact.user_id) }}
                style={styles.avatar}
              />
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#D1D5DB' }]} />
            </View>
            <View>
              <Text style={[styles.contactName, { color: colors.textPrimary }]}>{contactName || 'Student'}</Text>
              <Text style={[styles.statusText, { color: isOnline ? '#10B981' : colors.textSecondary }]}>
                {isOnline ? '● Online' : '○ Offline'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.connDot, { backgroundColor: connected ? '#10B981' : '#EF4444' }]} />
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id?.toString() || item.id?.toString() || Math.random().toString()}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start your conversation with {contactName || 'this student'} 👋
            </Text>
          </View>
        }
      />

      {/* Input Bar */}
      <View style={[
        styles.inputBar,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
        }
      ]}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: isDark ? colors.background : '#F3F4F6',
              color: colors.textPrimary,
            }
          ]}
          value={text}
          onChangeText={setText}
          placeholder={`Message ${contactName || 'student'}...`}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
          returnKeyType="default"
          blurOnSubmit={false}
          autoCorrect={true}
          autoCapitalize="sentences"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: text.trim() ? colors.primary : (isDark ? '#374151' : '#E5E7EB') }
          ]}
          onPress={handleSend}
          disabled={!text.trim()}
          activeOpacity={0.8}
        >
          <MaterialIcons name="send" size={20} color={text.trim() ? '#FFFFFF' : (isDark ? '#6B7280' : '#9CA3AF')} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  // Messages
  msgRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    maxWidth: '80%',
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
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  // Input
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
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DMConversationScreen;
