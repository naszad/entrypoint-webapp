import { pgTable, uuid, text, date } from 'drizzle-orm/pg-core';
export const userSchoolMemberships = pgTable('user_school_memberships', {
  userId: uuid('user_id').primaryKey(),
  schoolKeyHash: text('school_key_hash').notNull(),
  role: text('name').notNull(),
  createdAt: date('created_at'),
  updatedAt: date('updated_at'),
});

export type UserSchoolMembership = typeof userSchoolMemberships.$inferSelect;
