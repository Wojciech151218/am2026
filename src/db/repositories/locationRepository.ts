import {and, desc, eq, gte, lte} from 'drizzle-orm';
import {locations, type LocationRow, type NewLocationRow} from '../../entities';
import {getDatabase} from '../client';
import {notifyDbChanged} from '../reactivity';
import {enqueueSyncMutation} from './syncQueueRepository';
import {createId, nowIso} from '../utils';

export type AppendLocationInput = {
  userId: string;
  label: string;
  city?: string;
  latitude: number;
  longitude: number;
  visitedAtIso?: string;
};

export async function upsertLocationFromRemote(row: NewLocationRow): Promise<void> {
  const db = getDatabase();
  const existing = await db.select().from(locations).where(eq(locations.id, row.id)).limit(1);

  if (existing[0] && existing[0].updatedAtIso > row.updatedAtIso) {
    return;
  }

  await db
    .insert(locations)
    .values(row)
    .onConflictDoUpdate({
      target: locations.id,
      set: {
        userId: row.userId,
        label: row.label,
        city: row.city,
        latitude: row.latitude,
        longitude: row.longitude,
        visitedAtIso: row.visitedAtIso,
        updatedAtIso: row.updatedAtIso,
      },
    });

  notifyDbChanged();
}

export async function appendLocationSnapshot(input: AppendLocationInput): Promise<LocationRow> {
  const db = getDatabase();
  const id = createId('loc');
  const visitedAtIso = input.visitedAtIso ?? nowIso();
  const updatedAtIso = nowIso();
  const city = input.city ?? '';

  const row: NewLocationRow = {
    id,
    userId: input.userId,
    label: input.label,
    city,
    latitude: input.latitude,
    longitude: input.longitude,
    visitedAtIso,
    updatedAtIso,
  };

  await db.insert(locations).values(row);

  await enqueueSyncMutation('postUserLocation', {
    userId: input.userId,
    locationId: id,
    label: input.label,
    city,
    latitude: input.latitude,
    longitude: input.longitude,
    visitedAtIso,
    updatedAtIso,
  });

  notifyDbChanged();
  return {...row, city};
}

export async function deleteLocationById(locationId: string): Promise<void> {
  const db = getDatabase();
  await db.delete(locations).where(eq(locations.id, locationId));
  notifyDbChanged();
}

export type LocationHistoryFilters = {
  userId: string;
  city?: string;
  fromVisitedAtIso?: string;
  toVisitedAtIso?: string;
  limit?: number;
  offset?: number;
};

export async function listLocationHistory(
  filters: LocationHistoryFilters,
): Promise<LocationRow[]> {
  const db = getDatabase();
  const conditions = [eq(locations.userId, filters.userId)];

  if (filters.city) {
    conditions.push(eq(locations.city, filters.city));
  }
  if (filters.fromVisitedAtIso) {
    conditions.push(gte(locations.visitedAtIso, filters.fromVisitedAtIso));
  }
  if (filters.toVisitedAtIso) {
    conditions.push(lte(locations.visitedAtIso, filters.toVisitedAtIso));
  }

  let query = db
    .select()
    .from(locations)
    .where(and(...conditions))
    .orderBy(desc(locations.visitedAtIso));

  if (filters.limit !== undefined) {
    query = query.limit(filters.limit) as typeof query;
  }
  if (filters.offset !== undefined) {
    query = query.offset(filters.offset) as typeof query;
  }

  return query;
}
