import {useCallback, useEffect, useRef} from 'react';
import {Platform} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {reverseGeocode} from '../api/googleGeocoding';
import {flushOutboundSync} from '../db/sync/coordinator';
import {distanceKm} from '../db/utils/geo';
import {
  clearCurrentCoordinates,
  updateCurrentCoordinates,
} from '../db/repositories/userRepository';
import {useDb} from './db/useDb';

type UseLiveLocationTrackerOptions = {
  trackingEnabled: boolean;
};

const DEBOUNCE_MS = 2000;
const MIN_DISTANCE_KM = 0.025;

export function useLiveLocationTracker({trackingEnabled}: UseLiveLocationTrackerOptions): void {
  const {currentUserId, isLocalDbEnabled, ready} = useDb();
  const watchIdRef = useRef<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWriteRef = useRef<{lat: number; lng: number} | null>(null);
  const geocodeCacheRef = useRef<Map<string, string>>(new Map());

  const resolveLabel = useCallback(async (latitude: number, longitude: number): Promise<string> => {
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const cached = geocodeCacheRef.current.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const place = await reverseGeocode({latitude, longitude});
      const label = place.label.trim() || 'Current location';
      geocodeCacheRef.current.set(cacheKey, label);
      return label;
    } catch {
      return 'Current location';
    }
  }, []);

  const writePosition = useCallback(
    async (latitude: number, longitude: number, force = false) => {
      if (!currentUserId || !isLocalDbEnabled || !ready) {
        return;
      }

      const last = lastWriteRef.current;
      if (last && !force) {
        const movedKm = distanceKm(
          {latitude: last.lat, longitude: last.lng},
          {latitude, longitude},
        );
        if (movedKm < MIN_DISTANCE_KM) {
          return;
        }
      }

      lastWriteRef.current = {lat: latitude, lng: longitude};
      const label = await resolveLabel(latitude, longitude);
      await updateCurrentCoordinates(currentUserId, {latitude, longitude, label});
      await flushOutboundSync().catch(() => null);
    },
    [currentUserId, isLocalDbEnabled, ready, resolveLabel],
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
      geocodeCacheRef.current.clear();
      return stopWatch;
    }

    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        writePosition(latitude, longitude, true).catch(() => null);
      },
      () => undefined,
      {enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000},
    );

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
        distanceFilter: 20,
        interval: 8_000,
        fastestInterval: 4_000,
      },
    );

    return stopWatch;
  }, [trackingEnabled, currentUserId, isLocalDbEnabled, ready, writePosition]);
}
