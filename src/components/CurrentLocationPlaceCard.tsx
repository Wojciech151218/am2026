import React, {useCallback, useEffect, useState} from 'react';
import {Pressable, Share, StyleSheet, Text, View} from 'react-native';
import {googleMapsUrl, reverseGeocode} from '../api/googleGeocoding';
import {useToast} from './Toast';
import type {Coordinates} from '../types/location';

type CurrentLocationPlaceCardProps = {
  coordinates: Coordinates | null;
  trackingEnabled: boolean;
  loading?: boolean;
};

function CurrentLocationPlaceCard({
  coordinates,
  trackingEnabled,
  loading = false,
}: CurrentLocationPlaceCardProps) {
  const [placeLabel, setPlaceLabel] = useState('Current location');
  const [placeSecondary, setPlaceSecondary] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const {showToast} = useToast();

  useEffect(() => {
    if (!coordinates || !trackingEnabled) {
      return;
    }

    let cancelled = false;
    setGeocoding(true);
    reverseGeocode(coordinates)
      .then(result => {
        if (!cancelled) {
          setPlaceLabel(result.label);
          setPlaceSecondary(result.secondary);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlaceSecondary(
            `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`,
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setGeocoding(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [coordinates?.latitude, coordinates?.longitude, trackingEnabled]);

  const onShare = useCallback(async () => {
    if (!coordinates) {
      return;
    }
    const url = googleMapsUrl(coordinates);
    try {
      await Share.share({
        message: `${placeLabel}\n${url}`,
        url,
        title: placeLabel,
      });
    } catch {
      showToast('Share failed', {body: 'Unable to open the share sheet.', variant: 'error'});
    }
  }, [coordinates, placeLabel, showToast]);

  if (!trackingEnabled) {
    return (
      <View style={styles.cardDisabled}>
        <Text style={styles.disabledText}>Enable location tracking in Profile to see your place</Text>
      </View>
    );
  }

  if (!coordinates) {
    return (
      <View style={styles.cardDisabled}>
        <Text style={styles.disabledText}>
          {loading || geocoding ? 'Finding your location...' : 'Waiting for GPS signal...'}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
      onPress={onShare}
      accessibilityRole="button"
      accessibilityLabel="Share current location">
      <View style={styles.pin}>
        <Text style={styles.pinText}>📍</Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.primary} numberOfLines={1}>
          {geocoding ? 'Looking up place...' : placeLabel}
        </Text>
        <Text style={styles.secondary} numberOfLines={1}>
          {placeSecondary || `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`}
        </Text>
      </View>
      <Pressable
        style={styles.shareChip}
        onPress={onShare}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Share location">
        <Text style={styles.shareChipText}>Share</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
  },
  cardDisabled: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    padding: 12,
  },
  disabledText: {
    fontSize: 12,
    color: '#64748B',
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: {
    fontSize: 18,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  primary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  secondary: {
    fontSize: 12,
    color: '#64748B',
  },
  shareChip: {
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shareChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
});

export default CurrentLocationPlaceCard;
