import React, {useEffect, useRef, useState} from 'react';
import {Animated, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import BlurContainer from './BlurContainer';
import type {CompassData} from '../types/home';

type CompassWidgetProps = {
  loading: boolean;
  error: string | null;
  data: CompassData | null;
};

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
      const degreeUpdateRate = 3;
      CompassHeading.start(degreeUpdateRate, ({heading}: {heading: number}) => {
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
  const cardinalDirection = data?.cardinalDirection ?? 'N';

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: headingDegrees,
      duration: 200,
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
        <View style={styles.dial}>
          <Animated.View style={[styles.needle, rotateStyle]} />
          <View style={styles.dialCenter} />
        </View>
        {loading ? (
          <Text style={styles.caption}>...</Text>
        ) : error ? (
          <Text style={styles.captionError}>!</Text>
        ) : (
          <Text style={styles.caption}>{cardinalDirection}</Text>
        )}
      </Pressable>

      <BlurContainer visible={expanded} onClose={() => setExpanded(false)} expandedFraction={0.4}>
        <View style={styles.detail}>
          <Text style={styles.detailTitle}>Compass</Text>
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
    width: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 10,
    alignItems: 'center',
    gap: 4,
    minHeight: 88,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dial: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  needle: {
    position: 'absolute',
    width: 2,
    height: 18,
    backgroundColor: '#DC2626',
    top: 4,
    borderRadius: 1,
  },
  dialCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#334155',
  },
  caption: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  captionError: {
    fontSize: 12,
    color: '#B91C1C',
  },
  detail: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailCardinal: {
    fontSize: 20,
    color: '#475569',
    fontWeight: '600',
  },
  detailError: {
    fontSize: 12,
    color: '#B91C1C',
  },
});

export default CompassWidget;
