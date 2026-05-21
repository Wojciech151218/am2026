import {and, eq, or} from 'drizzle-orm';
import {friendships, users} from '../../entities';
import type {Friend} from '../../types/friend';
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

export async function fetchAcceptedAndPendingFriends(currentUserId: string): Promise<Friend[]> {
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
    .where(or(eq(friendships.userAId, currentUserId), eq(friendships.userBId, currentUserId)));

  return rows
    .filter(row => row.status === 'accepted' || row.status === 'pending')
    .map(({friend}) => mapUserToFriend(friend));
}

function mapUserToFriend(user: typeof users.$inferSelect): Friend {
  const hasCoordinates =
    user.locationTrackingEnabled &&
    user.currentLatitude != null &&
    user.currentLongitude != null;

  return {
    id: user.id,
    name: user.displayName || 'Traveler',
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
