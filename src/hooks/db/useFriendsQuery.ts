import {useCallback} from 'react';
import {Platform} from 'react-native';
import {fetchAcceptedAndPendingFriends} from '../../db/queries/friendsWithUsers';
import type {Friend} from '../../types/friend';
import {useFriendsApi} from '../useFriendsApi';
import {useDb} from './useDb';
import {useLocalQuery} from './useLocalQuery';

type UseFriendsQueryResult = {
  friends: Friend[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useFriendsQuery(): UseFriendsQueryResult {
  const mockApi = useFriendsApi();
  const {currentUserId, isLocalDbEnabled, ready} = useDb();

  const queryFn = useCallback(async () => {
    if (!currentUserId) {
      return [];
    }
    return fetchAcceptedAndPendingFriends(currentUserId);
  }, [currentUserId]);

  const localQuery = useLocalQuery('friends', queryFn, [] as Friend[]);

  if (Platform.OS === 'web' || !isLocalDbEnabled || !ready || !currentUserId) {
    return mockApi;
  }

  return {
    friends: localQuery.data,
    loading: localQuery.loading,
    error: localQuery.error,
    refetch: localQuery.refetch,
  };
}
