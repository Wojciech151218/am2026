import {useCallback, useState} from 'react';
import {Platform} from 'react-native';
import {fetchUserLocationHistory} from '../../db/queries/userLocationHistory';
import type {LocationHistoryItem} from '../../types/location';
import {useDb} from './useDb';

type UseProfileLocationHistoryOptions = {
  userId: string;
  pageSize?: number;
};

type UseProfileLocationHistoryResult = {
  items: LocationHistoryItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reset: () => Promise<void>;
};

export function useProfileLocationHistory(
  options: UseProfileLocationHistoryOptions,
): UseProfileLocationHistoryResult {
  const pageSize = options.pageSize ?? 10;
  const {currentUserId, isLocalDbEnabled, ready} = useDb();
  const [items, setItems] = useState<LocationHistoryItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (!options.userId || Platform.OS === 'web' || !isLocalDbEnabled || !ready) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const page = await fetchUserLocationHistory({
          userId: options.userId,
          limit: pageSize,
          offset: nextOffset,
        });
        setItems(previous => (append ? [...previous, ...page] : page));
        setOffset(nextOffset + page.length);
        setHasMore(page.length === pageSize);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load history.');
      } finally {
        setLoading(false);
      }
    },
    [options.userId, pageSize, isLocalDbEnabled, ready],
  );

  const reset = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await fetchPage(0, false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) {
      return;
    }
    await fetchPage(offset, true);
  }, [fetchPage, hasMore, loading, offset]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
  };
}
