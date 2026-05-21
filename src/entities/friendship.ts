import {index, sqliteTable, text} from 'drizzle-orm/sqlite-core';
import {users} from './user';

export const friendshipStatuses = [
  'pending',
  'accepted',
  'declined',
  'blocked',
] as const;

export type FriendshipStatus = (typeof friendshipStatuses)[number];

export const friendships = sqliteTable(
  'friendships',
  {
    id: text('id').primaryKey(),
    userAId: text('user_a_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    userBId: text('user_b_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    status: text('status', {enum: friendshipStatuses}).notNull(),
    createdAtIso: text('created_at_iso').notNull(),
    updatedAtIso: text('updated_at_iso').notNull(),
  },
  table => [
    index('friendships_user_a_status_idx').on(table.userAId, table.status),
    index('friendships_user_b_status_idx').on(table.userBId, table.status),
  ],
);

export type FriendshipRow = typeof friendships.$inferSelect;
export type NewFriendshipRow = typeof friendships.$inferInsert;
