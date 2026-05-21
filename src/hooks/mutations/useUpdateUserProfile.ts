import {useCallback, useState} from 'react';
import {Platform} from 'react-native';
import {flushOutboundSync} from '../../db/sync/coordinator';
import {getUserById, updateUserProfile} from '../../db/repositories/userRepository';
import {useDb} from '../db/useDb';

type UpdateUserProfileInput = {
  displayName?: string;
  bio?: string;
  homeCity?: string;
};

type UseUpdateUserProfileResult = {
  loading: boolean;
  error: string | null;
  updateProfile: (patch: UpdateUserProfileInput) => Promise<boolean>;
};

export function useUpdateUserProfile(): UseUpdateUserProfileResult {
  const {currentUserId, isLocalDbEnabled} = useDb();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(
    async (patch: UpdateUserProfileInput): Promise<boolean> => {
      if (!currentUserId) {
        setError('You must be signed in to update your profile.');
        return false;
      }

      if (Platform.OS === 'web' || !isLocalDbEnabled) {
        setError('Local database is only available on native platforms.');
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        const existing = await getUserById(currentUserId);
        const safePatch = {...patch};
        if (existing?.displayName != null && safePatch.displayName != null) {
          delete safePatch.displayName;
        }
        await updateUserProfile(currentUserId, safePatch);
        await flushOutboundSync();
        return true;
      } catch (mutationError) {
        setError(mutationError instanceof Error ? mutationError.message : 'Unable to update profile.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, isLocalDbEnabled],
  );

  return {loading, error, updateProfile};
}
