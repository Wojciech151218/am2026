import {and, eq, or} from 'drizzle-orm';
import {friendships, type FriendshipRow, type FriendshipStatus} from '../../entities';
import {getDatabase} from '../client';
import {notifyDbChanged} from '../reactivity';
import {ensurePlaceholderUser} from './userRepository';
import {enqueueSyncMutation} from './syncQueueRepository';
import {createId, nowIso} from '../utils';

export async function upsertFriendshipFromRemote(row: {
  id: string;
  userAId: string;
  userBId: string;
  status: FriendshipStatus;
  createdAtIso: string;
  updatedAtIso: string;
}): Promise<void> {
  const db = getDatabase();
  const existing = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, row.id))
    .limit(1);

  if (existing[0] && existing[0].updatedAtIso > row.updatedAtIso) {
    return;
  }

  await ensurePlaceholderUser(row.userAId);
  await ensurePlaceholderUser(row.userBId);

  await db
    .insert(friendships)
    .values(row)
    .onConflictDoUpdate({
      target: friendships.id,
      set: {
        userAId: row.userAId,
        userBId: row.userBId,
        status: row.status,
        createdAtIso: row.createdAtIso,
        updatedAtIso: row.updatedAtIso,
      },
    });

  notifyDbChanged();
}

export async function addFriend(
  currentUserId: string,
  targetUserId: string,
): Promise<FriendshipRow> {
  const db = getDatabase();
  const id = createId('friendship');
  const createdAtIso = nowIso();
  const updatedAtIso = createdAtIso;

  await ensurePlaceholderUser(targetUserId, 'Friend');

  const row = {
    id,
    userAId: currentUserId,
    userBId: targetUserId,
    status: 'pending' as const,
    createdAtIso,
    updatedAtIso,
  };

  await db.insert(friendships).values(row);

  await enqueueSyncMutation('addFriend', {
    friendshipId: id,
    userAId: currentUserId,
    userBId: targetUserId,
    status: 'pending',
    createdAtIso,
    updatedAtIso,
  });

  notifyDbChanged();
  return row;
}

export async function findFriendshipBetween(
  userAId: string,
  userBId: string,
): Promise<FriendshipRow | null> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.userAId, userAId), eq(friendships.userBId, userBId)),
        and(eq(friendships.userAId, userBId), eq(friendships.userBId, userAId)),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}
