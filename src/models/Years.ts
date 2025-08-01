import { pgTable, uuid, text, timestamp, integer, boolean, date } from 'drizzle-orm/pg-core';

export const years = pgTable('years', {
  yearId: uuid('year_id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // "2024-2025", "2023-2024"
  startYear: integer('start_year').notNull(), // 2024
  endYear: integer('end_year').notNull(), // 2025
  nominalStartDate: date('nominal_start_date'), // Approximate start date for the academic year
  nominalEndDate: date('nominal_end_date'), // Approximate end date for the academic year
  isCurrent: boolean('is_current').default(false).notNull(), // Flag indicating if this is the currently active school year
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Year = typeof years.$inferSelect; 