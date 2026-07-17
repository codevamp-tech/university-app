/**
 * SafeStudentAvatar.js
 *
 * A drop-in <Image> replacement for student avatars.
 * Tries the provided URI first; if it fails (e.g. no ERP photo uploaded),
 * it renders a colour-branded initials box instead.
 *
 * Props:
 *   uri          – resolved avatar URL (ERP photo or custom upload)
 *   name         – student name used to derive initials on fallback
 *   style        – ViewStyle / ImageStyle applied to both image and fallback box
 *   textStyle    – (optional) TextStyle for the initials text
 *   primaryColor – (optional) background colour for initials box (default #EA580C)
 */

import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';

export function SafeStudentAvatar({
  uri,
  name = 'S',
  style = {},
  textStyle = {},
  primaryColor = '#EA580C',
}) {
  const [errored, setErrored] = useState(false);

  // Derive initials from name (up to 2 chars)
  const initials = (name || 'S')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  // Show initials when no URI or image failed to load
  if (errored || !uri) {
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

  return (
    <Image
      source={{ uri }}
      style={style}
      onError={() => setErrored(true)}
    />
  );
}
