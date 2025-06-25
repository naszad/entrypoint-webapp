import {
  pgTable,
  uuid,
  timestamp,
  date,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { schools } from './Schools';
import { students } from './Students';

export const schoolStudentLinks = pgTable(
  'school_student_link',
  {
    studentId: uuid('student_id').notNull().references(() => students.studentId),
    schoolId: uuid('school_id').notNull().references(() => schools.schoolId),
    startDate: date('start_date'),
    endDate: date('end_date'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
(table) => ({
    pk: primaryKey({ columns: [table.studentId, table.schoolId] }),
  }));

export type SchoolStudentLink = typeof schoolStudentLinks.$inferSelect;
