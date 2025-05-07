import { pgTable, uuid, text } from 'drizzle-orm/pg-core';

export const schools = pgTable('schools', {
  schoolId: uuid('school_id').primaryKey(),
  name: text('name').notNull(),
});

export type School = typeof schools.$inferSelect;