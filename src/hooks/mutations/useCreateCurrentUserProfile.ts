import {useCallback, useState} from 'react';
import {Platform} from 'react-native';
import {createCurrentUserProfile} from '../../db/repositories/userRepository';
import {flushOutboundSync} from '../../db/sync/coordinator';
import {publishCurrentUserProfile} from '../../firebase/profile';
import {useDb} from '../db/useDb';

type CreateCurrentUserProfileInput = {
  email: string | null;
  displayName: string;
  bio?: string;
  homeCity?: string;
};

type UseCreateCurrentUserProfileResult = {
  loading: boolean;
  error: string | null;
  createProfile: (input: CreateCurrentUserProfileInput) => Promise<boolean>;
};

export function useCreateCurrentUserProfile(): UseCreateCurrentUserProfileResult {
  const {currentUserId, isLocalDbEnabled} = useDb();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProfile = useCallback(
    async (input: CreateCurrentUserProfileInput): Promise<boolean> => {
      if (!currentUserId) {
        setError('You must be signed in to create your profile.');
        return false;
      }

      if (Platform.OS === 'web' || !isLocalDbEnabled) {
        setError('Local database is only available on native platforms.');
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        const bio = input.bio?.trim() ?? '';
        const homeCity = input.homeCity?.trim() ?? '';
        const displayName = input.displayName.trim();
        await createCurrentUserProfile({
          id: currentUserId,
          email: input.email,
          displayName,
          bio,
          homeCity,
        });
        await publishCurrentUserProfile({
          uid: currentUserId,
          email: input.email,
          displayName,
          bio,
          homeCity,
        });
        await flushOutboundSync();
        return true;
      } catch (mutationError) {
        setError(
          mutationError instanceof Error ? mutationError.message : 'Unable to create profile.',
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, isLocalDbEnabled],
  );

  return {loading, error, createProfile};
}
