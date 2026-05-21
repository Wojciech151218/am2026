import {
  collection,
  doc,
  getFirestore,
  type CollectionReference,
  type FirestoreDataConverter,
} from 'firebase/firestore';
import type {FriendshipStatus} from '../entities/friendship';
import {getFirebaseApp} from './app';

export const firestoreCollections = {
  userProfiles: 'user_profiles',
  locations: 'locations',
  friendships: 'friendships',
  tripPlans: 'trip_plans',
} as const;

export type FirestoreUserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  bio: string;
  homeCity: string;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  currentLocationLabel?: string | null;
  locationTrackingEnabled: boolean;
  createdAtIso: string;
  updatedAtIso: string;
};

export type FirestoreLocationSnapshot = {
  id: string;
  userId: string;
  label: string;
  city: string;
  latitude: number;
  longitude: number;
  visitedAtIso: string;
  updatedAtIso: string;
};

export type FirestoreFriendship = {
  id: string;
  userAId: string;
  userBId: string;
  issuedById: string;
  status: FriendshipStatus;
  createdAtIso: string;
  updatedAtIso: string;
};

export type TripPlan = {
  id: string;
  ownerUid: string;
  title: string;
  startDateIso: string;
  endDateIso: string;
  destinationName: string;
  destinationLat: number;
  destinationLon: number;
  note?: string;
  createdAtIso: string;
  updatedAtIso: string;
};

const userProfileConverter: FirestoreDataConverter<FirestoreUserProfile> = {
  toFirestore(model) {
    return model;
  },
  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      uid: snapshot.id,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      bio: data.bio ?? '',
      homeCity: data.homeCity ?? '',
      currentLatitude: data.currentLatitude ?? null,
      currentLongitude: data.currentLongitude ?? null,
      currentLocationLabel: data.currentLocationLabel ?? null,
      locationTrackingEnabled: Boolean(data.locationTrackingEnabled),
      createdAtIso: data.createdAtIso ?? '',
      updatedAtIso: data.updatedAtIso ?? '',
    };
  },
};

const locationConverter: FirestoreDataConverter<FirestoreLocationSnapshot> = {
  toFirestore(model) {
    return model;
  },
  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId ?? '',
      label: data.label ?? '',
      city: data.city ?? '',
      latitude: data.latitude ?? 0,
      longitude: data.longitude ?? 0,
      visitedAtIso: data.visitedAtIso ?? '',
      updatedAtIso: data.updatedAtIso ?? '',
    };
  },
};

const friendshipConverter: FirestoreDataConverter<FirestoreFriendship> = {
  toFirestore(model) {
    return model;
  },
  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userAId: data.userAId ?? '',
      userBId: data.userBId ?? '',
      issuedById: data.issuedById ?? data.userAId ?? '',
      status: data.status ?? 'pending',
      createdAtIso: data.createdAtIso ?? '',
      updatedAtIso: data.updatedAtIso ?? '',
    };
  },
};

const tripPlanConverter: FirestoreDataConverter<TripPlan> = {
  toFirestore(model) {
    return model;
  },
  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ownerUid: data.ownerUid ?? '',
      title: data.title ?? '',
      startDateIso: data.startDateIso ?? '',
      endDateIso: data.endDateIso ?? '',
      destinationName: data.destinationName ?? '',
      destinationLat: data.destinationLat ?? 0,
      destinationLon: data.destinationLon ?? 0,
      note: data.note,
      createdAtIso: data.createdAtIso ?? '',
      updatedAtIso: data.updatedAtIso ?? '',
    };
  },
};

function getDb() {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  return getFirestore(app);
}

export function getUserProfilesCollection(): CollectionReference<FirestoreUserProfile> | null {
  const db = getDb();
  if (!db) {
    return null;
  }
  return collection(db, firestoreCollections.userProfiles).withConverter(userProfileConverter);
}

export function getUserProfileDocument(uid: string) {
  const profiles = getUserProfilesCollection();
  if (!profiles) {
    return null;
  }
  return doc(profiles, uid);
}

export function getUserLocationsCollection(
  uid: string,
): CollectionReference<FirestoreLocationSnapshot> | null {
  const db = getDb();
  if (!db) {
    return null;
  }
  return collection(
    db,
    firestoreCollections.userProfiles,
    uid,
    firestoreCollections.locations,
  ).withConverter(locationConverter);
}

export function getUserLocationDocument(uid: string, locationId: string) {
  const locationsCol = getUserLocationsCollection(uid);
  if (!locationsCol) {
    return null;
  }
  return doc(locationsCol, locationId);
}

export function getFriendshipsCollection(): CollectionReference<FirestoreFriendship> | null {
  const db = getDb();
  if (!db) {
    return null;
  }
  return collection(db, firestoreCollections.friendships).withConverter(friendshipConverter);
}

export function getFriendshipDocument(friendshipId: string) {
  const friendshipsCol = getFriendshipsCollection();
  if (!friendshipsCol) {
    return null;
  }
  return doc(friendshipsCol, friendshipId);
}

export function getTripPlansCollection(): CollectionReference<TripPlan> | null {
  const db = getDb();
  if (!db) {
    return null;
  }
  return collection(db, firestoreCollections.tripPlans).withConverter(tripPlanConverter);
}

/** @deprecated Use FirestoreUserProfile */
export type UserProfile = FirestoreUserProfile;
