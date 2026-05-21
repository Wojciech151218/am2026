import {useCallback, useState} from 'react';
import {Platform} from 'react-native';
import {searchFriendsByName} from '../../db/queries/searchFriendsByName';
import type {FriendSearchResult} from '../../types/friend';
import {useFriendSearchApi} from '../useFriendSearchApi';
import type {SearchFilters} from '../../types/search';
import {useDb} from './useDb';

type UseFriendSearchQueryResult = {
  results: FriendSearchResult[];
  loading: boolean;
  error: string | null;
  executeSearch: (query: string, filters: SearchFilters) => Promise<void>;
};

export function useFriendSearchQuery(): UseFriendSearchQueryResult {
  const mockApi = useFriendSearchApi();
  const {currentUserId, isLocalDbEnabled, ready} = useDb();
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSearch = useCallback(
    async (query: string, _filters: SearchFilters) => {
      if (Platform.OS === 'web' || !isLocalDbEnabled || !ready || !currentUserId) {
        await mockApi.executeSearch(query, _filters);
        setResults(mockApi.results);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const rows = await searchFriendsByName({
          currentUserId,
          query,
          limit: 20,
        });
        setResults(rows);
      } catch (searchError) {
        setError(searchError instanceof Error ? searchError.message : 'Friend search failed.');
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, isLocalDbEnabled, ready, mockApi],
  );

  if (Platform.OS === 'web' || !isLocalDbEnabled || !ready) {
    return mockApi;
  }

  return {results, loading, error, executeSearch};
}
