import {
  collection,
  doc,
  getFirestore,
  type CollectionReference,
  type FirestoreDataConverter,
} from 'firebase/firestore';
import {getFirebaseApp} from './app';

export const firestoreCollections = {
  userProfiles: 'user_profiles',
  tripPlans: 'trip_plans',
} as const;

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string;
  homeCity: string;
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

const userProfileConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore(model) {
    return model;
  },
  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      uid: snapshot.id,
      email: data.email ?? null,
      displayName: data.displayName ?? '',
      homeCity: data.homeCity ?? '',
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

export function getUserProfilesCollection(): CollectionReference<UserProfile> | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  const db = getFirestore(app);
  return collection(db, firestoreCollections.userProfiles).withConverter(userProfileConverter);
}

export function getTripPlansCollection(): CollectionReference<TripPlan> | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  const db = getFirestore(app);
  return collection(db, firestoreCollections.tripPlans).withConverter(tripPlanConverter);
}

export function getUserProfileDocument(uid: string) {
  const profiles = getUserProfilesCollection();
  if (!profiles) {
    return null;
  }
  return doc(profiles, uid);
}
