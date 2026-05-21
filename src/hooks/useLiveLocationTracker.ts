import {useCallback, useEffect, useRef} from 'react';
import {Platform} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {flushOutboundSync} from '../db/sync/coordinator';
import {
  clearCurrentCoordinates,
  updateCurrentCoordinates,
} from '../db/repositories/userRepository';
import {useDb} from './db/useDb';

type UseLiveLocationTrackerOptions = {
  trackingEnabled: boolean;
};

const DEBOUNCE_MS = 3000;
const MIN_DISTANCE_M = 25;

function formatCoordsLabel(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export function useLiveLocationTracker({trackingEnabled}: UseLiveLocationTrackerOptions): void {
  const {currentUserId, isLocalDbEnabled, ready} = useDb();
  const watchIdRef = useRef<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWriteRef = useRef<{lat: number; lng: number} | null>(null);

  const writePosition = useCallback(
    async (latitude: number, longitude: number) => {
      if (!currentUserId || !isLocalDbEnabled || !ready) {
        return;
      }

      const last = lastWriteRef.current;
      if (last) {
        const dLat = latitude - last.lat;
        const dLng = longitude - last.lng;
        const approxM = Math.sqrt(dLat * dLat + dLng * dLng) * 111_000;
        if (approxM < MIN_DISTANCE_M) {
          return;
        }
      }

      lastWriteRef.current = {lat: latitude, lng: longitude};
      await updateCurrentCoordinates(currentUserId, {
        latitude,
        longitude,
        label: formatCoordsLabel(latitude, longitude),
      });
      await flushOutboundSync().catch(() => null);
    },
    [currentUserId, isLocalDbEnabled, ready],
  );

  useEffect(() => {
    if (Platform.OS === 'web' || !isLocalDbEnabled || !ready || !currentUserId) {
      return;
    }

    const stopWatch = () => {
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };

    if (!trackingEnabled) {
      stopWatch();
      clearCurrentCoordinates(currentUserId).catch(() => null);
      lastWriteRef.current = null;
      return stopWatch;
    }

    watchIdRef.current = Geolocation.watchPosition(
      position => {
        const {latitude, longitude} = position.coords;
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          writePosition(latitude, longitude).catch(() => null);
        }, DEBOUNCE_MS);
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        distanceFilter: MIN_DISTANCE_M,
        interval: 10_000,
        fastestInterval: 5_000,
      },
    );

    return stopWatch;
  }, [trackingEnabled, currentUserId, isLocalDbEnabled, ready, writePosition]);
}
