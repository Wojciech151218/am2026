import {useCallback, useEffect, useState} from 'react';
import type {CompassData} from '../types/home';
import {mockDelay} from './mockApi';

type UseCompassApiResult = {
  data: CompassData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

function toCardinal(heading: number): string {
  if (heading >= 315 || heading < 45) {
    return 'N';
  }
  if (heading >= 45 && heading < 135) {
    return 'E';
  }
  if (heading >= 135 && heading < 225) {
    return 'S';
  }
  return 'W';
}

export function useCompassApi(): UseCompassApiResult {
  const [data, setData] = useState<CompassData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await mockDelay(250);
      const headingDegrees = 72;
      setData({
        headingDegrees,
        cardinalDirection: toCardinal(headingDegrees),
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load compass.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch().catch(() => null);
  }, [refetch]);

  return {data, loading, error, refetch};
}
