import {useCallback} from 'react';
import {Platform} from 'react-native';
import {fetchIncomingFriendRequests} from '../../db/queries/friendsWithUsers';
import type {IncomingFriendRequest} from '../../types/friend';
import {useIncomingFriendRequestsApi} from '../useIncomingFriendRequestsApi';
import {useDb} from './useDb';
import {useLocalQuery} from './useLocalQuery';

type UseIncomingFriendRequestsQueryResult = {
  requests: IncomingFriendRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useIncomingFriendRequestsQuery(): UseIncomingFriendRequestsQueryResult {
  const mockApi = useIncomingFriendRequestsApi();
  const {currentUserId, isLocalDbEnabled, ready} = useDb();

  const queryFn = useCallback(async () => {
    if (!currentUserId) {
      return [];
    }
    return fetchIncomingFriendRequests(currentUserId);
  }, [currentUserId]);

  const localQuery = useLocalQuery('incoming-friend-requests', queryFn, [] as IncomingFriendRequest[]);

  if (Platform.OS === 'web' || !isLocalDbEnabled || !ready || !currentUserId) {
    return mockApi;
  }

  return {
    requests: localQuery.data,
    loading: localQuery.loading,
    error: localQuery.error,
    refetch: localQuery.refetch,
  };
}
