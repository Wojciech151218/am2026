import type {Friend} from '../types/friend';
import type {UserProfile} from '../types/profile';

export function profileFromFriend(friend: Friend): UserProfile {
  return {
    id: friend.id,
    displayName: friend.displayName ?? friend.name,
    bio: friend.bio,
    homeCity: friend.homeCity,
    isCurrentUser: false,
    settings: {
      notificationsEnabled: true,
      locationSharingEnabled: friend.isOnline,
      theme: 'system',
    },
    locationHistory: [],
  };
}

export function minimalProfileFromIds(input: {
  id: string;
  displayName: string;
  bio?: string;
  homeCity?: string;
  locationSharingEnabled?: boolean;
}): UserProfile {
  return {
    id: input.id,
    displayName: input.displayName,
    bio: input.bio ?? '',
    homeCity: input.homeCity ?? '',
    isCurrentUser: false,
    settings: {
      notificationsEnabled: true,
      locationSharingEnabled: input.locationSharingEnabled ?? false,
      theme: 'system',
    },
    locationHistory: [],
  };
}
