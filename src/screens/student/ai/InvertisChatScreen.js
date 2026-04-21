import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const InvertisChatScreen = ({ navigation, route }) => {
  const initialQuery = route.params?.initialQuery || '';
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery);
    } else {
      // Welcome message
      setMessages([
        {
          id: '1',
          type: 'ai',
          text: "Hello! I'm your Invertis AI Assistant. How can I help you with your campus life today?",
          time: '10:00 AM',
        }
      ]);
    }
  }, []);

  const handleSend = (text) => {
    const query = text || inputText;
    if (!query.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      type: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Simulate thinking
    setTimeout(() => {
      navigation.navigate('InvertisThinking', { query });
      
      // Return and show message
      setTimeout(() => {
        const responseMsg = getResponse(query);
        setMessages(prev => [...prev, responseMsg]);
        navigation.navigate('InvertisChat'); 
      }, 3200); // Slightly longer than Thinking screen's stay
    }, 500);
  };

  const getResponse = (query) => {
    const q = query.toLowerCase();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (q.includes('schedule') || q.includes('lecture') || q.includes('timetable')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        text: 'Checking your calendar for tomorrow, Wednesday, Oct 25th. You have 4 upcoming sessions.',
        time,
        cardType: 'timetable',
        data: [
          { time: '09:00', title: 'Data Structures', detail: 'Prof. Sharma • Room 302', type: 'Academic' },
          { time: '11:30', title: 'Operating Systems', detail: 'Dr. Khanna • Lab 04', type: 'Lab' },
        ]
      };
    } else if (q.includes('attendance') || q.includes('dbms')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        text: "You're doing great! Your attendance in Database Management Systems is well above the required threshold.",
        time,
        cardType: 'attendance',
        data: { subject: 'DBMS', percentage: 85, detail: '26 out of 30 sessions attended' }
      };
    } else if (q.includes('unit test') || q.includes('exam')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        text: 'The next unit test for 3rd semester students is scheduled for next Monday. Here is your academic timeline.',
        time,
        cardType: 'test',
        data: { title: 'Unit Test #2', date: 'Oct 30, 2024', subjects: ['DBMS', 'Data Structures'] }
      };
    } else if (q.includes('results')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        text: 'Your semester results for the previous session have been declared. You have maintained a strong SGPA.',
        time,
        cardType: 'results',
        data: { sgpa: 8.4, cgpa: 8.2, status: 'PASSED' }
      };
    } else if (q.includes('cricket') || q.includes('match') || q.includes('sports')) {
      // Trigger help/out-of-scope screen
      setTimeout(() => navigation.navigate('InvertisHelp'), 100);
      return { id: 'dummy', type: 'ai', text: 'Searching...', time };
    } else {
      return {
        id: Date.now().toString(),
        type: 'ai',
        text: "I can help you with your schedule, attendance, fees, or campus events. What would you like to know?",
        time,
      };
    }
  };

  const renderMessage = (msg) => {
    if (msg.id === 'dummy') return null;

    return (
      <View key={msg.id} style={[styles.msgContainer, msg.type === 'user' ? styles.userContainer : styles.aiContainer]}>
        {msg.type === 'ai' && (
          <View style={styles.aiAvatar}>
            <MaterialIcons name="smart-toy" size={16} color="#4953AC" />
          </View>
        )}
        <View style={styles.msgContentWrapper}>
          <View style={[styles.bubble, msg.type === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.msgText, msg.type === 'user' ? styles.userText : styles.aiText]}>{msg.text}</Text>
          </View>
          
          {msg.cardType === 'timetable' && (
            <View style={styles.timetableCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderTitle}>Tomorrow's Schedule</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>ACADEMIC DAY</Text></View>
              </View>
              {msg.data.map((item, idx) => (
                <View key={idx} style={styles.timetableItem}>
                  <View style={[styles.timeSlot, { backgroundColor: idx % 2 === 0 ? '#CBCEFF' : '#8DEDEC' }]}>
                    <Text style={styles.timeSlotSub}>START</Text>
                    <Text style={styles.timeSlotMain}>{item.time}</Text>
                  </View>
                  <View style={styles.timetableDetails}>
                    <Text style={styles.timetableTitle}>{item.title}</Text>
                    <Text style={styles.timetableSub}>{item.detail}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              ))}
            </View>
          )}

          {msg.cardType === 'attendance' && (
            <View style={styles.attendanceCard}>
              <View style={styles.attendanceCircle}>
                <Text style={styles.attendanceValue}>{msg.data.percentage}%</Text>
                <Text style={styles.attendanceLabel}>PRESENT</Text>
              </View>
              <View style={styles.attendanceInfo}>
                <Text style={styles.attendanceTitle}>{msg.data.subject} Attendance</Text>
                <Text style={styles.attendanceSub}>{msg.data.detail}</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>STATUS: EXCELLENT</Text>
                </View>
              </View>
            </View>
          )}

          {msg.cardType === 'test' && (
            <View style={[styles.timetableCard, { borderLeftColor: '#8B4B00', borderLeftWidth: 4, backgroundColor: '#FFF7ED' }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardHeaderTitle, { color: '#8B4B00' }]}>{msg.data.title}</Text>
                <View style={[styles.badge, { backgroundColor: '#FE9832' }]}><Text style={[styles.badgeText, { color: '#FFF' }]}>UPCOMING</Text></View>
              </View>
              <View style={styles.timetableItem}>
                <View style={[styles.timeSlot, { backgroundColor: '#FE9832' }]}>
                  <Ionicons name="calendar" size={20} color="#FFF" />
                </View>
                <View style={styles.timetableDetails}>
                  <Text style={styles.timetableTitle}>{msg.data.date}</Text>
                  <Text style={styles.timetableSub}>{msg.data.subjects.join(', ')}</Text>
                </View>
              </View>
            </View>
          )}

          {msg.cardType === 'results' && (
            <View style={[styles.attendanceCard, { borderTopColor: '#4953AC' }]}>
              <View style={[styles.attendanceCircle, { borderColor: '#4953AC' }]}>
                <Text style={styles.attendanceValue}>{msg.data.sgpa}</Text>
                <Text style={[styles.attendanceLabel, { color: '#4953AC' }]}>SGPA</Text>
              </View>
              <View style={styles.attendanceInfo}>
                <Text style={styles.attendanceTitle}>Semester Results</Text>
                <Text style={styles.attendanceSub}>Overall CGPA: {msg.data.cgpa}</Text>
                <View style={[styles.statusPill, { backgroundColor: '#CBCEFF' }]}>
                  <Text style={[styles.statusText, { color: '#4953AC' }]}>STATUS: {msg.data.status}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={[styles.msgMeta, msg.type === 'user' ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
            <Text style={styles.msgTime}>{msg.time}</Text>
            {msg.type === 'user' && <Ionicons name="checkmark-done" size={14} color="#EA580C" style={{ marginLeft: 4 }} />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.mascotGlow}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArFcPjVmGBnsNBtqy8sdPTTi7-sf--uaktIEyHdjR5kPW2Gm4BIryfJhQfrREXP3tl9QInCeUDF-MW-cmTenCJW6BNaCO1Zqbn4S7CSuibc0VhAqlulhYBfgsDamLK9rRZ8TuJwrzD8C7w91v65bJuIm0YxB7VGk2Ukbwt7W0xCzmvRvdd3Omq96l7_rmmg82Sfib6tyxEZxapI4tTechClbSHy9garBjTX9CuhXro_5yAJv7TNBEq-CzhetztwtzM8azLw9tXMW9y' }}
              style={styles.mascotSmall}
            />
          </View>
          <View>
            <Text style={styles.headerTitle}>Invertis AI Assistant</Text>
            <Text style={styles.headerSubtitle}>Always Active</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollRef}
        style={styles.chatArea} 
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {['Exam schedule', 'Fee status', 'Upcoming deadlines'].map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.actionChip} onPress={() => handleSend(item)}>
              <Text style={styles.actionChipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Section */}
      <SafeAreaView style={styles.inputArea}>
        <View style={styles.inputInner}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="attach" size={22} color="#6B7280" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Ask Invertis anything..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="mic-outline" size={22} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()}>
            <LinearGradient colors={['#EA580C', '#9A3412']} style={styles.sendBtnGradient}>
              <Ionicons name="search" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'rgba(245, 246, 247, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(234, 88, 12, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mascotGlow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EA580C',
    padding: 2,
  },
  mascotSmall: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#006666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chatArea: {
    flex: 1,
  },
  msgContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CBCEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  msgContentWrapper: {
    flex: 1,
    maxWidth: '85%',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#FE9832',
    borderTopRightRadius: 4,
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
    alignSelf: 'flex-start',
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#4D2700',
    fontWeight: '500',
  },
  aiText: {
    color: '#2C2F30',
  },
  msgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  msgTime: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  timetableCard: {
    backgroundColor: '#eff1f2',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    width: '100%',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4953AC',
  },
  badge: {
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#EA580C',
  },
  timetableItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeSlot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSlotSub: {
    fontSize: 8,
    fontWeight: '800',
    color: '#343D96',
  },
  timeSlotMain: {
    fontSize: 14,
    fontWeight: '900',
    color: '#343D96',
  },
  timetableDetails: {
    flex: 1,
  },
  timetableTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  timetableSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderTopWidth: 6,
    borderTopColor: '#006666',
    shadowColor: '#006666',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  attendanceCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#006666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2C2F30',
  },
  attendanceLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: '#006666',
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  attendanceSub: {
    fontSize: 12,
    color: '#6B7280',
    marginVertical: 4,
  },
  statusPill: {
    backgroundColor: 'rgba(0, 102, 102, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#006666',
  },
  quickActions: {
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  actionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  inputArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#eff1f2',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1F2937',
  },
  iconBtn: {
    padding: 8,
  },
  sendBtn: {
    marginLeft: 4,
  },
  sendBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default InvertisChatScreen;
