import {
  pgTable,
  text,
  date,
} from 'drizzle-orm/pg-core';

export const schoolStudentLinks = pgTable(
  'school_student_link',
  {
    externalStudentKeyHash: text('external_student_key_hash').notNull(),
    externalSchoolKeyHash: text('external_school_key_hash').notNull(),
    createdAt: date('created_at'),
    updatedAt: date('updated_at'),
  });

export type SchoolStudentLink = typeof schoolStudentLinks.$inferSelect;
