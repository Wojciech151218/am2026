import {useCallback, useState} from 'react';
import type {SearchFilters, SearchResult} from '../types/search';
import {mockDelay} from './mockApi';

type UseSearchApiResult<T extends SearchResult> = {
  results: T[];
  loading: boolean;
  error: string | null;
  executeSearch: (query: string, filters: SearchFilters) => Promise<void>;
};

type SearchResultFactory<T extends SearchResult> = (
  query: string,
  filters: SearchFilters,
) => T[];

const defaultFactory: SearchResultFactory<SearchResult> = (query, filters) => [
  {
    id: 'result_1',
    title: query ? `${query} Central Hub` : 'Central Hub',
    subtitle: `${filters.distanceKm}km radius`,
    tags: [filters.type, `rating>${filters.minRating}`],
  },
  {
    id: 'result_2',
    title: query ? `${query} Riverside` : 'Riverside',
    subtitle: 'Open now',
    tags: ['recommended', 'popular'],
  },
];

export function useSearchApi<T extends SearchResult = SearchResult>(
  resultFactory?: SearchResultFactory<T>,
): UseSearchApiResult<T> {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSearch = useCallback(
    async (query: string, filters: SearchFilters) => {
      setLoading(true);
      setError(null);
      try {
        await mockDelay(400);
        const factory = resultFactory ?? (defaultFactory as SearchResultFactory<T>);
        setResults(factory(query, filters));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Search failed.');
      } finally {
        setLoading(false);
      }
    },
    [resultFactory],
  );

  return {results, loading, error, executeSearch};
}
