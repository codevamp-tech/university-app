import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────
// Single shimmer block
// ─────────────────────────────────────────
export const SkeletonBlock = ({ width = '100%', height = 16, borderRadius = 8, style }) => {
  const { isDark } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const baseColor = isDark ? '#374151' : '#E5E7EB';

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: baseColor, opacity },
        style,
      ]}
    />
  );
};

// ─────────────────────────────────────────
// Leaderboard skeleton — mimics boardItem rows
// ─────────────────────────────────────────
export const LeaderboardSkeleton = ({ rows = 8 }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[lStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={[
            lStyles.row,
            { borderBottomColor: colors.border },
            i === rows - 1 && { borderBottomWidth: 0 },
          ]}
        >
          {/* rank number */}
          <SkeletonBlock width={20} height={14} borderRadius={4} style={{ marginRight: 12 }} />
          {/* avatar circle */}
          <SkeletonBlock width={44} height={44} borderRadius={22} style={{ marginRight: 12 }} />
          {/* name + course stacked */}
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBlock width={`${55 + (i % 3) * 15}%`} height={13} borderRadius={6} />
            <SkeletonBlock width={`${35 + (i % 2) * 10}%`} height={10} borderRadius={5} />
          </View>
          {/* score pill */}
          <SkeletonBlock width={72} height={28} borderRadius={14} style={{ marginLeft: 8 }} />
        </View>
      ))}
    </View>
  );
};

// Full leaderboard page skeleton (header + pulse card + list)
export const LeaderboardPageSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      {/* Pulse Points hero card */}
      <View style={[lStyles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonBlock width={120} height={12} borderRadius={6} style={{ marginBottom: 12 }} />
        <SkeletonBlock width={160} height={48} borderRadius={12} style={{ marginBottom: 20 }} />
        <SkeletonBlock width={'100%'} height={8} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonBlock width={'60%'} height={10} borderRadius={5} style={{ alignSelf: 'flex-end', marginBottom: 16 }} />
        <SkeletonBlock width={'100%'} height={60} borderRadius={12} />
      </View>

      {/* Section title */}
      <SkeletonBlock width={180} height={18} borderRadius={8} style={{ marginTop: 24, marginBottom: 16 }} />

      {/* Hustle grid cards */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <SkeletonBlock width={'48%'} height={130} borderRadius={24} />
        <SkeletonBlock width={'48%'} height={130} borderRadius={24} />
      </View>

      {/* Section title */}
      <SkeletonBlock width={200} height={18} borderRadius={8} style={{ marginBottom: 16 }} />

      {/* Leaderboard list */}
      <LeaderboardSkeleton rows={7} />
    </View>
  );
};

// ─────────────────────────────────────────
// Timeline skeleton — for roadmap / learning path
// ─────────────────────────────────────────
export const TimelineSkeleton = ({ steps = 3 }) => {
  const { colors } = useTheme();

  return (
    <View style={{ paddingVertical: 8 }}>
      {Array.from({ length: steps }).map((_, i) => (
        <View key={i} style={tStyles.step}>
          {/* Left: dot + line */}
          <View style={tStyles.dotCol}>
            <SkeletonBlock width={16} height={16} borderRadius={8} />
            {i < steps - 1 && (
              <View style={[tStyles.line, { backgroundColor: colors.border }]} />
            )}
          </View>

          {/* Right: content blocks */}
          <View style={{ flex: 1, paddingBottom: 28 }}>
            <SkeletonBlock width={'40%'} height={10} borderRadius={5} style={{ marginBottom: 8 }} />
            <SkeletonBlock width={'85%'} height={13} borderRadius={6} style={{ marginBottom: 6 }} />
            <SkeletonBlock width={'70%'} height={13} borderRadius={6} style={{ marginBottom: 12 }} />
            <SkeletonBlock width={'100%'} height={52} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────
// Generic content skeleton (e.g. inside cards/modals)
// ─────────────────────────────────────────
export const ContentSkeleton = ({ lines = 4, title = true }) => (
  <View style={{ padding: 16, gap: 10 }}>
    {title && (
      <SkeletonBlock width={'55%'} height={18} borderRadius={8} style={{ marginBottom: 4 }} />
    )}
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBlock
        key={i}
        width={i === lines - 1 ? '65%' : `${75 + (i % 3) * 8}%`}
        height={12}
        borderRadius={6}
      />
    ))}
  </View>
);

const lStyles = StyleSheet.create({
  card: {
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  heroCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    marginTop: 16,
  },
});

const tStyles = StyleSheet.create({
  step: {
    flexDirection: 'row',
    gap: 16,
  },
  dotCol: {
    alignItems: 'center',
    width: 16,
    paddingTop: 2,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 6,
    borderRadius: 1,
  },
});
