/**
 * SafeStudentAvatar.js
 *
 * A drop-in <Image> replacement for student avatars.
 * Cycles through candidates (direct avatar_url, SRMS ERP documents across college codes/extensions).
 * If all fail, it gracefully renders the branded initials box.
 *
 * Props:
 *   uri          – resolved avatar URL (ERP photo or custom upload)
 *   rollno       – student roll number / registration number
 *   name         – student name used to derive initials on fallback
 *   style        – ViewStyle / ImageStyle applied to both image and fallback box
 *   textStyle    – (optional) TextStyle for the initials text
 *   primaryColor – (optional) background colour for initials box (default #EA580C)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAvatarCandidates } from '../utils/avatar';

export function SafeStudentAvatar({
  uri,
  rollno,
  name = 'S',
  style = {},
  textStyle = {},
  primaryColor = '#EA580C',
  isBot = false,
}) {
  const [candidateIndex, setCandidateIndex] = useState(0);

  const effectiveRoll = rollno || (typeof uri === 'string' && uri.match(/\/(\d{5,})\//) ? uri.match(/\/(\d{5,})\//)[1] : null);

  const isAiBot = isBot ||
    rollno === 'campus_ai_scholar' ||
    rollno === 'ai_bot' ||
    rollno === 'scholar_bot' ||
    (typeof name === 'string' && (
      name.toLowerCase().includes('ai scholar') ||
      name.toLowerCase().includes('scholar bot') ||
      name.toLowerCase().includes('ai bot') ||
      name.toLowerCase().includes('campus ai')
    ));

  const candidates = useMemo(() => {
    return getAvatarCandidates(uri, effectiveRoll);
  }, [uri, effectiveRoll]);

  useEffect(() => {
    setCandidateIndex(0);
  }, [uri, effectiveRoll]);

  // If this is an AI bot, render a beautiful dedicated AI Bot logo avatar
  if (isAiBot) {
    const rawWidth = typeof style.width === 'number' ? style.width : null;
    const rawHeight = typeof style.height === 'number' ? style.height : null;
    const size = rawWidth || rawHeight || 40;
    const iconSize = Math.round(size * 0.54);
    const radius = style.borderRadius !== undefined ? style.borderRadius : size / 2;

    return (
      <LinearGradient
        colors={['#7C3AED', '#4F46E5', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          style,
          {
            width: size,
            height: size,
            borderRadius: radius,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
        ]}
      >
        <MaterialCommunityIcons name="robot-excited-outline" size={iconSize} color="#FFFFFF" />
      </LinearGradient>
    );
  }

  // Derive initials from name (up to 2 chars)
  const initials = (name || 'S')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  // If no candidates or all candidates returned errors, show initials box
  if (candidates.length === 0 || candidateIndex >= candidates.length) {
    const size = style.width || style.height || 40;
    const fontSize = Math.round(size * 0.38);
    return (
      <View
        style={[
          style,
          {
            backgroundColor: primaryColor,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
        ]}
      >
        <Text
          style={[
            { color: '#FFFFFF', fontWeight: '800', fontSize },
            textStyle,
          ]}
        >
          {initials}
        </Text>
      </View>
    );
  }

  const currentUri = candidates[candidateIndex];

  return (
    <Image
      key={currentUri}
      source={{ uri: currentUri }}
      style={style}
      onError={() => {
        setCandidateIndex((prev) => prev + 1);
      }}
    />
  );
}

