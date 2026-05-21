import {migrate} from 'drizzle-orm/op-sqlite/migrator';
import {getDatabase, isNativeDbSupported} from './client';
import {migrations} from './migrations';

let migrated = false;

export async function runMigrations(): Promise<void> {
  if (!isNativeDbSupported() || migrated) {
    return;
  }

  const db = getDatabase();
  await migrate(db, migrations);
  migrated = true;
}
