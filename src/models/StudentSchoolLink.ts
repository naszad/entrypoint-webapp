import {
  pgTable,
  date,
  uuid,
} from 'drizzle-orm/pg-core';

export const schoolStudentLinks = pgTable(
  'school_student_link',
  {
    studentId: uuid('student_id').notNull(),
    schoolId: uuid('school_id').notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    createdAt: date('created_at'),
    updatedAt: date('updated_at'),
  });

export type SchoolStudentLink = typeof schoolStudentLinks.$inferSelect;
