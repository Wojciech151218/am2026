import {useCallback, useEffect, useState} from 'react';
import type {UserProfile} from '../types/profile';
import {mockDelay} from './mockApi';

type UseProfileApiResult = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useProfileApi(userId?: string): UseProfileApiResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await mockDelay(300);
      const isCurrentUser = !userId;
      setProfile({
        id: userId ?? 'me',
        displayName: isCurrentUser ? 'You' : 'Guest Traveler',
        bio: isCurrentUser ? 'Planning smarter trips.' : 'Sharing selected profile details.',
        homeCity: isCurrentUser ? 'Warsaw' : '',
        isCurrentUser,
        settings: {
          notificationsEnabled: true,
          locationSharingEnabled: true,
          theme: 'system',
        },
        locationHistory: [
          {
            id: 'loc_1',
            label: 'City Center',
            coordinates: {latitude: 52.2297, longitude: 21.0122},
            visitedAt: new Date().toISOString(),
          },
          {
            id: 'loc_2',
            label: 'River Walk',
            coordinates: {latitude: 52.24, longitude: 21.02},
            visitedAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch().catch(() => null);
  }, [refetch]);

  return {profile, loading, error, refetch};
}
