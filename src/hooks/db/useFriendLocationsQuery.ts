import {useCallback} from 'react';
import {Platform} from 'react-native';
import {
  fetchFriendLocationHistory,
  type FriendLocationHistoryParams,
} from '../../db/queries/friendLocationHistory';
import type {LocationHistoryItem} from '../../types/location';
import {useDb} from './useDb';
import {useLocalQuery} from './useLocalQuery';

type UseFriendLocationsQueryParams = Omit<FriendLocationHistoryParams, 'currentUserId'>;

type UseFriendLocationsQueryResult = {
  locations: LocationHistoryItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useFriendLocationsQuery(
  params: UseFriendLocationsQueryParams,
): UseFriendLocationsQueryResult {
  const {currentUserId, isLocalDbEnabled, ready} = useDb();

  const queryFn = useCallback(async () => {
    if (!currentUserId) {
      return [];
    }
    return fetchFriendLocationHistory({
      currentUserId,
      ...params,
    });
  }, [
    currentUserId,
    params.friendUserId,
    params.city,
    params.fromVisitedAtIso,
    params.toVisitedAtIso,
    params.limit,
    params.offset,
  ]);

  const localQuery = useLocalQuery(
    `friend-locations:${params.friendUserId}:${params.city ?? ''}`,
    queryFn,
    [] as LocationHistoryItem[],
  );

  if (Platform.OS === 'web' || !isLocalDbEnabled || !ready) {
    return {
      locations: [],
      loading: false,
      error: null,
      refetch: async () => undefined,
    };
  }

  return {
    locations: localQuery.data,
    loading: localQuery.loading,
    error: localQuery.error,
    refetch: localQuery.refetch,
  };
}
