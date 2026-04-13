import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ChatScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Main Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialIcons name="arrow-back" size={26} color="#EA580C" />
          </TouchableOpacity>
          <Text style={styles.headerLogo}>Invertis Channels</Text>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6mmtjUA28NY_AB8YFu2Ri2e3lSkRbJCYpAbrgwHHzzLntRM9rNTLFJIT-pf3fW5gQ-_hRX8LB8ZDdqw5ls_d4bA10oIXuBlKp8kv7onee50cVXADdy7BPVn6kAg4Co9Gbp6XiTx5yITLttWLtkQQag4sVTILELHpLT0_-WAXmJWUVCHpSfhFuYmROstnRxdO_T4ym_KOCd8CmJm60WORR2yoPF8RiqYCiJsTUrQcbumydveuPeijNqG_991IufFMlU7g1DbJ3nqtG' }}
            style={styles.avatarTiny}
          />
        </View>

        {/* Channel Header */}
        <View style={styles.channelHeader}>
          <View style={styles.channelHeaderLeft}>
            <Text style={styles.hash}>#</Text>
            <Text style={styles.channelName}>General</Text>
          </View>
          <View style={styles.channelHeaderRight}>
            <TouchableOpacity style={styles.channelIconBtn}>
              <MaterialIcons name="search" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.channelIconBtn}>
              <MaterialIcons name="person-add-alt" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Area */}
        <ScrollView contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
          
          {/* Message 1: Ishaan (Left) */}
          <View style={styles.messageWrap}>
            <Image source={{ uri: 'https://i.pravatar.cc/150?u=ishaan' }} style={styles.msgAvatar} />
            <View style={styles.msgContent}>
              <View style={styles.msgHeader}>
                <Text style={styles.msgAuthor}>Ishaan</Text>
                <Text style={styles.msgTime}>10:45 AM</Text>
              </View>
              <View style={[styles.bubbleLeft, styles.bubble]}>
                <Text style={styles.msgText}>Hey everyone! Has anyone checked the new schedule for the Innovation Lab workshop? I heard they've added some cool AI modules.</Text>
              </View>
            </View>
          </View>

          {/* Message 2: Ananya (Right) */}
          <View style={[styles.messageWrap, { justifyContent: 'flex-end' }]}>
            <View style={[styles.msgContent, { alignItems: 'flex-end', marginLeft: 0, marginRight: 12 }]}>
              <View style={[styles.msgHeader, { justifyContent: 'flex-end' }]}>
                <Text style={styles.msgTime}>10:48 AM</Text>
                <Text style={[styles.msgAuthor, { marginLeft: 8, marginRight: 0, color: '#9A3412' }]}>Ananya</Text>
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

          {/* Message 3: Kabir (Left) */}
          <View style={styles.messageWrap}>
            <Image source={{ uri: 'https://i.pravatar.cc/150?u=kabir' }} style={styles.msgAvatar} />
            <View style={styles.msgContent}>
              <View style={styles.msgHeader}>
                <Text style={styles.msgAuthor}>Kabir</Text>
                <Text style={styles.msgTime}>02:15 PM</Text>
              </View>
              <View style={[styles.bubbleLeft, styles.bubble]}>
                <Text style={styles.msgText}>Guys, don't forget the library is closing early today for maintenance. Return your books before 4 PM!</Text>
                {/* Embedded Card */}
                <View style={styles.embeddedCard}>
                  <View style={styles.cardStrip} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Campus Notice #402</Text>
                    <Text style={styles.cardDesc}>Facility Maintenance Schedule: Academic Block A</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Message 4: Meera (Left) */}
          <View style={styles.messageWrap}>
            <Image source={{ uri: 'https://i.pravatar.cc/150?u=meera' }} style={styles.msgAvatar} />
            <View style={styles.msgContent}>
              <View style={styles.msgHeader}>
                <Text style={styles.msgAuthor}>Meera</Text>
                <Text style={styles.msgTime}>03:30 PM</Text>
              </View>
              <View style={[styles.bubbleLeft, styles.bubble]}>
                <Image 
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDx2vOINc1dswJ9kG4G0kY2M73mE2H1zDqGqK3J3jFv0iV2H_L5sKV5xN1_wP3A4oT7pP7N-v5sE4_A5r_T2L3E8v2W8D9wE3qNxjK9D6Y2N6UqA9kO7xJ3wY5hJ0L2sC1I8z_wN8zN6V8xD3hC5mK6Z8gQ9_Y1_0G3_g4k9xZ2J2qM8vN6F2L9lC9H7_M3H9M9jG' }} 
                  style={styles.attachedImage} 
                />
                <Text style={styles.msgText}>Look at the new setup in the lab! It's finally ready.</Text>
              </View>
            </View>
          </View>

        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.attachBtn}>
            <MaterialIcons name="add" size={24} color="#4B5563" />
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <TextInput 
              style={styles.input}
              placeholder="Message #General"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.emojiBtn}>
              <MaterialIcons name="emoji-emotions" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.sendBtn}>
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerIconBtn: {
    padding: 8,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  avatarTiny: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
  },
  channelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hash: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4338CA',
  },
  channelName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  channelHeaderRight: {
    flexDirection: 'row',
    gap: 16,
  },
  channelIconBtn: {
  },
  chatScroll: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  messageWrap: {
    flexDirection: 'row',
    marginBottom: 24,
    width: '100%',
  },
  msgAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  msgContent: {
    flex: 1,
    marginLeft: 12,
    maxWidth: '85%',
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  msgAuthor: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4338CA',
    marginRight: 8,
  },
  msgTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  bubble: {
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  bubbleLeft: {
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: '#F97316',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 4,
  },
  msgText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  msgTextRight: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dateText: {
    marginHorizontal: 16,
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
  },
  embeddedCard: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardStrip: {
    width: 4,
    backgroundColor: '#EA580C',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    padding: 12,
    paddingBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#6B7280',
    padding: 12,
    paddingTop: 0,
    lineHeight: 18,
  },
  attachedImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
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
    backgroundColor: '#9A3412',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default ChatScreen;
