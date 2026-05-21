import {Platform} from 'react-native';
import type {AppDatabase} from './types';

export function isNativeDbSupported(): boolean {
  return Platform.OS !== 'web';
}

export function getDatabase(): AppDatabase {
  throw new Error('SQLite database is only available on native platforms.');
}

export async function closeDatabase(): Promise<void> {
  return;
}
