import type {NewLocationRow, NewUserRow} from '../../entities';
import type {FriendshipStatus} from '../../entities/friendship';
import type {
  FirestoreFriendship,
  FirestoreLocationSnapshot,
  FirestoreUserProfile,
} from '../../firebase/schemas';

export function mapFirestoreUserToLocal(profile: FirestoreUserProfile): NewUserRow {
  return {
    id: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    bio: profile.bio,
    homeCity: profile.homeCity,
    currentLatitude: profile.currentLatitude ?? null,
    currentLongitude: profile.currentLongitude ?? null,
    currentLocationLabel: profile.currentLocationLabel ?? null,
    locationTrackingEnabled: profile.locationTrackingEnabled,
    updatedAtIso: profile.updatedAtIso,
    syncedAtIso: profile.updatedAtIso,
  };
}

export function mapFirestoreLocationToLocal(
  snapshot: FirestoreLocationSnapshot,
): NewLocationRow {
  return {
    id: snapshot.id,
    userId: snapshot.userId,
    label: snapshot.label,
    city: snapshot.city,
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
    visitedAtIso: snapshot.visitedAtIso,
    updatedAtIso: snapshot.updatedAtIso,
  };
}

export function mapFirestoreFriendshipToLocal(friendship: FirestoreFriendship) {
  return {
    id: friendship.id,
    userAId: friendship.userAId,
    userBId: friendship.userBId,
    status: friendship.status as FriendshipStatus,
    createdAtIso: friendship.createdAtIso,
    updatedAtIso: friendship.updatedAtIso,
  };
}

export function mapLocalUserToFirestore(
  user: NewUserRow,
  createdAtIso?: string,
): FirestoreUserProfile {
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: user.displayName ?? '',
    bio: user.bio ?? '',
    homeCity: user.homeCity ?? '',
    currentLatitude: user.currentLatitude ?? null,
    currentLongitude: user.currentLongitude ?? null,
    currentLocationLabel: user.currentLocationLabel ?? null,
    locationTrackingEnabled: user.locationTrackingEnabled ?? false,
    createdAtIso: createdAtIso ?? user.updatedAtIso,
    updatedAtIso: user.updatedAtIso,
  };
}
