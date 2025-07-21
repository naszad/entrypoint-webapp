import { pgTable, uuid, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { schools } from './Schools';

export const years = pgTable('years', {
  yearId: uuid('year_id').primaryKey().defaultRandom(),
  yearStart: integer('year_start').notNull(),
  yearEnd: integer('year_end').notNull(),
  yearExternalId: text('year_external_id').notNull(),
  name: text('name').notNull(),
  schoolId: uuid('school_id').notNull().references(() => schools.schoolId),
  isCurrentYear: boolean('is_current_year').default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Year = typeof years.$inferSelect;
