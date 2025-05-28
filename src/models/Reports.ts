import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './Users';

export const reports = pgTable('reports', {
  reportId: uuid('report_id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.userId),
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description'),
  pageName: varchar('page_name'),
  params: text('params'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Report = typeof reports.$inferSelect;