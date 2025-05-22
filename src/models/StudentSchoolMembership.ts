import { pgTable, uuid, text, date } from 'drizzle-orm/pg-core';
export const studentSchoolMemberships = pgTable('student_school_memberships', {
  externalSchoolId: text('external_school_id').notNull(),
  externalStudentId: text('external_student_id').notNull(),
  createdAt: date('created_at'),
  updatedAt: date('updated_at'),
});

export type StudentSchoolMembership = typeof studentSchoolMemberships.$inferSelect;