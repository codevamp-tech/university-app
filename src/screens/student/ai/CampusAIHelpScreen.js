import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../../config/appConfig';

const CampusAIHelpScreen = ({ navigation }) => {
  const SUGGESTIONS = [
    { id: '1', title: 'Club Schedule', icon: 'sports-cricket', lib: 'MaterialIcons', color: '#343D96', bgColor: '#CBCEFF' },
    { id: '2', title: 'Campus News', icon: 'newspaper', lib: 'Ionicons', color: '#595C5D', bgColor: '#eff1f2' },
    { id: '3', title: 'Academic Calendar', icon: 'calendar-month', lib: 'MaterialIcons', color: '#595C5D', bgColor: '#eff1f2' },
  ];

  const renderChipIcon = (chip) => {
    if (chip.lib === 'MaterialIcons') return <MaterialIcons name={chip.icon} size={18} color={chip.color} />;
    if (chip.lib === 'Ionicons') return <Ionicons name={chip.icon} size={18} color={chip.color} />;
    return <MaterialCommunityIcons name={chip.icon} size={18} color={chip.color} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.mascotGlow}>
            <MaterialIcons name="smart-toy" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>{APP_CONFIG.AI_ASSISTANT_NAME}</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Query Bubble */}
        <View style={styles.userQueryContainer}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>Who won the cricket match yesterday?</Text>
          </View>
          <Text style={styles.userLabel}>YOU • JUST NOW</Text>
        </View>

        {/* AI Response Puzzled */}
        <View style={styles.aiHeader}>
          <View style={styles.aiAvatar}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgaiqefKIjtdPjHehBfv5SsvSD_b9z13VVGQ0JJFgN0mKA99aFfB-4_Mn4EWCd33LBW659vuZb6g3Y0TAyOXyQvq0btBpkQ2l-GDrS3tmcFLFEqZUtEy8GtXe_L0PIhplEN92-cHnm-c825rTtR46NVbRQsTUzZDe9Y1FnJTSMnc5bew0He4O2vb70-JqDn9-4JraSiR8r0ug0yJeLzkEqFL0xlC2DN2SWQtc5W1koAMuA9rVuEv17kn1WFVFAzQO21_G5N_IB3Dpo' }}
              style={styles.aiAvatarImg}
            />
          </View>
          <Text style={styles.aiName}>{APP_CONFIG.AI_ASSISTANT_NAME}</Text>
        </View>

        <View style={styles.fallbackCard}>
          <MaterialCommunityIcons name="school-outline" size={100} color="#2C2F30" style={styles.bgIcon} />
          
          <View style={styles.cardHeader}>
            <View style={styles.helpIconBox}>
              <Ionicons name="help-circle" size={32} color="#EA580C" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.cardTitle}>Beyond my scope, for now.</Text>
              <Text style={styles.cardDesc}>
                I'm specialized in <Text style={styles.highlight}>{APP_CONFIG.UNIVERSITY_NAME}</Text> campus data, academics, and your career growth. I don't have real-time sports data yet.
              </Text>
              <Text style={[styles.cardDesc, { color: '#EA580C', fontWeight: '700', marginTop: 8 }]}>
                Would you like to check your sports club schedule instead?
              </Text>
            </View>
          </View>

          {/* Suggestion Chips */}
          <View style={styles.chipsRow}>
            {SUGGESTIONS.map((chip) => (
              <TouchableOpacity key={chip.id} style={[styles.chip, { backgroundColor: chip.bgColor }]}>
                {renderChipIcon(chip)}
                <Text style={[styles.chipText, { color: chip.color }]}>{chip.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback Row */}
        <View style={styles.feedbackRow}>
          <TouchableOpacity style={styles.feedbackBtn}>
            <Ionicons name="thumbs-up-outline" size={16} color="#9CA3AF" />
            <Text style={styles.feedbackText}>Helpful</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.feedbackBtn}>
            <Ionicons name="thumbs-down-outline" size={16} color="#9CA3AF" />
            <Text style={styles.feedbackText}>Not helpful</Text>
          </TouchableOpacity>
        </View>

        {/* Pro Tip */}
        <View style={styles.proTip}>
          <Ionicons name="information-circle" size={20} color="#006666" />
          <Text style={styles.proTipText}>
            Pro-tip: Ask me about "Upcoming Hackathons" or "Exam Schedules" for the best results!
          </Text>
        </View>
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.floatingInput}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.addBtn}>
            <Ionicons name="add-circle-outline" size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <TextInput 
            style={styles.input}
            placeholder="Ask about campus..."
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.sendBtn}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

    </View>
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: -0.5,
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  userQueryContainer: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  userBubble: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    borderTopRightRadius: 4,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#595C5D',
    marginTop: 8,
    letterSpacing: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff1f2',
    overflow: 'hidden',
  },
  aiAvatarImg: {
    width: '100%',
    height: '100%',
  },
  aiName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4953AC',
  },
  fallbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderLeftWidth: 6,
    borderLeftColor: '#FE9832',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bgIcon: {
    position: 'absolute',
    top: -30,
    right: -30,
    opacity: 0.03,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  helpIconBox: {
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C2F30',
    lineHeight: 24,
  },
  cardDesc: {
    fontSize: 14,
    color: '#595C5D',
    lineHeight: 20,
  },
  highlight: {
    fontWeight: '700',
    color: '#4953AC',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  feedbackRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  feedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  proTip: {
    backgroundColor: 'rgba(0, 102, 102, 0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 102, 0.1)',
  },
  proTipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#005858',
    lineHeight: 18,
  },
  floatingInput: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    padding: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  addBtn: {
    padding: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2F30',
    paddingHorizontal: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CampusAIHelpScreen;
