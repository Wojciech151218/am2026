import {useCallback, useEffect, useState} from 'react';
import type {RecommendationItem} from '../types/home';
import type {Coordinates} from '../types/location';
import {mockDelay} from './mockApi';

type RecommendationContext = {
  query?: string;
  location?: Coordinates;
};

type UseRecommendationsApiResult = {
  data: RecommendationItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useRecommendationsApi(
  context: RecommendationContext,
): UseRecommendationsApiResult {
  const [data, setData] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await mockDelay(450);
      const area = context.location ? 'near your location' : 'for you';
      setData([
        {
          id: 'rec_1',
          title: 'Weekend market',
          description: `Popular local event ${area}.`,
        },
        {
          id: 'rec_2',
          title: 'Coastal walking route',
          description: 'Scenic route with moderate difficulty.',
        },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to load recommendations.',
      );
    } finally {
      setLoading(false);
    }
  }, [context.location]);

  useEffect(() => {
    refetch().catch(() => null);
  }, [context.location, refetch]);

  return {data, loading, error, refetch};
}
