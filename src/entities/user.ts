import {index, integer, real, sqliteTable, text} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email'),
    displayName: text('display_name').notNull().default(''),
    bio: text('bio').notNull().default(''),
    homeCity: text('home_city').notNull().default(''),
    currentLatitude: real('current_latitude'),
    currentLongitude: real('current_longitude'),
    currentLocationLabel: text('current_location_label'),
    locationTrackingEnabled: integer('location_tracking_enabled', {mode: 'boolean'})
      .notNull()
      .default(false),
    updatedAtIso: text('updated_at_iso').notNull(),
    syncedAtIso: text('synced_at_iso'),
  },
  table => [index('users_updated_at_idx').on(table.updatedAtIso)],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
