/**
 * FocusTimerModal.js
 * ──────────────────
 * A full-screen modal with a circular countdown timer for focus/mindfulness sessions.
 * On completion (or manual stop), the elapsed time is saved via HealthService.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Vibration,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HealthService } from '../data/healthService';

const { width } = Dimensions.get('window');
const TIMER_SIZE = width * 0.65;

const PRESET_DURATIONS = [5, 10, 15, 25, 30]; // minutes

export default function FocusTimerModal({ visible, onClose, onSessionComplete, colors, isDark }) {
  const [selectedMinutes, setSelectedMinutes] = useState(15);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const intervalRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const totalSeconds = selectedMinutes * 60;
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
  const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;

  // Pulse animation while running
  useEffect(() => {
    if (isRunning && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning, isPaused, pulseAnim]);

  // Timer tick
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= totalSeconds) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setIsCompleted(true);
            Vibration.vibrate([0, 200, 100, 200]);
            return totalSeconds;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, totalSeconds]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setElapsedSeconds(0);
    setIsRunning(true);
    setIsPaused(false);
    setIsCompleted(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsPaused(false);

    const minutesCompleted = Math.round(elapsedSeconds / 60);
    if (minutesCompleted > 0) {
      await HealthService.saveFocusSession(minutesCompleted);
      setIsCompleted(true);
      if (onSessionComplete) onSessionComplete(minutesCompleted);
    }
  }, [elapsedSeconds, onSessionComplete]);

  const handleDone = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setIsCompleted(false);
    onClose();
  };

  const handleModalClose = () => {
    if (isRunning) {
      handleStop();
    }
    handleDone();
  };

  // Circumference for progress ring
  const radius = TIMER_SIZE / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleModalClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#111827' }]}>
              {isCompleted ? '🎉 Session Complete!' : '🧠 Focus Session'}
            </Text>
            <TouchableOpacity onPress={handleModalClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          {/* Timer Ring */}
          <View style={styles.timerContainer}>
            <Animated.View style={[styles.timerRingOuter, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.timerRingBg, { borderColor: isDark ? '#1F293740' : '#E5E7EB' }]}>
                {/* Progress arc — using a border-based approach */}
                <View
                  style={[
                    styles.timerRingProgress,
                    {
                      borderColor: '#3B82F6',
                      borderRightColor: progress > 0.25 ? '#3B82F6' : 'transparent',
                      borderBottomColor: progress > 0.5 ? '#3B82F6' : 'transparent',
                      borderLeftColor: progress > 0.75 ? '#3B82F6' : 'transparent',
                      transform: [{ rotate: `${progress * 360}deg` }],
                      opacity: isRunning || isCompleted ? 1 : 0.2,
                    },
                  ]}
                />
              </View>
              <View style={styles.timerInner}>
                <Text style={[styles.timerText, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                  {isRunning || isCompleted ? formatTime(remainingSeconds) : formatTime(totalSeconds)}
                </Text>
                <Text style={[styles.timerLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {isCompleted
                    ? `${Math.round(elapsedSeconds / 60)} min focused`
                    : isRunning
                    ? (isPaused ? 'PAUSED' : 'FOCUSING...')
                    : 'READY'}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Duration Presets (only visible when not running) */}
          {!isRunning && !isCompleted && (
            <View style={styles.presetsContainer}>
              <Text style={[styles.presetsLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Select Duration
              </Text>
              <View style={styles.presetRow}>
                {PRESET_DURATIONS.map((mins) => {
                  const isSelected = selectedMinutes === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      onPress={() => setSelectedMinutes(mins)}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isSelected
                            ? '#3B82F6'
                            : isDark
                            ? '#1F2937'
                            : '#F3F4F6',
                          borderColor: isSelected ? '#3B82F6' : isDark ? '#374151' : '#E5E7EB',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          { color: isSelected ? '#FFFFFF' : isDark ? '#D1D5DB' : '#374151' },
                        ]}
                      >
                        {mins} min
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {isCompleted ? (
              <TouchableOpacity onPress={handleDone} style={styles.actionBtnWide}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.actionBtnGradient}>
                  <MaterialCommunityIcons name="check-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Done — Back to Fitness</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : isRunning ? (
              <View style={styles.runningActions}>
                <TouchableOpacity onPress={handlePause} style={styles.actionBtn}>
                  <View style={[styles.actionBtnFlat, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                    <MaterialCommunityIcons
                      name={isPaused ? 'play' : 'pause'}
                      size={24}
                      color={isDark ? '#F9FAFB' : '#374151'}
                    />
                    <Text style={[styles.actionBtnFlatText, { color: isDark ? '#F9FAFB' : '#374151' }]}>
                      {isPaused ? 'Resume' : 'Pause'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStop} style={styles.actionBtn}>
                  <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.actionBtnGradient}>
                    <MaterialCommunityIcons name="stop-circle" size={22} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>End Session</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handleStart} style={styles.actionBtnWide}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.actionBtnGradient}>
                  <MaterialCommunityIcons name="meditation" size={22} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Start Focus Session</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Tips */}
          {!isRunning && !isCompleted && (
            <View style={[styles.tipCard, { backgroundColor: isDark ? '#1F2937' : '#EFF6FF', borderColor: isDark ? '#374151' : '#BFDBFE' }]}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#3B82F6" />
              <Text style={[styles.tipText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
                Put your phone face-down during focus sessions for best results. Stay consistent to build your streak!
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    minHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerRingOuter: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerRingBg: {
    position: 'absolute',
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    borderRadius: TIMER_SIZE / 2,
    borderWidth: 8,
  },
  timerRingProgress: {
    position: 'absolute',
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    borderRadius: TIMER_SIZE / 2,
    borderWidth: 8,
  },
  timerInner: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
  presetsContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  presetsLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionsContainer: {
    marginVertical: 20,
  },
  runningActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnWide: {
    width: '100%',
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 20,
  },
  actionBtnFlat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 20,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  actionBtnFlatText: {
    fontSize: 16,
    fontWeight: '800',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
