import React, { useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Image component wrapped with a skeleton loader overlay while the network image downloads.
 */
export const SkeletonImage = ({ source, style, resizeMode, borderRadius, ...props }) => {
  const [loading, setLoading] = useState(true);

  const containerStyle = [
    style,
    {
      overflow: 'hidden',
      backgroundColor: 'rgba(226, 232, 240, 0.6)',
      position: 'relative',
    },
    borderRadius !== undefined && { borderRadius },
  ];

  return (
    <View style={containerStyle}>
      <Image
        source={source}
        style={[StyleSheet.absoluteFillObject, style]}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
        {...props}
      />
      {loading && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              justify: 'center',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(241, 245, 249, 0.85)',
            },
          ]}
        >
          <ActivityIndicator size="small" color="#6366F1" />
        </View>
      )}
    </View>
  );
};

export default SkeletonImage;
