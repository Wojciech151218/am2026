import {and, desc, eq, gte, lte, or} from 'drizzle-orm';
import {friendships, locations, users} from '../../entities';
import type {LocationHistoryItem} from '../../types/location';
import {getDatabase} from '../client';

export type FriendLocationHistoryParams = {
  currentUserId: string;
  friendUserId: string;
  city?: string;
  fromVisitedAtIso?: string;
  toVisitedAtIso?: string;
  limit?: number;
  offset?: number;
};

export async function fetchFriendLocationHistory(
  params: FriendLocationHistoryParams,
): Promise<LocationHistoryItem[]> {
  const db = getDatabase();

  const friendship = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, 'accepted'),
        or(
          and(
            eq(friendships.userAId, params.currentUserId),
            eq(friendships.userBId, params.friendUserId),
          ),
          and(
            eq(friendships.userAId, params.friendUserId),
            eq(friendships.userBId, params.currentUserId),
          ),
        ),
      ),
    )
    .limit(1);

  if (!friendship[0]) {
    return [];
  }

  const conditions = [eq(locations.userId, params.friendUserId)];

  if (params.city) {
    conditions.push(eq(locations.city, params.city));
  }
  if (params.fromVisitedAtIso) {
    conditions.push(gte(locations.visitedAtIso, params.fromVisitedAtIso));
  }
  if (params.toVisitedAtIso) {
    conditions.push(lte(locations.visitedAtIso, params.toVisitedAtIso));
  }

  let query = db
    .select()
    .from(locations)
    .where(and(...conditions))
    .orderBy(desc(locations.visitedAtIso));

  if (params.limit !== undefined) {
    query = query.limit(params.limit) as typeof query;
  }
  if (params.offset !== undefined) {
    query = query.offset(params.offset) as typeof query;
  }

  const rows = await query;

  return rows.map(row => ({
    id: row.id,
    label: row.label,
    coordinates: {
      latitude: row.latitude,
      longitude: row.longitude,
    },
    visitedAt: row.visitedAtIso,
  }));
}

export async function fetchFriendUsersSharingLocation(currentUserId: string) {
  const db = getDatabase();
  return db
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
}
