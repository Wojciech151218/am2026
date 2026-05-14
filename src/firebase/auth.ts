import AsyncStorage from '@react-native-async-storage/async-storage';
import {initializeAuth, getAuth} from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
import type {Auth} from 'firebase/auth';
import {Platform} from 'react-native';
import {getFirebaseApp} from './app';

let authInstance: Auth | null = null;
const getReactNativePersistence = (
  FirebaseAuth as typeof FirebaseAuth & {
    getReactNativePersistence?: (storage: typeof AsyncStorage) => unknown;
  }
).getReactNativePersistence;

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  if (authInstance) {
    return authInstance;
  }

  try {
    authInstance =
      Platform.OS === 'web' || !getReactNativePersistence
        ? getAuth(app)
        : initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage) as never,
          });
  } catch {
    // Auth can already be initialized by another call path.
    authInstance = getAuth(app);
  }

  return authInstance;
}
