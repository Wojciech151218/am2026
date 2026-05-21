import {open} from '@op-engineering/op-sqlite';
import {drizzle} from 'drizzle-orm/op-sqlite';
import {schema} from '../entities';
import type {AppDatabase} from './types';

const DB_NAME = 'smarttrip.db';

let database: AppDatabase | null = null;
let sqliteConnection: ReturnType<typeof open> | null = null;

export function isNativeDbSupported(): boolean {
  return true;
}

export function getSqliteConnection() {
  if (!sqliteConnection) {
    sqliteConnection = open({name: DB_NAME});
  }
  return sqliteConnection;
}

export function getDatabase(): AppDatabase {
  if (!database) {
    database = drizzle(getSqliteConnection(), {schema}) as AppDatabase;
  }
  return database;
}

export async function closeDatabase(): Promise<void> {
  database = null;
  if (sqliteConnection) {
    sqliteConnection.close();
    sqliteConnection = null;
  }
}
