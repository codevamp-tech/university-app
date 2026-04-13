import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const ProgressBar = ({ progress = 0, color = Colors.primary, height = 6, backgroundColor = Colors.border, style }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolated = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height, backgroundColor }, style]}>
      <Animated.View
        style={[
          styles.fill,
          { width: widthInterpolated, height, backgroundColor: color },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    borderRadius: 99,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 99,
  },
});

export default ProgressBar;
