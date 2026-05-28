import {useCallback, useEffect, useState} from 'react';
import {Platform} from 'react-native';
import CompassHeading from 'react-native-compass-heading';
import type {CompassData} from '../types/home';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    // No-op: compass updates from sensor subscription when available.
    return Promise.resolve();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const fallbackHeading = 0;
      setData({headingDegrees: fallbackHeading, cardinalDirection: toCardinal(fallbackHeading)});
      setError('Compass sensor unavailable on web.');
      setLoading(false);
      return;
    }

    let cleanup: (() => void) | null = null;
    try {
      CompassHeading.start(3, ({heading}: {heading: number}) => {
        const normalized = ((heading % 360) + 360) % 360;
        setData({
          headingDegrees: normalized,
          cardinalDirection: toCardinal(normalized),
        });
        setError(null);
        setLoading(false);
      });
      cleanup = () => {
        CompassHeading.stop();
      };
    } catch (requestError) {
      const fallbackHeading = 0;
      setData({headingDegrees: fallbackHeading, cardinalDirection: toCardinal(fallbackHeading)});
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to access compass sensor.',
      );
      setLoading(false);
    }

    return () => {
      cleanup?.();
    };
  }, []);

  return {data, loading, error, refetch};
}
