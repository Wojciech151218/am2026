import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {CompassData} from '../types/home';

type CompassWidgetProps = {
  loading: boolean;
  error: string | null;
  data: CompassData | null;
};

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

function headingToCardinal(degrees: number): string {
  const index = Math.round(degrees / 45) % 8;
  return CARDINALS[index] ?? 'N';
}

function CompassWidget({loading, error, data}: CompassWidgetProps) {
  const headingDegrees = data?.headingDegrees ?? 0;
  const cardinalDirection = useMemo(
    () => headingToCardinal(headingDegrees),
    [headingDegrees],
  );

  return (
    <>
      <Pressable
        style={styles.widget}
        onPress={() => undefined}
        accessibilityRole="button"
        accessibilityLabel="Compass">
        <Text style={styles.title}>Compass</Text>
        <View style={styles.compassWrap}>
          <View style={[styles.needleWrap, {transform: [{rotate: `${headingDegrees}deg`}]}]}>
            <View style={styles.needleNorth} />
            <View style={styles.needleSouth} />
          </View>
          <View style={styles.centerDot} />
        </View>
        {loading ? (
          <Text style={styles.captionMuted}>Calibrating...</Text>
        ) : error ? (
          <Text style={styles.captionError}>Unavailable</Text>
        ) : (
          <Text style={styles.caption}>
            {cardinalDirection} · {Math.round(headingDegrees)}°
          </Text>
        )}
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  widget: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    alignItems: 'center',
    gap: 6,
    minHeight: 120,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    alignSelf: 'flex-start',
  },
  compassWrap: {
    width: '100%',
    minHeight: 92,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  needleWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleNorth: {
    position: 'absolute',
    width: 3,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#DC2626',
    top: 4,
  },
  needleSouth: {
    position: 'absolute',
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#64748B',
    bottom: 7,
  },
  centerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F172A',
  },
  caption: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  captionMuted: {
    fontSize: 12,
    color: '#94A3B8',
  },
  captionError: {
    fontSize: 12,
    color: '#B91C1C',
  },
});

export default CompassWidget;
