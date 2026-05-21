import {desc, eq} from 'drizzle-orm';
import {locations} from '../../entities';
import type {LocationHistoryItem} from '../../types/location';
import {getDatabase} from '../client';

export type UserLocationHistoryParams = {
  userId: string;
  limit?: number;
  offset?: number;
};

export async function fetchUserLocationHistory(
  params: UserLocationHistoryParams,
): Promise<LocationHistoryItem[]> {
  const db = getDatabase();
  const limit = params.limit ?? 10;
  const offset = params.offset ?? 0;

  const rows = await db
    .select()
    .from(locations)
    .where(eq(locations.userId, params.userId))
    .orderBy(desc(locations.visitedAtIso))
    .limit(limit)
    .offset(offset);

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

export async function countUserLocations(userId: string): Promise<number> {
  const db = getDatabase();
  const rows = await db.select().from(locations).where(eq(locations.userId, userId));
  return rows.length;
}
