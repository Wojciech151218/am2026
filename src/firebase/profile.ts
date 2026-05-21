import {setDoc} from 'firebase/firestore';
import type {User} from 'firebase/auth';
import {Platform} from 'react-native';
import {seedCurrentUser} from '../db/repositories/userRepository';
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
      bio: '',
      homeCity: '',
      locationTrackingEnabled: false,
      updatedAtIso: nowIso,
      createdAtIso: nowIso,
    },
    {merge: true},
  );

  if (Platform.OS !== 'web') {
    await seedCurrentUser({
      id: user.uid,
      email: user.email,
      displayName: user.displayName ?? '',
    });
  }
}
