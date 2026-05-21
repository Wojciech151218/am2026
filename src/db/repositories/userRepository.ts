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

export async function createCurrentUserProfile(input: {
  id: string;
  email: string | null;
  displayName: string;
  bio?: string;
  homeCity?: string;
}): Promise<UserRow> {
  const trimmedName = input.displayName.trim();
  if (!trimmedName) {
    throw new Error('Display name is required.');
  }

  const existing = await getUserById(input.id);
  if (existing) {
    throw new Error('Profile already exists.');
  }

  const db = getDatabase();
  const updatedAtIso = nowIso();
  const row: NewUserRow = {
    id: input.id,
    email: input.email,
    displayName: trimmedName,
    bio: input.bio?.trim() ?? '',
    homeCity: input.homeCity?.trim() ?? '',
    locationTrackingEnabled: false,
    updatedAtIso,
    syncedAtIso: null,
  };

  await db.insert(users).values(row);
  await enqueueSyncMutation('updateUserProfile', {
    userId: input.id,
    displayName: trimmedName,
    bio: row.bio,
    homeCity: row.homeCity,
    updatedAtIso,
  });
  notifyDbChanged();
  return row;
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

  await enqueueSyncMutation('updateCurrentLocation', {
    userId,
    latitude: input.latitude,
    longitude: input.longitude,
    label: input.label,
    updatedAtIso,
  });

  notifyDbChanged();
}

export async function clearCurrentCoordinates(userId: string): Promise<void> {
  const db = getDatabase();
  const updatedAtIso = nowIso();

  await db
    .update(users)
    .set({
      currentLatitude: null,
      currentLongitude: null,
      currentLocationLabel: null,
      updatedAtIso,
    })
    .where(eq(users.id, userId));

  await enqueueSyncMutation('updateCurrentLocation', {
    userId,
    latitude: null,
    longitude: null,
    label: null,
    updatedAtIso,
  });

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
