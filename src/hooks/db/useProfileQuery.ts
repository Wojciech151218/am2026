import {useCallback} from 'react';
import {Platform} from 'react-native';
import {fetchCurrentUserProfile} from '../../db/queries/currentUserProfile';
import type {UserProfile} from '../../types/profile';
import {useProfileApi} from '../useProfileApi';
import {useDb} from './useDb';
import {useLocalQuery} from './useLocalQuery';

type UseProfileQueryResult = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useProfileQuery(userId?: string): UseProfileQueryResult {
  const mockApi = useProfileApi(userId);
  const {currentUserId, isLocalDbEnabled, ready} = useDb();

  const queryFn = useCallback(async () => {
    if (!currentUserId) {
      return null;
    }
    return fetchCurrentUserProfile(currentUserId, {viewedUserId: userId});
  }, [currentUserId, userId]);

  const localQuery = useLocalQuery('profile', queryFn, null as UserProfile | null);

  if (Platform.OS === 'web' || !isLocalDbEnabled || !ready || !currentUserId) {
    return {
      profile: mockApi.profile,
      loading: mockApi.loading,
      error: mockApi.error,
      refetch: mockApi.refetch,
    };
  }

  return {
    profile: localQuery.data,
    loading: localQuery.loading,
    error: localQuery.error,
    refetch: localQuery.refetch,
  };
}
