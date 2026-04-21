import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const InvertisThinkingScreen = ({ navigation, route }) => {
  const query = route.params?.query || 'Analyzing query...';
  
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.2)).current;
  const dot2 = useRef(new Animated.Value(0.2)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Pulse animation for mascot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Progress bar animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, { toValue: 3, duration: 2000, useNativeDriver: false }), // We'll translate the bar
      ])
    ).start();

    // Dot blinking
    const blink = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    };

    blink(dot1, 0);
    blink(dot2, 200);
    blink(dot3, 400);

    // Auto-navigate back to chat after some time (simulating processing)
    const timer = setTimeout(() => {
      navigation.goBack();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

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
          <Text style={styles.headerTitle}>Invertis AI Assistant</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Query Display */}
        <View style={styles.querySection}>
          <View style={styles.queryBubble}>
            <Text style={styles.queryText}>{query}</Text>
            <Text style={styles.queryTime}>JUST NOW</Text>
          </View>
        </View>

        {/* Thinking State */}
        <View style={styles.thinkingSection}>
          <View style={styles.thinkingRow}>
            <Animated.View style={[styles.mascotIconBox, { opacity: pulseAnim, transform: [{ scale: pulseAnim }] }]}>
              <MaterialCommunityIcons name="auto-awesome" size={24} color="#EA580C" />
            </Animated.View>
            
            <View style={styles.thinkingCard}>
              <View style={styles.dotRow}>
                <Animated.View style={[styles.dot, { opacity: dot1 }]} />
                <Animated.View style={[styles.dot, { opacity: dot2 }]} />
                <Animated.View style={[styles.dot, { opacity: dot3 }]} />
              </View>
              
              <Text style={styles.thinkingText}>Analyzing academic data from ERP...</Text>
              
              <View style={styles.progressBarBg}>
                <Animated.View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      transform: [{ 
                        translateX: progressAnim.interpolate({
                          inputRange: [0, 3],
                          outputRange: [-width * 0.4, width * 0.4]
                        }) 
                      }] 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Status Cards */}
          <View style={styles.statusGrid}>
            <View style={styles.statusCard}>
              <View style={styles.statusIconBox}>
                <MaterialCommunityIcons name="analytics" size={24} color="#006666" />
              </View>
              <View>
                <Text style={styles.statusTitle}>Marks Retrieved</Text>
                <Text style={styles.statusSub}>Sessional 1 & 2 verified</Text>
              </View>
            </View>

            <View style={styles.statusCard}>
              <View style={[styles.statusIconBox, { backgroundColor: '#F3F1FF' }]}>
                <MaterialCommunityIcons name="event-available" size={24} color="#4953AC" />
              </View>
              <View>
                <Text style={styles.statusTitle}>Attendance Sync</Text>
                <Text style={styles.statusSub}>Current: 82.5% Average</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Suggestions (Simulated) */}
        <View style={styles.suggestionsRow}>
          {['Attendance Details', 'Marks Calculator'].map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.suggestionChip}>
              <Text style={styles.suggestionText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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
  querySection: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  queryBubble: {
    backgroundColor: '#CBCEFF',
    padding: 20,
    borderRadius: 24,
    borderTopRightRadius: 4,
    maxWidth: '85%',
    shadowColor: '#4953AC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  queryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343D96',
    lineHeight: 22,
  },
  queryTime: {
    fontSize: 10,
    fontWeight: '800',
    color: '#343D96',
    opacity: 0.6,
    marginTop: 8,
    letterSpacing: 1,
  },
  thinkingSection: {
    gap: 16,
  },
  thinkingRow: {
    flexDirection: 'row',
    gap: 16,
  },
  mascotIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff1f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thinkingCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    borderTopLeftRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA580C',
  },
  thinkingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#595C5D',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#eff1f2',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EA580C',
    width: '40%',
    borderRadius: 2,
  },
  statusGrid: {
    marginLeft: 60,
    gap: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  statusIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  statusSub: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 24,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4953AC',
  },
});

export default InvertisThinkingScreen;
