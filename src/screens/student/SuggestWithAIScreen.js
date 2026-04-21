import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Image,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

const { width, height } = Dimensions.get('window');

const SuggestWithAIScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const startAnimation = () => {
    setIsGenerating(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      setIsGenerating(false);
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }, 3000);
  };

  const ideas = [
    {
      title: 'EduSync AI',
      category: 'EdTech',
      match: '98%',
      desc: 'Hyper-personalized learning paths for Invertis engineering students using real-time course feedback.',
      icon: 'school',
      color: '#EA580C',
    },
    {
      title: 'Pulse Mart',
      category: 'Marketplace',
      match: '92%',
      desc: 'A decentralized campus economy platform for trading academic resources and student-led services.',
      icon: 'shopping-bag',
      color: '#4338CA',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>AI Venture Studio</Text>
        <View style={{ width: 40 }} />
      </View>


      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* AI Orb */}
        <View style={styles.orbContainer}>
          <Animated.View style={[styles.orbPulse, { transform: [{ scale: pulseAnim }], backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : 'rgba(234, 88, 12, 0.08)' }]}>
            <LinearGradient
              colors={isDark ? ['#9A3412', '#78350F'] : ['#EA580C', '#9A3412']}
              style={styles.orb}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="brain" size={50} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.orbLabel, { color: colors.textSecondary }]}>{isGenerating ? 'ANALYZING MARKET GAPS...' : 'READY TO INNOVATE'}</Text>
        </View>


        {/* Action Section */}
        <View style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Generate Venture Idea</Text>
          <Text style={[styles.actionSub, { color: colors.textSecondary }]}>AI will scan campus trends and global markets to suggest your next big startup.</Text>

          <TouchableOpacity
            style={styles.generateBtn}
            onPress={startAnimation}
            disabled={isGenerating}
          >
            <LinearGradient
              colors={isDark ? ['#9A3412', '#78350F'] : ['#EA580C', '#9A3412']}
              style={styles.generateBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="auto-awesome" size={18} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>{isGenerating ? 'Generating...' : 'Inspire Me'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>


        {/* Suggestion List */}
        {!isGenerating && (
          <View style={styles.suggestionsList}>
            <Text style={[styles.listTitle, { color: colors.textPrimary }]}>Top AI Suggestions</Text>
            {ideas.map((idea, i) => (
              <View
                key={i}
                style={[styles.ideaCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              >
                <View
                  style={[styles.ideaIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : idea.color + '15' }]}
                >
                  <MaterialIcons name={idea.icon} size={28} color={isDark ? colors.primary : idea.color} />
                </View>
                <View style={styles.ideaContent}>
                  <View style={styles.ideaHeader}>
                    <Text style={[styles.ideaTitle, { color: colors.textPrimary }]}>{idea.title}</Text>
                    <View
                      style={[styles.matchBadge, { backgroundColor: isDark ? 'rgba(16, 163, 74, 0.2)' : '#DCFCE7' }]}
                    >
                      <Text style={[styles.matchText, { color: isDark ? '#4ade80' : '#16A34A' }]}>{idea.match} MATCH</Text>
                    </View>
                  </View>
                  <Text style={[styles.ideaCategory, { color: isDark ? colors.primary : idea.color }]}>{idea.category.toUpperCase()}</Text>
                  <Text style={[styles.ideaDesc, { color: colors.textSecondary }]}>{idea.desc}</Text>

                  <View style={styles.ideaFooter}>
                    <TouchableOpacity style={[styles.pitchSmallBtn, { backgroundColor: colors.textPrimary }]}>
                      <Text style={[styles.pitchSmallText, { color: colors.background }]}>Draft Pitch</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.coFoundBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6', borderColor: colors.border }]}>
                      <Ionicons name="people" size={16} color={isDark ? '#818CF8' : '#4338CA'} />
                      <Text style={[styles.coFoundText, { color: isDark ? '#818CF8' : '#4338CA' }]}>Find Partners</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backBtnBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  scrollContent: {
    paddingBottom: 100,
  },
  orbContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  orbPulse: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },

  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  orbLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 20,
  },

  actionCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },

  actionTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  actionSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  generateBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  suggestionsList: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: -0.5,
  },

  ideaCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },

  ideaIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ideaContent: {
    flex: 1,
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  ideaTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchText: {
    fontSize: 9,
    fontWeight: '800',
  },
  ideaCategory: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  ideaDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },

  ideaFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  pitchSmallBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  pitchSmallText: {
    fontSize: 12,
    fontWeight: '700',
  },

  coFoundBtn: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coFoundText: {
    fontSize: 12,
    fontWeight: '700',
  },

});

export default SuggestWithAIScreen;