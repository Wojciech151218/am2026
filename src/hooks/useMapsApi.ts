import {useCallback, useEffect, useState} from 'react';
import type {MapPreview} from '../types/home';
import type {Coordinates} from '../types/location';
import {mockDelay} from './mockApi';

type UseMapsApiResult = {
  data: MapPreview | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useMapsApi(center: Coordinates): UseMapsApiResult {
  const [data, setData] = useState<MapPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await mockDelay(300);
      setData({
        center,
        zoom: 13,
        provider: 'google',
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load map.');
    } finally {
      setLoading(false);
    }
  }, [center]);

  useEffect(() => {
    refetch().catch(() => null);
  }, [refetch]);

  return {data, loading, error, refetch};
}
