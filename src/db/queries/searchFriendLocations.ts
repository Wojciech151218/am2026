import {and, eq, or} from 'drizzle-orm';
import {friendships, locations, users} from '../../entities';
import type {FriendLocationSearchResult} from '../../types/search';
import type {Coordinates} from '../../types/location';
import {getDatabase} from '../client';
import {distanceKm, ratingFromDistanceKm, ratingFromVisitedAtIso} from '../utils/geo';
import {getUserById} from '../repositories/userRepository';

export type SearchFriendLocationsParams = {
  currentUserId: string;
  query: string;
  maxDistanceKm: number;
  minRating: number;
  limit?: number;
};

export async function searchFriendLocations(
  params: SearchFriendLocationsParams,
): Promise<FriendLocationSearchResult[]> {
  const db = getDatabase();
  const limit = params.limit ?? 30;
  const trimmed = params.query.trim().toLowerCase();
  const currentUser = await getUserById(params.currentUserId);

  const origin: Coordinates | null =
    currentUser?.currentLatitude != null && currentUser?.currentLongitude != null
      ? {
          latitude: currentUser.currentLatitude,
          longitude: currentUser.currentLongitude,
        }
      : null;

  const rows = await db
    .select({
      location: locations,
      friend: users,
    })
    .from(locations)
    .innerJoin(users, eq(locations.userId, users.id))
    .innerJoin(
      friendships,
      or(
        and(
          eq(friendships.userAId, params.currentUserId),
          eq(friendships.userBId, users.id),
        ),
        and(
          eq(friendships.userAId, users.id),
          eq(friendships.userBId, params.currentUserId),
        ),
      ),
    )
    .where(eq(friendships.status, 'accepted'));

  const filtered = rows.filter(({location, friend}) => {
    if (trimmed.length > 0) {
      const friendName = (friend.displayName ?? '').toLowerCase();
      const label = location.label.toLowerCase();
      const city = location.city.toLowerCase();
      if (!friendName.includes(trimmed) && !label.includes(trimmed) && !city.includes(trimmed)) {
        return false;
      }
    }

    const rating = Math.max(
      ratingFromVisitedAtIso(location.visitedAtIso),
      origin
        ? ratingFromDistanceKm(
            distanceKm(origin, {
              latitude: location.latitude,
              longitude: location.longitude,
            }),
          )
        : 1,
    );

    if (rating < params.minRating) {
      return false;
    }

    if (origin) {
      const km = distanceKm(origin, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
      if (km > params.maxDistanceKm) {
        return false;
      }
    }

    return true;
  });

  const results = filtered.map(({location, friend}) => {
    const friendName = friend.displayName || 'Friend';
    const km = origin
      ? distanceKm(origin, {
          latitude: location.latitude,
          longitude: location.longitude,
        })
      : null;
    const rating = Math.max(
      ratingFromVisitedAtIso(location.visitedAtIso),
      km != null ? ratingFromDistanceKm(km) : 1,
    );

    return {
      id: location.id,
      title: `${friendName} · ${location.label}`,
      subtitle: km != null ? `${km.toFixed(1)} km · ${location.city || 'Unknown city'}` : location.city,
      tags: [`★${rating}`, friendName],
      friendUserId: friend.id,
      distanceKm: km ?? 0,
      rating,
    };
  });

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  return results.slice(0, limit);
}
