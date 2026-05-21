import {useCallback} from 'react';
import {Platform} from 'react-native';
import {fetchCurrentUserProfile} from '../../db/queries/currentUserProfile';
import type {UserProfile} from '../../types/profile';
import {useProfileApi} from '../useProfileApi';
import {useDb} from './useDb';
import {useLocalQuery} from './useLocalQuery';

type UseProfileQueryOptions = {
  userId?: string;
  historyLimit?: number;
  historyOffset?: number;
};

type UseProfileQueryResult = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useProfileQuery(options?: UseProfileQueryOptions): UseProfileQueryResult {
  const mockApi = useProfileApi(options?.userId);
  const {currentUserId, isLocalDbEnabled, ready} = useDb();
  const historyLimit = options?.historyLimit ?? 10;
  const historyOffset = options?.historyOffset ?? 0;

  const queryFn = useCallback(async () => {
    if (!currentUserId) {
      return null;
    }
    return fetchCurrentUserProfile(currentUserId, {
      viewedUserId: options?.userId,
      historyLimit,
      historyOffset,
    });
  }, [currentUserId, options?.userId, historyLimit, historyOffset]);

  const queryKey = `profile:${options?.userId ?? 'me'}:${historyLimit}:${historyOffset}`;
  const localQuery = useLocalQuery(queryKey, queryFn, null as UserProfile | null);

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
