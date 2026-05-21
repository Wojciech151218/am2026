import {asc, eq} from 'drizzle-orm';
import {setDoc} from 'firebase/firestore';
import {syncMutations} from '../../entities';
import {
  getFriendshipDocument,
  getUserLocationDocument,
  getUserProfileDocument,
} from '../../firebase/schemas';
import {getDatabase} from '../client';
import {mapLocalUserToFirestore} from './mappers';
import {getUserById} from '../repositories/userRepository';

const MAX_BATCH = 20;

let processing = false;

export async function processOutboundSyncQueue(): Promise<void> {
  if (processing) {
    return;
  }

  processing = true;
  try {
    const db = getDatabase();
    const pending = await db
      .select()
      .from(syncMutations)
      .where(eq(syncMutations.status, 'pending'))
      .orderBy(asc(syncMutations.createdAtIso))
      .limit(MAX_BATCH);

    for (const mutation of pending) {
      await db
        .update(syncMutations)
        .set({status: 'processing'})
        .where(eq(syncMutations.id, mutation.id));

      try {
        const payload = JSON.parse(mutation.payloadJson) as Record<string, unknown>;
        await dispatchMutation(mutation.type, payload);

        await db.delete(syncMutations).where(eq(syncMutations.id, mutation.id));
      } catch {
        await db
          .update(syncMutations)
          .set({
            status: 'failed',
            retryCount: mutation.retryCount + 1,
          })
          .where(eq(syncMutations.id, mutation.id));
      }
    }
  } finally {
    processing = false;
  }
}

async function dispatchMutation(
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  switch (type) {
    case 'addFriend': {
      const friendshipDoc = getFriendshipDocument(String(payload.friendshipId));
      if (!friendshipDoc) {
        throw new Error('Firestore is not configured.');
      }
      await setDoc(friendshipDoc, {
        id: String(payload.friendshipId),
        userAId: String(payload.userAId),
        userBId: String(payload.userBId),
        issuedById: String(payload.issuedById ?? payload.userAId),
        status: payload.status,
        createdAtIso: String(payload.createdAtIso),
        updatedAtIso: String(payload.updatedAtIso),
      });
      return;
    }
    case 'acceptFriend': {
      const friendshipDoc = getFriendshipDocument(String(payload.friendshipId));
      if (!friendshipDoc) {
        throw new Error('Firestore is not configured.');
      }
      await setDoc(
        friendshipDoc,
        {
          id: String(payload.friendshipId),
          userAId: String(payload.userAId),
          userBId: String(payload.userBId),
          issuedById: String(payload.issuedById),
          status: payload.status,
          createdAtIso: String(payload.createdAtIso),
          updatedAtIso: String(payload.updatedAtIso),
        },
        {merge: true},
      );
      return;
    }
    case 'toggleLocationTracking':
    case 'updateUserProfile':
    case 'updateCurrentLocation': {
      const userId = String(payload.userId);
      const user = await getUserById(userId);
      if (!user) {
        throw new Error('Local user not found for sync.');
      }
      const profileDoc = getUserProfileDocument(userId);
      if (!profileDoc) {
        throw new Error('Firestore is not configured.');
      }
      await setDoc(profileDoc, mapLocalUserToFirestore(user), {merge: true});
      return;
    }
    case 'postUserLocation': {
      const userId = String(payload.userId);
      const locationId = String(payload.locationId);
      const profileDoc = getUserProfileDocument(userId);
      const locationDoc = getUserLocationDocument(userId, locationId);
      if (!profileDoc || !locationDoc) {
        throw new Error('Firestore is not configured.');
      }
      const user = await getUserById(userId);
      if (user) {
        await setDoc(profileDoc, mapLocalUserToFirestore(user), {merge: true});
      }
      await setDoc(locationDoc, {
        id: locationId,
        userId,
        label: String(payload.label),
        city: String(payload.city ?? ''),
        latitude: Number(payload.latitude),
        longitude: Number(payload.longitude),
        visitedAtIso: String(payload.visitedAtIso),
        updatedAtIso: String(payload.updatedAtIso),
      });
      return;
    }
    default:
      throw new Error(`Unknown mutation type: ${type}`);
  }
}
