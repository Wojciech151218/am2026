import {initializeApp} from 'firebase/app';
import type {FirebaseApp} from 'firebase/app';
import {env, hasFirebaseConfig} from '../config/env';

let firebaseApp: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!hasFirebaseConfig) {
    return null;
  }
  if (firebaseApp) {
    return firebaseApp;
  }
  firebaseApp = initializeApp({
    apiKey: env.firebaseApiKey,
    authDomain: env.firebaseAuthDomain,
    projectId: env.firebaseProjectId,
    storageBucket: env.firebaseStorageBucket,
    messagingSenderId: env.firebaseMessagingSenderId,
    appId: env.firebaseAppId,
  });
  return firebaseApp;
}
