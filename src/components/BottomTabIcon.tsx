import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type BottomTabIconProps = {
  label: string;
  focused: boolean;
};

function BottomTabIcon({label, focused}: BottomTabIconProps) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.iconDot, focused && styles.iconDotFocused]} />
      <Text style={[styles.iconLabel, focused && styles.iconLabelFocused]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
  },
  iconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#94A3B8',
    marginBottom: 4,
  },
  iconDotFocused: {
    backgroundColor: '#2563EB',
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  iconLabelFocused: {
    color: '#2563EB',
    fontWeight: '700',
  },
});

export default BottomTabIcon;
