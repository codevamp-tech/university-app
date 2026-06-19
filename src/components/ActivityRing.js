import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function ActivityRing({ radius = 60, stroke = 12, progress = 0, color = '#EF4444', bgColor = '#EF444420' }) {
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - Math.min(Math.max(progress, 0), 1) * circumference;

  return (
    <View style={{ position: 'absolute', width: radius * 2, height: radius * 2, justifyContent: 'center', alignItems: 'center' }}>
      <Svg height={radius * 2} width={radius * 2} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          stroke={bgColor}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <Circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </Svg>
    </View>
  );
}
