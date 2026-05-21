import type {UserProfile} from '../../types/profile';
import {getUserById} from '../repositories/userRepository';
import {fetchUserLocationHistory} from './userLocationHistory';

export async function fetchCurrentUserProfile(
  currentUserId: string,
  options?: {
    viewedUserId?: string;
    historyLimit?: number;
    historyOffset?: number;
  },
): Promise<UserProfile | null> {
  const targetUserId = options?.viewedUserId ?? currentUserId;
  const isCurrentUser = targetUserId === currentUserId;
  const user = await getUserById(targetUserId);

  if (!user) {
    return null;
  }

  const locationHistory =
    options?.historyLimit === 0
      ? []
      : await fetchUserLocationHistory({
          userId: targetUserId,
          limit: options?.historyLimit ?? 10,
          offset: options?.historyOffset ?? 0,
        });

  return {
    id: user.id,
    displayName: user.displayName,
    bio: user.bio ?? '',
    homeCity: user.homeCity ?? '',
    isCurrentUser,
    settings: {
      notificationsEnabled: true,
      locationSharingEnabled: user.locationTrackingEnabled,
      theme: 'system',
    },
    locationHistory,
  };
}
