import {useCallback, useEffect, useState, useSyncExternalStore} from 'react';
import {getDbVersion, subscribeDb} from '../../db/reactivity';

type UseLocalQueryResult<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useLocalQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  initialData: T,
): UseLocalQueryResult<T> {
  const dbVersion = useSyncExternalStore(subscribeDb, getDbVersion, getDbVersion);
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Query failed.');
    } finally {
      setLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    refetch().catch(() => null);
  }, [refetch, dbVersion, key]);

  return {data, loading, error, refetch};
}
