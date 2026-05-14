import {useCallback, useEffect, useState} from 'react';
import type {WeatherSummary} from '../types/home';
import type {Coordinates} from '../types/location';
import {mockDelay} from './mockApi';

type UseWeatherApiResult = {
  data: WeatherSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useWeatherApi(location: Coordinates): UseWeatherApiResult {
  const [data, setData] = useState<WeatherSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await mockDelay();
      setData({
        condition: 'Partly cloudy',
        temperatureC: 21,
        humidityPercent: 58,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load weather.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch().catch(() => null);
  }, [location.latitude, location.longitude, refetch]);

  return {data, loading, error, refetch};
}
