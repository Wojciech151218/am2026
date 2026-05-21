import {and, eq, ne, or} from 'drizzle-orm';
import {friendships, users} from '../../entities';
import type {Friend, IncomingFriendRequest} from '../../types/friend';
import {getDatabase} from '../client';

export async function fetchFriendsWithUsers(currentUserId: string): Promise<Friend[]> {
  const db = getDatabase();
  const rows = await db
    .select({
      friendshipId: friendships.id,
      status: friendships.status,
      friend: users,
    })
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
        or(eq(friendships.userAId, currentUserId), eq(friendships.userBId, currentUserId)),
        eq(friendships.status, 'accepted'),
      ),
    );

  return rows.map(({friend}) => mapUserToFriend(friend));
}

export async function fetchIncomingFriendRequests(
  currentUserId: string,
): Promise<IncomingFriendRequest[]> {
  const db = getDatabase();
  const rows = await db
    .select({
      friendshipId: friendships.id,
      requester: users,
    })
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
        or(eq(friendships.userAId, currentUserId), eq(friendships.userBId, currentUserId)),
        eq(friendships.status, 'pending'),
        ne(friendships.issuedById, currentUserId),
      ),
    );

  return rows.map(({friendshipId, requester}) => ({
    friendshipId,
    id: requester.id,
    name: requester.displayName || 'Traveler',
  }));
}

export async function fetchFriendProfileSyncUserIds(currentUserId: string): Promise<string[]> {
  const [friends, incoming] = await Promise.all([
    fetchFriendsWithUsers(currentUserId),
    fetchIncomingFriendRequests(currentUserId),
  ]);
  const ids = new Set<string>();
  friends.forEach(friend => ids.add(friend.id));
  incoming.forEach(request => ids.add(request.id));
  return [...ids];
}

function mapUserToFriend(user: typeof users.$inferSelect): Friend {
  const hasCoordinates =
    user.locationTrackingEnabled &&
    user.currentLatitude != null &&
    user.currentLongitude != null;

  return {
    id: user.id,
    name: user.displayName || 'Traveler',
    displayName: user.displayName,
    bio: user.bio ?? '',
    homeCity: user.homeCity ?? '',
    isOnline: user.locationTrackingEnabled,
    sharedLocation: hasCoordinates
      ? {
          latitude: user.currentLatitude!,
          longitude: user.currentLongitude!,
          label: user.currentLocationLabel ?? 'Shared location',
          sharedAt: user.updatedAtIso,
        }
      : undefined,
  };
}
