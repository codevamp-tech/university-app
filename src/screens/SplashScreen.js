import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { APP_CONFIG } from '../config/appConfig';

const SplashScreen = ({ navigation }) => {
  const logoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      navigation.replace('Onboarding1');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '80%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoAnim,
            transform: [
              {
                scale: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.logoCard}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={42} color={Colors.white} />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: textAnim }}>
        <Text style={styles.appName}>
          <Text style={styles.appNameDark}>{APP_CONFIG.UNIVERSITY_SHORT_NAME} </Text>
          <Text style={styles.appNameAccent}>UNIVERSITY</Text>
        </Text>

        <Text style={styles.tagline}>UNIVERSITY PORTAL</Text>
      </Animated.View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      <Text style={styles.preparingText}>Preparing your workspace...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    marginBottom: 24,
  },
  logoCard: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 20,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 32,
    letterSpacing: 1,
    textAlign: 'center',
  },
  appNameDark: {
    color: Colors.textPrimary,
    fontWeight: '900',
  },
  appNameAccent: {
    color: '#EA580C',
    fontWeight: '900',
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 4,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 32,
  },
  progressContainer: {
    width: '70%',
    marginBottom: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#EA580C',
    borderRadius: 2,
  },
  preparingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default SplashScreen;
