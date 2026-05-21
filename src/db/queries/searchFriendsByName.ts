import {and, eq, like, ne, or} from 'drizzle-orm';
import {friendships, users} from '../../entities';
import type {FriendSearchResult} from '../../types/friend';
import type {Coordinates} from '../../types/location';
import {getDatabase} from '../client';
import {distanceKm} from '../utils/geo';
import {getUserById} from '../repositories/userRepository';

export type SearchFriendsByNameParams = {
  currentUserId: string;
  query: string;
  limit?: number;
  origin?: Coordinates | null;
};

export async function searchFriendsByName(
  params: SearchFriendsByNameParams,
): Promise<FriendSearchResult[]> {
  const db = getDatabase();
  const limit = params.limit ?? 20;
  const trimmed = params.query.trim();
  const currentUser = await getUserById(params.currentUserId);

  const origin: Coordinates | null =
    params.origin ??
    (currentUser?.currentLatitude != null && currentUser?.currentLongitude != null
      ? {
          latitude: currentUser.currentLatitude,
          longitude: currentUser.currentLongitude,
        }
      : null);

  const namePattern = trimmed.length > 0 ? `%${trimmed}%` : '%';

  const candidates = await db
    .select()
    .from(users)
    .where(and(ne(users.id, params.currentUserId), like(users.displayName, namePattern)))
    .limit(limit * 3);

  const existingFriendships = await db
    .select()
    .from(friendships)
    .where(
      or(eq(friendships.userAId, params.currentUserId), eq(friendships.userBId, params.currentUserId)),
    );

  const relatedUserIds = new Set<string>();
  existingFriendships.forEach(row => {
    relatedUserIds.add(row.userAId);
    relatedUserIds.add(row.userBId);
  });

  const scored = candidates.map(user => {
    let distance: number | null = null;
    if (
      origin &&
      user.currentLatitude != null &&
      user.currentLongitude != null
    ) {
      distance = distanceKm(origin, {
        latitude: user.currentLatitude,
        longitude: user.currentLongitude,
      });
    }

    const mutualFriendsCount = relatedUserIds.has(user.id) ? 1 : 0;
    const subtitle =
      distance != null
        ? `${distance.toFixed(1)} km away`
        : user.locationTrackingEnabled
          ? 'Location sharing on'
          : 'No shared location';

    return {
      id: user.id,
      title: user.displayName || 'Traveler',
      subtitle,
      tags: user.homeCity ? [user.homeCity] : [],
      mutualFriendsCount,
      distanceKm: distance ?? Number.POSITIVE_INFINITY,
    };
  });

  scored.sort((a, b) => a.distanceKm - b.distanceKm);

  return scored.slice(0, limit).map(({distanceKm: _distance, ...result}) => result);
}
