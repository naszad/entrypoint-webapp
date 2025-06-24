import { pgTable, uuid, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { schools } from './Schools';
import { users } from './Users';
export const userSchoolMemberships = pgTable('user_school_memberships', {
  userId: uuid('user_id').notNull().references(() => users.userId),
  schoolId: uuid('school_id').notNull().references(() => schools.schoolId),
  role: text('role').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (table) => [
  primaryKey({ columns: [table.userId, table.schoolId] }),
],
);

export type UserSchoolMembership = typeof userSchoolMemberships.$inferSelect;