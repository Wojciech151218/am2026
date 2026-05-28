import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import BlurContainer from './BlurContainer';
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
  const rotation = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let subscription: {remove: () => void} | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const CompassHeading = require('react-native-compass-heading');
      CompassHeading.start(2, ({heading}: {heading: number}) => {
        setDeviceHeading(heading);
      });
      subscription = {
        remove: () => {
          CompassHeading.stop();
        },
      };
    } catch {
      subscription = null;
    }

    return () => {
      subscription?.remove();
    };
  }, []);

  const headingDegrees = deviceHeading ?? data?.headingDegrees ?? 0;
  const cardinalDirection = useMemo(
    () => headingToCardinal(headingDegrees),
    [headingDegrees],
  );

  useEffect(() => {
    Animated.spring(rotation, {
      toValue: headingDegrees,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [headingDegrees, rotation]);

  const rotateStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <>
      <Pressable
        style={styles.widget}
        onPress={() => setExpanded(true)}
        accessibilityRole="button"
        accessibilityLabel="Compass">
        <Text style={styles.title}>Compass</Text>
        <View style={styles.dialOuter}>
          <View style={styles.dial}>
            <Text style={[styles.tick, styles.tickNorth]}>N</Text>
            <Text style={[styles.tick, styles.tickEast]}>E</Text>
            <Text style={[styles.tick, styles.tickSouth]}>S</Text>
            <Text style={[styles.tick, styles.tickWest]}>W</Text>
            <Animated.View style={[styles.needleNorth, rotateStyle]} />
            <Animated.View style={[styles.needleSouth, rotateStyle]} />
            <View style={styles.dialCenter} />
          </View>
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

      <BlurContainer
        visible={expanded}
        onClose={() => setExpanded(false)}
        expandedFraction={0.42}
        position="center"
        horizontalInset={20}>
        <View style={styles.detail}>
          <Text style={styles.detailTitle}>Heading</Text>
          <View style={styles.detailDialOuter}>
            <View style={styles.detailDial}>
              <Animated.View style={[styles.detailNeedleNorth, rotateStyle]} />
              <Animated.View style={[styles.detailNeedleSouth, rotateStyle]} />
              <View style={styles.detailDialCenter} />
            </View>
          </View>
          <Text style={styles.detailValue}>{Math.round(headingDegrees)}°</Text>
          <Text style={styles.detailCardinal}>{cardinalDirection}</Text>
          {error ? <Text style={styles.detailError}>{error}</Text> : null}
        </View>
      </BlurContainer>
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
  dialOuter: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dial: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  tick: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tickNorth: {top: 4},
  tickEast: {right: 5},
  tickSouth: {bottom: 4},
  tickWest: {left: 5},
  needleNorth: {
    position: 'absolute',
    width: 3,
    height: 22,
    backgroundColor: '#DC2626',
    top: 6,
    borderRadius: 2,
  },
  needleSouth: {
    position: 'absolute',
    width: 3,
    height: 14,
    backgroundColor: '#64748B',
    bottom: 8,
    borderRadius: 2,
  },
  dialCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  detail: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailDialOuter: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
  },
  detailDial: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  detailNeedleNorth: {
    position: 'absolute',
    width: 4,
    height: 46,
    backgroundColor: '#DC2626',
    top: 12,
    borderRadius: 2,
  },
  detailNeedleSouth: {
    position: 'absolute',
    width: 4,
    height: 28,
    backgroundColor: '#64748B',
    bottom: 14,
    borderRadius: 2,
  },
  detailDialCenter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  detailValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailCardinal: {
    fontSize: 18,
    color: '#475569',
    fontWeight: '600',
  },
  detailError: {
    fontSize: 12,
    color: '#B91C1C',
  },
});

export default CompassWidget;
