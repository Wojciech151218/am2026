import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle} from 'react-native';

type DestructiveActionButtonProps = {
  label: string;
  loadingLabel?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  fillWidth?: boolean;
};

function DestructiveActionButton({
  label,
  loadingLabel,
  onPress,
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
  fillWidth = false,
}: DestructiveActionButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({pressed}) => [
        styles.button,
        fillWidth && styles.buttonFillWidth,
        style,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}>
      {loading ? (
        <ActivityIndicator color="#B91C1C" size="small" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
      {loading && loadingLabel ? <Text style={styles.loadingHint}>{loadingLabel}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  buttonFillWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  buttonPressed: {
    backgroundColor: '#FEE2E2',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B91C1C',
  },
  loadingHint: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 4,
  },
});

export default DestructiveActionButton;
