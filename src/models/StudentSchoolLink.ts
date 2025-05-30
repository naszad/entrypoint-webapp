import {
  pgTable,
  uuid,
  timestamp,
  date,
} from 'drizzle-orm/pg-core';

export const schoolStudentLinks = pgTable(
  'school_student_link',
  {
    studentId: uuid('student_id').notNull(),
    schoolId: uuid('school_id').notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  });

export type SchoolStudentLink = typeof schoolStudentLinks.$inferSelect;
