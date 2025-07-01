import { pgTable, uuid, text, timestamp, integer, date, unique, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { students } from './Students';
import { sections } from './Sections';
import { terms } from './Terms';

export const sectionEnrollments = pgTable('section_enrollments', {
  sectionEnrollmentId: uuid('section_enrollment_id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => students.studentId),
  sectionId: uuid('section_id').notNull().references(() => sections.sectionId),
  termId: uuid('term_id').notNull().references(() => terms.termId),
  startDate: date('start_date'),
  endDate: date('end_date'),
  absences: integer('absences'),
  tardies: integer('tardies'),
  externalKey: text("external_key").notNull(),
  externalId: text("external_id").notNull(),
  externalKeyHash: text("external_key_hash").notNull().unique(),
  externalSource: text("external_source").notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
},
(table) => ({
  unique: unique().on(table.studentId, table.sectionId, table.termId),
  rls: pgPolicy('Allow Reading of Section Enrollments', {
    for: 'select',
    to: 'authenticated',
    using: sql`
      EXISTS (
        SELECT 1
        FROM sections s
        JOIN courses c ON s.course_id = c.course_id
        JOIN user_school_memberships usm ON usm.school_id = c.school_id
        CROSS JOIN LATERAL (SELECT public.get_current_school_id() as current_school_id) as app_context
        WHERE s.section_id = ${table.sectionId}
          AND usm.user_id = auth.uid()
          AND (
            app_context.current_school_id IS NULL OR
            c.school_id = app_context.current_school_id
          )
      )
    `,
  })
}));
