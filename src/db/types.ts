import type {OPSQLiteDatabase} from 'drizzle-orm/op-sqlite';
import type {schema} from '../entities';

export type AppDatabase = OPSQLiteDatabase<typeof schema>;
