import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

type LocationPressableCardProps = {
  title: string;
  subtitle?: string;
  tags?: string[];
  highlighted?: boolean;
  onPress?: () => void;
  actionLabel?: string;
  onPressAction?: () => void;
};

function LocationPressableCard({
  title,
  subtitle,
  tags = [],
  highlighted = false,
  onPress,
  actionLabel,
  onPressAction,
}: LocationPressableCardProps) {
  return (
    <Pressable
      style={({pressed}) => [
        styles.card,
        highlighted && styles.cardHighlighted,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button">
      <View style={styles.main}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {tags.length > 0 ? <Text style={styles.tags}>{tags.join(' • ')}</Text> : null}
      </View>
      {actionLabel && onPressAction ? (
        <Pressable style={styles.actionButton} onPress={onPressAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardHighlighted: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  cardPressed: {
    opacity: 0.9,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#334155',
  },
  tags: {
    fontSize: 12,
    color: '#64748B',
  },
  actionButton: {
    borderRadius: 10,
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default LocationPressableCard;
