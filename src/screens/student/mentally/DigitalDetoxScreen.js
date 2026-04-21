import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Switch,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle } from 'react-native-svg';
import { useTheme } from '../../../hooks/useTheme';


const { width } = Dimensions.get('window');

const DigitalDetoxScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [isFocusLocked, setIsFocusLocked] = React.useState(true);


  // SVG Progress Ring components
  const size = 120;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const progress = 0.65; // 65% progress

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>

      {/* Top Navigation */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Digital Detox</Text>
        </View>
        <View style={[styles.profileBox, { backgroundColor: isDark ? 'rgba(254, 152, 50, 0.2)' : 'rgba(254, 152, 50, 0.1)' }]}>
          <MaterialCommunityIcons name="timer-outline" size={24} color={colors.primary} />
        </View>
      </View>


      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.mainTitleContainer}>
          <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>Digital Detox</Text>
          <Text style={[styles.mainSub, { color: colors.textSecondary }]}>Reclaim your focus, one breath at a time.</Text>
        </View>


        {/* Hero: Active Session Timer */}
        <View style={styles.heroContainer}>
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <LinearGradient
              colors={isDark ? ['rgba(254, 152, 50, 0.1)', 'rgba(45, 212, 191, 0.1)'] : ['rgba(139, 75, 0, 0.05)', 'rgba(0, 102, 102, 0.05)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={[styles.heroLabel, { color: colors.primary }]}>ACTIVE SESSION</Text>
            <View style={styles.timerContainer}>
              <Text style={[styles.timerText, { color: colors.textPrimary }]}>42</Text>
              <Text style={[styles.timerColon, { color: colors.primary }]}>:</Text>
              <Text style={[styles.timerText, { color: colors.textPrimary }]}>18</Text>
            </View>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Minutes remaining in focus mode</Text>

            <TouchableOpacity 
              style={[styles.endSessionBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.endSessionText}>End Session</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Grid Section */}
        <View style={styles.gridContainer}>
          {/* Progress Ring Card */}
          <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.ringWrapper}>
              <Svg width={size} height={size}>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={colors.border}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />

                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={isDark ? '#2DD4BF' : '#006666'}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${center}, ${center}`}
                />
              </Svg>

              <View style={styles.ringInner}>
                <Text style={[styles.ringVal, { color: colors.textPrimary }]}>124</Text>
                <Text style={[styles.ringLabel, { color: colors.textMuted }]}>MINUTES</Text>
              </View>

            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardInfoTitle, { color: colors.textPrimary }]}>Time Saved</Text>
              <Text style={[styles.cardInfoSub, { color: colors.textSecondary }]}>From distractions today</Text>
            </View>

          </View>

          {/* Focus Lock Switch Card */}
          <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.switchHeader}>
              <View style={[styles.switchIconBg, { backgroundColor: isDark ? 'rgba(254, 152, 50, 0.2)' : 'rgba(139, 75, 0, 0.1)' }]}>
                <MaterialCommunityIcons name="cellphone-lock" size={24} color={colors.primary} />
              </View>
              <Switch
                value={isFocusLocked}
                onValueChange={setIsFocusLocked}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.cardInfo}>
              <Text style={[styles.cardInfoTitle, { color: colors.textPrimary }]}>Deep Focus Lock</Text>
              <Text style={[styles.cardInfoSub, { color: colors.textSecondary }]}>Social & game apps are currently restricted.</Text>
            </View>

          </View>
        </View>

        {/* Motivation Card */}
        <View style={styles.quoteCard}>
          <LinearGradient
            colors={['#1A237E', '#312E81']}
            style={StyleSheet.absoluteFill}
          />
          <MaterialCommunityIcons name="format-quote-open" size={48} color="rgba(254, 152, 50, 0.2)" style={styles.quoteIcon} />
          <Text style={styles.quoteText}>
            "The noise of the world is only as loud as the attention you give it. Silence is the ultimate luxury of the focused mind."
          </Text>
          <View style={styles.quoteAuthorRow}>
            <View style={styles.authorLine} />
            <Text style={styles.authorName}>MARCUS AURELIUS</Text>
          </View>
        </View>

        {/* Quick Actions List */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={[styles.actionIconBg, { backgroundColor: isDark ? 'rgba(45, 212, 191, 0.15)' : 'rgba(0, 102, 102, 0.1)' }]}>
              <MaterialCommunityIcons name="forest" size={24} color={isDark ? '#2DD4BF' : '#006666'} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionLabel, { color: isDark ? '#2DD4BF' : '#006666' }]}>AMBIENT SOUND</Text>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Himalayan Rainfall</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>


          <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={[styles.actionIconBg, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(73, 83, 172, 0.1)' }]}>
              <MaterialCommunityIcons name="weather-night" size={24} color={isDark ? '#818CF8' : '#4953AC'} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionLabel, { color: isDark ? '#818CF8' : '#4953AC' }]}>SESSION GOAL</Text>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Exam Preparation</Text>
            </View>
            <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

        </View>

        <View style={{ height: 100 }} />
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
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  profileBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: {
    paddingBottom: 20,
  },
  mainTitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },

  mainSub: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: '500',
  },

  heroContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },

  heroLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
  },

  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
  },

  timerColon: {
    fontSize: 64,
    fontWeight: '900',
    opacity: 0.3,
    marginBottom: 8,
  },

  heroSub: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 32,
  },

  endSessionBtn: {
    backgroundColor: '#8B4B00',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#8B4B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  endSessionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  gridCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
  },

  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ringInner: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringVal: {
    fontSize: 24,
    fontWeight: '900',
  },

  ringLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  switchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardInfoTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },

  cardInfoSub: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },

  quoteCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 32,
    overflow: 'hidden',
    marginBottom: 24,
  },
  quoteIcon: {
    position: 'absolute',
    top: 0,
    right: 10,
  },
  quoteText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 28,
    marginBottom: 16,
    zIndex: 1,
  },
  quoteAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorLine: {
    width: 40,
    height: 2,
    backgroundColor: '#FE9832',
    borderRadius: 1,
  },
  authorName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FE9832',
    letterSpacing: 2,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
  },

  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },

});

export default DigitalDetoxScreen;
