import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
export const userSchoolMemberships = pgTable('user_school_memberships', {
  userId: uuid('user_id').primaryKey(),
  schoolId: uuid('school_id').notNull(),
  role: text('role').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export type UserSchoolMembership = typeof userSchoolMemberships.$inferSelect;
