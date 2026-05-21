import {
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  getFriendshipsCollection,
  getUserLocationsCollection,
  getUserProfileDocument,
  getUserProfilesCollection,
} from '../../firebase/schemas';
import {fetchFriendProfileSyncUserIds} from '../queries/friendsWithUsers';
import {upsertFriendshipFromRemote} from '../repositories/friendshipRepository';
import {upsertLocationFromRemote} from '../repositories/locationRepository';
import {upsertUserFromRemote} from '../repositories/userRepository';
import {
  mapFirestoreFriendshipToLocal,
  mapFirestoreLocationToLocal,
  mapFirestoreUserToLocal,
} from './mappers';

type InboundHandles = {
  unsubscribes: Unsubscribe[];
};

let activeHandles: InboundHandles | null = null;

export function stopInboundSync(): void {
  if (!activeHandles) {
    return;
  }
  activeHandles.unsubscribes.forEach(unsubscribe => unsubscribe());
  activeHandles = null;
}

export async function startInboundSync(currentUserId: string): Promise<void> {
  stopInboundSync();

  const unsubscribes: Unsubscribe[] = [];
  const ownProfileDoc = getUserProfileDocument(currentUserId);

  if (ownProfileDoc) {
    unsubscribes.push(
      onSnapshot(ownProfileDoc, snapshot => {
        if (!snapshot.exists()) {
          return;
        }
        const profile = snapshot.data();
        if (!(profile.displayName ?? '').trim()) {
          return;
        }
        upsertUserFromRemote(mapFirestoreUserToLocal(profile), {
          skipIfLocalIsNewer: true,
        }).catch(() => null);
      }),
    );
  }

  const locationsCollection = getUserLocationsCollection(currentUserId);
  if (locationsCollection) {
    unsubscribes.push(
      onSnapshot(locationsCollection, snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') {
            return;
          }
          const location = change.doc.data();
          upsertLocationFromRemote(mapFirestoreLocationToLocal(location)).catch(() => null);
        });
      }),
    );
  }

  const friendshipsCollection = getFriendshipsCollection();
  if (friendshipsCollection) {
    const asUserA = query(friendshipsCollection, where('userAId', '==', currentUserId));
    const asUserB = query(friendshipsCollection, where('userBId', '==', currentUserId));

    unsubscribes.push(
      onSnapshot(asUserA, snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') {
            return;
          }
          upsertFriendshipFromRemote(mapFirestoreFriendshipToLocal(change.doc.data())).catch(
            () => null,
          );
        });
        refreshFriendProfileListeners(currentUserId, unsubscribes).catch(() => null);
      }),
    );

    unsubscribes.push(
      onSnapshot(asUserB, snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') {
            return;
          }
          upsertFriendshipFromRemote(mapFirestoreFriendshipToLocal(change.doc.data())).catch(
            () => null,
          );
        });
        refreshFriendProfileListeners(currentUserId, unsubscribes).catch(() => null);
      }),
    );
  }

  activeHandles = {unsubscribes};
  await refreshFriendProfileListeners(currentUserId, unsubscribes);
}

const friendProfileUnsubscribes = new Map<string, Unsubscribe>();

async function refreshFriendProfileListeners(
  currentUserId: string,
  unsubscribes: Unsubscribe[],
): Promise<void> {
  const friendIds = new Set(await fetchFriendProfileSyncUserIds(currentUserId));

  friendProfileUnsubscribes.forEach((unsubscribe, friendId) => {
    if (!friendIds.has(friendId)) {
      unsubscribe();
      friendProfileUnsubscribes.delete(friendId);
    }
  });

  const profilesCollection = getUserProfilesCollection();
  if (!profilesCollection) {
    return;
  }

  for (const friendId of friendIds) {
    if (friendProfileUnsubscribes.has(friendId) || friendId === currentUserId) {
      continue;
    }

    const friendDoc = getUserProfileDocument(friendId);
    if (!friendDoc) {
      continue;
    }

    const unsubscribe = onSnapshot(friendDoc, snapshot => {
      if (!snapshot.exists()) {
        return;
      }
      upsertUserFromRemote(mapFirestoreUserToLocal(snapshot.data()), {
        skipIfLocalIsNewer: true,
      }).catch(() => null);
    });

    friendProfileUnsubscribes.set(friendId, unsubscribe);
    unsubscribes.push(unsubscribe);
  }
}

export function clearFriendProfileListeners(): void {
  friendProfileUnsubscribes.forEach(unsubscribe => unsubscribe());
  friendProfileUnsubscribes.clear();
}
