import {eq} from 'drizzle-orm';
import {users, type NewUserRow, type UserRow} from '../../entities';
import {getDatabase} from '../client';
import {notifyDbChanged} from '../reactivity';
import {enqueueSyncMutation} from './syncQueueRepository';
import {createId, nowIso} from '../utils';

export async function upsertUserFromRemote(
  row: NewUserRow,
  options?: {skipIfLocalIsNewer?: boolean},
): Promise<void> {
  const db = getDatabase();
  const existing = await db.select().from(users).where(eq(users.id, row.id)).limit(1);

  if (existing[0] && options?.skipIfLocalIsNewer) {
    if (existing[0].updatedAtIso > row.updatedAtIso) {
      return;
    }
  }

  await db
    .insert(users)
    .values(row)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: row.email,
        displayName: row.displayName,
        bio: row.bio,
        homeCity: row.homeCity,
        currentLatitude: row.currentLatitude,
        currentLongitude: row.currentLongitude,
        currentLocationLabel: row.currentLocationLabel,
        locationTrackingEnabled: row.locationTrackingEnabled,
        updatedAtIso: row.updatedAtIso,
        syncedAtIso: row.syncedAtIso ?? nowIso(),
      },
    });

  notifyDbChanged();
}

export async function seedCurrentUser(input: {
  id: string;
  email: string | null;
  displayName: string;
}): Promise<UserRow> {
  const db = getDatabase();
  const updatedAtIso = nowIso();
  const row: NewUserRow = {
    id: input.id,
    email: input.email,
    displayName: input.displayName,
    bio: '',
    homeCity: '',
    locationTrackingEnabled: false,
    updatedAtIso,
    syncedAtIso: null,
  };

  await db.insert(users).values(row).onConflictDoNothing();
  const result = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
  notifyDbChanged();
  return result[0] ?? row;
}

export async function getUserById(userId: string): Promise<UserRow | null> {
  const db = getDatabase();
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ?? null;
}

export async function setLocationTracking(
  userId: string,
  enabled: boolean,
): Promise<UserRow | null> {
  const db = getDatabase();
  const updatedAtIso = nowIso();

  await db
    .update(users)
    .set({
      locationTrackingEnabled: enabled,
      updatedAtIso,
    })
    .where(eq(users.id, userId));

  await enqueueSyncMutation('toggleLocationTracking', {
    userId,
    locationTrackingEnabled: enabled,
    updatedAtIso,
  });

  notifyDbChanged();
  return getUserById(userId);
}

export async function updateCurrentCoordinates(
  userId: string,
  input: {
    latitude: number;
    longitude: number;
    label: string;
    updatedAtIso?: string;
  },
): Promise<void> {
  const db = getDatabase();
  const updatedAtIso = input.updatedAtIso ?? nowIso();

  await db
    .update(users)
    .set({
      currentLatitude: input.latitude,
      currentLongitude: input.longitude,
      currentLocationLabel: input.label,
      updatedAtIso,
    })
    .where(eq(users.id, userId));

  notifyDbChanged();
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<Pick<UserRow, 'displayName' | 'bio' | 'homeCity'>>,
): Promise<UserRow | null> {
  const db = getDatabase();
  const updatedAtIso = nowIso();

  await db
    .update(users)
    .set({
      ...patch,
      updatedAtIso,
    })
    .where(eq(users.id, userId));

  await enqueueSyncMutation('updateUserProfile', {
    userId,
    ...patch,
    updatedAtIso,
  });

  notifyDbChanged();
  return getUserById(userId);
}

export async function ensurePlaceholderUser(userId: string, displayName = 'Traveler'): Promise<void> {
  const db = getDatabase();
  const updatedAtIso = nowIso();
  await db
    .insert(users)
    .values({
      id: userId,
      email: null,
      displayName,
      bio: '',
      homeCity: '',
      locationTrackingEnabled: false,
      updatedAtIso,
    })
    .onConflictDoNothing();
}
