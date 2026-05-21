import {useCallback, useEffect, useState} from 'react';
import type {Friend} from '../types/friend';
import {mockDelay} from './mockApi';

type UseFriendsApiResult = {
  friends: Friend[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useFriendsApi(): UseFriendsApiResult {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await mockDelay(300);
      setFriends([
        {
          id: 'friend_1',
          name: 'Alex',
          displayName: 'Alex',
          bio: 'Weekend explorer.',
          homeCity: 'Krakow',
          isOnline: true,
          sharedLocation: {
            latitude: 52.2297,
            longitude: 21.0122,
            label: 'Warsaw Old Town',
            sharedAt: new Date().toISOString(),
          },
        },
        {
          id: 'friend_2',
          name: 'Jamie',
          displayName: 'Jamie',
          bio: '',
          homeCity: '',
          isOnline: false,
        },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load friends.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch().catch(() => null);
  }, [refetch]);

  return {friends, loading, error, refetch};
}
