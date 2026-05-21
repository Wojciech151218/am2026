import {desc, eq} from 'drizzle-orm';
import {locations} from '../../entities';
import type {UserProfile} from '../../types/profile';
import {getDatabase} from '../client';
import {getUserById} from '../repositories/userRepository';

export async function fetchCurrentUserProfile(
  currentUserId: string,
  options?: {viewedUserId?: string},
): Promise<UserProfile | null> {
  const targetUserId = options?.viewedUserId ?? currentUserId;
  const isCurrentUser = targetUserId === currentUserId;
  const user = await getUserById(targetUserId);

  if (!user) {
    return null;
  }

  const db = getDatabase();
  const historyRows = await db
    .select()
    .from(locations)
    .where(eq(locations.userId, targetUserId))
    .orderBy(desc(locations.visitedAtIso))
    .limit(50);

  return {
    id: user.id,
    displayName: user.displayName || (isCurrentUser ? 'You' : 'Traveler'),
    bio: user.bio,
    isCurrentUser,
    settings: {
      notificationsEnabled: true,
      locationSharingEnabled: user.locationTrackingEnabled,
      theme: 'system',
    },
    locationHistory: historyRows.map(row => ({
      id: row.id,
      label: row.label,
      coordinates: {
        latitude: row.latitude,
        longitude: row.longitude,
      },
      visitedAt: row.visitedAtIso,
    })),
  };
}
