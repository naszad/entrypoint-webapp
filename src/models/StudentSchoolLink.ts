import {
  pgTable,
  uuid,
  timestamp,
  date,
  primaryKey,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
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
    rls: pgPolicy('Allow Reading of Student School Links', {
        for: 'select',
        to: 'authenticated',
        using: sql`
          EXISTS (
            SELECT 1
            FROM
              user_school_memberships usm
              CROSS JOIN LATERAL (SELECT public.get_current_school_id() as current_school_id) as app_context
            WHERE
              usm.user_id = auth.uid() AND
              usm.school_id = ${table.schoolId} AND
              (
                app_context.current_school_id IS NULL OR
                usm.school_id = app_context.current_school_id
              )
          )
        `,
      }),
  }));

export type SchoolStudentLink = typeof schoolStudentLinks.$inferSelect;
