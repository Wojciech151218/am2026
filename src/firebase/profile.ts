import {setDoc} from 'firebase/firestore';
import {getUserProfileDocument} from './schemas';

export type PublishCurrentUserProfileInput = {
  uid: string;
  email: string | null;
  displayName: string;
  bio: string;
  homeCity: string;
  locationTrackingEnabled?: boolean;
};

export async function publishCurrentUserProfile(
  input: PublishCurrentUserProfileInput,
): Promise<void> {
  const profileDoc = getUserProfileDocument(input.uid);
  if (!profileDoc) {
    return;
  }
  const nowIso = new Date().toISOString();
  await setDoc(
    profileDoc,
    {
      uid: input.uid,
      email: input.email,
      displayName: input.displayName,
      bio: input.bio,
      homeCity: input.homeCity,
      locationTrackingEnabled: input.locationTrackingEnabled ?? false,
      updatedAtIso: nowIso,
      createdAtIso: nowIso,
    },
    {merge: true},
  );
}
