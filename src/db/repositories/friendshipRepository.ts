import {and, eq, ne, or} from 'drizzle-orm';
import {friendships, type FriendshipRow, type FriendshipStatus} from '../../entities';
import {getDatabase} from '../client';
import {notifyDbChanged} from '../reactivity';
import {ensurePlaceholderUser} from './userRepository';
import {enqueueSyncMutation} from './syncQueueRepository';
import {createId, nowIso} from '../utils';

export type FriendshipRemoteRow = {
  id: string;
  userAId: string;
  userBId: string;
  issuedById: string;
  status: FriendshipStatus;
  createdAtIso: string;
  updatedAtIso: string;
};

export async function upsertFriendshipFromRemote(row: FriendshipRemoteRow): Promise<void> {
  const db = getDatabase();
  const existing = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, row.id))
    .limit(1);

  if (existing[0] && existing[0].updatedAtIso > row.updatedAtIso) {
    return;
  }

  const issuedById = row.issuedById || row.userAId;

  await ensurePlaceholderUser(row.userAId);
  await ensurePlaceholderUser(row.userBId);
  await ensurePlaceholderUser(issuedById);

  await db
    .insert(friendships)
    .values({...row, issuedById})
    .onConflictDoUpdate({
      target: friendships.id,
      set: {
        userAId: row.userAId,
        userBId: row.userBId,
        issuedById,
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
    issuedById: currentUserId,
    status: 'pending' as const,
    createdAtIso,
    updatedAtIso,
  };

  await db.insert(friendships).values(row);

  await enqueueSyncMutation('addFriend', {
    friendshipId: id,
    userAId: currentUserId,
    userBId: targetUserId,
    issuedById: currentUserId,
    status: 'pending',
    createdAtIso,
    updatedAtIso,
  });

  notifyDbChanged();
  return row;
}

export async function acceptFriendRequest(
  currentUserId: string,
  friendshipId: string,
): Promise<FriendshipRow | null> {
  const db = getDatabase();
  const existing = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, friendshipId))
    .limit(1);
  const row = existing[0];

  if (!row) {
    return null;
  }

  if (row.status !== 'pending') {
    throw new Error('Only pending friend requests can be accepted.');
  }

  if (row.issuedById === currentUserId) {
    throw new Error('You cannot accept a friend request you sent.');
  }

  if (row.userAId !== currentUserId && row.userBId !== currentUserId) {
    throw new Error('You are not part of this friendship.');
  }

  const updatedAtIso = nowIso();

  await db
    .update(friendships)
    .set({status: 'accepted', updatedAtIso})
    .where(eq(friendships.id, friendshipId));

  await enqueueSyncMutation('acceptFriend', {
    friendshipId: row.id,
    userAId: row.userAId,
    userBId: row.userBId,
    issuedById: row.issuedById,
    status: 'accepted',
    createdAtIso: row.createdAtIso,
    updatedAtIso,
  });

  notifyDbChanged();
  return {...row, status: 'accepted', updatedAtIso};
}

export async function removeFriend(
  currentUserId: string,
  friendshipId: string,
): Promise<boolean> {
  const db = getDatabase();
  const existing = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, friendshipId))
    .limit(1);
  const row = existing[0];

  if (!row) {
    return false;
  }

  if (row.userAId !== currentUserId && row.userBId !== currentUserId) {
    throw new Error('You are not part of this friendship.');
  }

  if (row.status !== 'accepted') {
    throw new Error('Only accepted friendships can be removed.');
  }

  await db.delete(friendships).where(eq(friendships.id, friendshipId));

  await enqueueSyncMutation('unfriend', {
    friendshipId: row.id,
  });

  notifyDbChanged();
  return true;
}

export async function deleteFriendshipById(friendshipId: string): Promise<void> {
  const db = getDatabase();
  await db.delete(friendships).where(eq(friendships.id, friendshipId));
  notifyDbChanged();
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
