import {useCallback, useEffect, useState} from 'react';
import type {IncomingFriendRequest} from '../types/friend';
import {mockDelay} from './mockApi';

type UseIncomingFriendRequestsApiResult = {
  requests: IncomingFriendRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useIncomingFriendRequestsApi(): UseIncomingFriendRequestsApiResult {
  const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await mockDelay(300);
      setRequests([]);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to load friend requests.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch().catch(() => null);
  }, [refetch]);

  return {requests, loading, error, refetch};
}
