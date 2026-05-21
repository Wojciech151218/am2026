import {index, real, sqliteTable, text} from 'drizzle-orm/sqlite-core';
import {users} from './user';

export const locations = sqliteTable(
  'locations',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    label: text('label').notNull(),
    city: text('city').notNull().default(''),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    visitedAtIso: text('visited_at_iso').notNull(),
    updatedAtIso: text('updated_at_iso').notNull(),
  },
  table => [
    index('locations_user_city_idx').on(table.userId, table.city),
    index('locations_user_visited_idx').on(table.userId, table.visitedAtIso),
  ],
);

export type LocationRow = typeof locations.$inferSelect;
export type NewLocationRow = typeof locations.$inferInsert;
