import {useCallback, useState} from 'react';
import {Platform} from 'react-native';
import {flushOutboundSync} from '../../db/sync/coordinator';
import {setLocationTracking} from '../../db/repositories/userRepository';
import {useDb} from '../db/useDb';

type UseToggleLocationTrackingResult = {
  loading: boolean;
  error: string | null;
  toggleLocationTracking: (enabled: boolean) => Promise<void>;
};

export function useToggleLocationTracking(): UseToggleLocationTrackingResult {
  const {currentUserId, isLocalDbEnabled} = useDb();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLocationTracking = useCallback(
    async (enabled: boolean) => {
      if (!currentUserId) {
        setError('You must be signed in to update location sharing.');
        return;
      }

      if (Platform.OS === 'web' || !isLocalDbEnabled) {
        setError('Local database is only available on native platforms.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await setLocationTracking(currentUserId, enabled);
        await flushOutboundSync();
      } catch (mutationError) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : 'Unable to update location sharing.',
        );
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, isLocalDbEnabled],
  );

  return {loading, error, toggleLocationTracking};
}
