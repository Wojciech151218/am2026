import {useCallback, useState} from 'react';
import {Platform} from 'react-native';
import {flushOutboundSync} from '../../db/sync/coordinator';
import {appendLocationSnapshot} from '../../db/repositories/locationRepository';
import type {Coordinates} from '../../types/location';
import {useDb} from '../db/useDb';

type PostUserLocationInput = Coordinates & {
  label: string;
  city?: string;
};

type UsePostUserLocationResult = {
  loading: boolean;
  error: string | null;
  postUserLocation: (input: PostUserLocationInput) => Promise<boolean>;
};

export function usePostUserLocation(): UsePostUserLocationResult {
  const {currentUserId, isLocalDbEnabled} = useDb();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postUserLocation = useCallback(
    async (input: PostUserLocationInput) => {
      if (!currentUserId) {
        setError('You must be signed in to post a location.');
        return false;
      }

      if (Platform.OS === 'web' || !isLocalDbEnabled) {
        setError('Local database is only available on native platforms.');
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        await appendLocationSnapshot({
          userId: currentUserId,
          label: input.label,
          city: input.city,
          latitude: input.latitude,
          longitude: input.longitude,
        });
        await flushOutboundSync();
        return true;
      } catch (mutationError) {
        setError(mutationError instanceof Error ? mutationError.message : 'Unable to post location.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, isLocalDbEnabled],
  );

  return {loading, error, postUserLocation};
}
