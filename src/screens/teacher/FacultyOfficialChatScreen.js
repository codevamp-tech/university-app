import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { getFacultyBatches, getFacultyGroupChats } from '../../data/apiService';

const { width } = Dimensions.get('window');

const FacultyOfficialChatScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingChats, setLoadingChats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);

  const flatListRef = useRef(null);

  // Fetch all batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      if (!user?.emp_id) return;
      try {
        const batchList = await getFacultyBatches(user.emp_id);
        setBatches(batchList);
        if (batchList.length > 0) {
          // Select the first batch by default
          setSelectedBatch(batchList[0]);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchBatches();
  }, [user?.emp_id]);

  // Fetch chat messages when selected batch changes
  const fetchChats = useCallback(async (isRefresh = false) => {
    if (!user?.emp_id || !selectedBatch) return;
    if (!isRefresh) setLoadingChats(true);
    try {
      const chatHistory = await getFacultyGroupChats(user.emp_id, selectedBatch.name);
      // Reverse messages if needed, ERP API typically returns them in reverse or chronological order
      // Let's keep the order returned or check
      setMessages(chatHistory || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoadingChats(false);
      setRefreshing(false);
    }
  }, [user?.emp_id, selectedBatch]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChats(true);
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.isMe;
    return (
      <View style={[styles.messageRow, isMe ? styles.myMsgRow : styles.otherMsgRow]}>
        {!isMe && (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {item.sender ? item.sender.slice(0, 1).toUpperCase() : 'S'}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.senderName, isMe ? styles.mySender : styles.otherSender]}>
            {isMe ? 'You (Faculty)' : item.sender}
          </Text>
          {item.department ? (
            <Text style={styles.deptBadge}>{item.department.toUpperCase()}</Text>
          ) : null}
          <Text style={[styles.messageText, isMe ? styles.myMsgText : styles.otherMsgText]}>
            {item.text}
          </Text>
          {item.attachment ? (
            <TouchableOpacity style={styles.attachmentButton} activeOpacity={0.8}>
              <Ionicons name="document-attach-outline" size={16} color={isMe ? '#FFF' : '#EA580C'} />
              <Text style={[styles.attachmentText, { color: isMe ? '#FFF' : '#EA580C' }]} numberOfLines={1}>
                {item.attachment.split('/').pop() || 'Attachment'}
              </Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.timeText}>{item.timestamp}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#1E1B4B', '#312E81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ERP Batch Channels</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
            <Ionicons name="sync" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Batch Selector Dropdown */}
        {loadingBatches ? (
          <ActivityIndicator color="#FFF" style={{ marginTop: 12 }} />
        ) : batches.length > 0 ? (
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setShowBatchDropdown(!showBatchDropdown)}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={18} color="#EA580C" />
              <Text style={styles.dropdownText}>
                Active Batch: {selectedBatch ? selectedBatch.name : 'Select Batch'}
              </Text>
              <Ionicons name={showBatchDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="#4B5563" />
            </TouchableOpacity>

            {showBatchDropdown && (
              <View style={styles.dropdownList}>
                {batches.map((batch) => (
                  <TouchableOpacity
                    key={batch.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedBatch(batch);
                      setShowBatchDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>Batch of {batch.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.noBatchesText}>No batches assigned to your account.</Text>
        )}
      </LinearGradient>

      {/* Message Area */}
      {loadingChats ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>Fetching portal chats...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="chat-remove-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Portal Messages</Text>
          <Text style={styles.emptySub}>Official announcements or class coordinate queries will appear here.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* Official notice box at the bottom */}
      <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + 8 }]}>
        <Ionicons name="information-circle-outline" size={16} color="#4B5563" />
        <Text style={styles.bottomInfoText}>
          This is a read-only sync of the legacy portal channel. Use the portal website to post new messages.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 16,
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  dropdownContainer: {
    paddingHorizontal: 16,
    marginTop: 14,
    position: 'relative',
    zIndex: 200,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  dropdownText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1F2937' },
  dropdownList: {
    position: 'absolute',
    top: 46,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 300,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  noBatchesText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginTop: 12 },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  messageRow: { flexDirection: 'row', marginBottom: 16, gap: 10, maxWidth: '85%' },
  myMsgRow: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  otherMsgRow: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
  avatarCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#EA580C20',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 13, fontWeight: '800', color: '#EA580C' },
  bubble: { borderRadius: 20, padding: 12, elevation: 1 },
  myBubble: { backgroundColor: '#312E81', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontWeight: '800', marginBottom: 2 },
  mySender: { color: '#FDA4AF' },
  otherSender: { color: '#EA580C' },
  deptBadge: {
    fontSize: 9, fontWeight: '700', alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6', color: '#4B5563',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    marginBottom: 4,
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  myMsgText: { color: '#FFF' },
  otherMsgText: { color: '#1F2937' },
  timeText: { fontSize: 9, color: '#9CA3AF', alignSelf: 'flex-end', marginTop: 4 },
  attachmentButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6, marginTop: 6,
  },
  attachmentText: { fontSize: 12, fontWeight: '600' },

  // Center loader/empty
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { fontSize: 14, color: '#6B7280', fontWeight: '500', marginTop: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#374151', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, marginTop: 6 },

  // Bottom Notice
  bottomInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB', padding: 12,
    borderTopWidth: 1, borderTopColor: '#FEF3C7',
  },
  bottomInfoText: { flex: 1, fontSize: 11, color: '#D97706', lineHeight: 16, fontWeight: '500' },
});

export default FacultyOfficialChatScreen;
