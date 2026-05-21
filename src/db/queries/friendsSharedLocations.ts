import {and, desc, eq, or} from 'drizzle-orm';
import {friendships, locations, users} from '../../entities';
import type {RecommendationItem} from '../../types/home';
import type {Coordinates} from '../../types/location';
import {getDatabase} from '../client';
import {distanceKm} from '../utils/geo';
import {getUserById} from '../repositories/userRepository';

export type FriendMapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  sharedBy: string;
};

export async function fetchFriendsSharedLocationsForHome(currentUserId: string): Promise<{
  recommendations: RecommendationItem[];
  markers: FriendMapMarker[];
}> {
  const db = getDatabase();
  const currentUser = await getUserById(currentUserId);

  const friends = await db
    .select({friend: users})
    .from(friendships)
    .innerJoin(
      users,
      or(
        and(eq(friendships.userAId, currentUserId), eq(users.id, friendships.userBId)),
        and(eq(friendships.userBId, currentUserId), eq(users.id, friendships.userAId)),
      ),
    )
    .where(
      and(
        eq(friendships.status, 'accepted'),
        eq(users.locationTrackingEnabled, true),
        or(eq(friendships.userAId, currentUserId), eq(friendships.userBId, currentUserId)),
      ),
    );

  const recommendations: RecommendationItem[] = [];
  const markers: FriendMapMarker[] = [];

  for (const {friend} of friends) {
    if (friend.currentLatitude == null || friend.currentLongitude == null) {
      continue;
    }

    const name = friend.displayName || 'Friend';
    const label = friend.currentLocationLabel ?? 'Shared location';
    let description = label;

    if (
      currentUser?.currentLatitude != null &&
      currentUser.currentLongitude != null
    ) {
      const km = distanceKm(
        {latitude: currentUser.currentLatitude, longitude: currentUser.currentLongitude},
        {latitude: friend.currentLatitude, longitude: friend.currentLongitude},
      );
      description = `${label} · ${km.toFixed(1)} km away`;
    }

    recommendations.push({
      id: `friend-live-${friend.id}`,
      title: `${name} is nearby`,
      description,
      friendUserId: friend.id,
    });

    markers.push({
      id: `friend-${friend.id}`,
      latitude: friend.currentLatitude,
      longitude: friend.currentLongitude,
      title: name,
      description: label,
      sharedBy: name,
    });
  }

  const friendIds = friends.map(row => row.friend.id);
  if (friendIds.length > 0) {
    for (const friendId of friendIds) {
      const recent = await db
        .select()
        .from(locations)
        .where(eq(locations.userId, friendId))
        .orderBy(desc(locations.visitedAtIso))
        .limit(1);

      const snapshot = recent[0];
      if (!snapshot) {
        continue;
      }

      const friend = friends.find(row => row.friend.id === friendId)?.friend;
      const name = friend?.displayName || 'Friend';

      recommendations.push({
        id: `friend-hist-${snapshot.id}`,
        title: `${name} visited ${snapshot.label}`,
        description: snapshot.city ? `${snapshot.city} · ${snapshot.label}` : snapshot.label,
        friendUserId: friendId,
      });
    }
  }

  return {recommendations, markers};
}

export async function getCurrentUserCoordinates(
  currentUserId: string,
  fallback: Coordinates,
): Promise<Coordinates> {
  const user = await getUserById(currentUserId);
  if (user?.currentLatitude != null && user?.currentLongitude != null) {
    return {
      latitude: user.currentLatitude,
      longitude: user.currentLongitude,
    };
  }
  return fallback;
}
