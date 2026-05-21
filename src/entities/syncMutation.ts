import {index, integer, sqliteTable, text} from 'drizzle-orm/sqlite-core';

export const syncMutationTypes = [
  'addFriend',
  'acceptFriend',
  'unfriend',
  'toggleLocationTracking',
  'postUserLocation',
  'updateUserProfile',
  'updateCurrentLocation',
] as const;

export type SyncMutationType = (typeof syncMutationTypes)[number];

export const syncMutationStatuses = ['pending', 'processing', 'failed'] as const;

export type SyncMutationStatus = (typeof syncMutationStatuses)[number];

export const syncMutations = sqliteTable(
  'sync_mutations',
  {
    id: text('id').primaryKey(),
    type: text('type', {enum: syncMutationTypes}).notNull(),
    payloadJson: text('payload_json').notNull(),
    status: text('status', {enum: syncMutationStatuses}).notNull().default('pending'),
    createdAtIso: text('created_at_iso').notNull(),
    retryCount: integer('retry_count').notNull().default(0),
  },
  table => [index('sync_mutations_status_idx').on(table.status, table.createdAtIso)],
);

export type SyncMutationRow = typeof syncMutations.$inferSelect;
export type NewSyncMutationRow = typeof syncMutations.$inferInsert;
