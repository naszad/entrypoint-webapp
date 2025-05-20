import { pgTable, uuid, text, varchar } from 'drizzle-orm/pg-core';
import { schools } from './Schools';

export const users = pgTable('users', {
  userId: uuid('user_id').primaryKey(),
  authUserId: uuid('auth_user_id').notNull(),
  schoolId: uuid('school_id').notNull().references(() => schools.schoolId),
  firstName: text('first_name').notNull(),
  middleName: text('middle_name'),
  lastName: text('last_name').notNull(),
  email: varchar('email', { length: 256 }).notNull(),
  imageUrl: text('image_url'),
});

export type User = typeof users.$inferSelect;