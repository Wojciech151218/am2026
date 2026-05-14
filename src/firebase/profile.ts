import {setDoc} from 'firebase/firestore';
import type {User} from 'firebase/auth';
import {getUserProfileDocument} from './schemas';

export async function ensureUserProfile(user: User): Promise<void> {
  const profileDoc = getUserProfileDocument(user.uid);
  if (!profileDoc) {
    return;
  }
  const nowIso = new Date().toISOString();
  await setDoc(
    profileDoc,
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? '',
      homeCity: '',
      updatedAtIso: nowIso,
      createdAtIso: nowIso,
    },
    {merge: true},
  );
}
