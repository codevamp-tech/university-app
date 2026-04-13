import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  style,
  textStyle,
  loading = false,
  disabled = false,
}) => {
  const containerStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    variant === 'danger' && styles.danger,
    disabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    variant === 'primary' && styles.labelPrimary,
    variant === 'secondary' && styles.labelSecondary,
    variant === 'outline' && styles.labelOutline,
    variant === 'ghost' && styles.labelGhost,
    variant === 'danger' && styles.labelDanger,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {icon && <Ionicons name={icon} size={18} color={variant === 'primary' ? Colors.white : Colors.primary} style={{ marginRight: 6 }} />}
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.primary} />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
      {iconRight && <Ionicons name={iconRight} size={18} color={variant === 'primary' ? Colors.white : Colors.primary} style={{ marginLeft: 6 }} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.dangerLight,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  labelPrimary: { color: Colors.white },
  labelSecondary: { color: Colors.textPrimary },
  labelOutline: { color: Colors.primary },
  labelGhost: { color: Colors.primary },
  labelDanger: { color: Colors.danger },
});

export default Button;
