import {useMemo} from 'react';
import type {FriendSearchResult} from '../types/friend';
import type {SearchFilters} from '../types/search';
import {useSearchApi} from './useSearchApi';

type UseFriendSearchApiResult = {
  results: FriendSearchResult[];
  loading: boolean;
  error: string | null;
  executeSearch: (query: string, filters: SearchFilters) => Promise<void>;
};

export function useFriendSearchApi(): UseFriendSearchApiResult {
  const friendFactory = useMemo(
    () => (query: string, filters: SearchFilters): FriendSearchResult[] => {
      const base = query || 'Traveler';
      return [
        {
          id: 'friend_result_1',
          title: `${base} Alex`,
          subtitle: `Likes ${filters.type}`,
          tags: ['hiking', 'city walks'],
          mutualFriendsCount: 5,
        },
        {
          id: 'friend_result_2',
          title: `${base} Jamie`,
          subtitle: 'Nearby traveler',
          tags: ['food', 'events'],
          mutualFriendsCount: 2,
        },
      ];
    },
    [],
  );

  const {results, loading, error, executeSearch} = useSearchApi<FriendSearchResult>(friendFactory);

  return {results, loading, error, executeSearch};
}
