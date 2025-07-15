import { pgTable, uuid, text, timestamp, decimal, boolean } from 'drizzle-orm/pg-core';
import { students } from './Students';
import { sections } from './Sections';
import { terms } from './Terms';
import { courses } from './Courses';
import { pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { customers } from './Customers';

export const studentGrades = pgTable('student_grades', {
  gradeId: uuid('grade_id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => students.studentId),
  sectionId: uuid('section_id').notNull().references(() => sections.sectionId),
  termId: uuid('term_id').notNull().references(() => terms.termId),
  courseId: uuid('course_id').notNull().references(() => courses.courseId),
  gradeLetter: text('grade_letter'),
  gradeCode:  text('grade_code').notNull(),
  gradePercentage: decimal('grade_percent'),
  gpaPoints: decimal('gpa_points'),
  creditHoursEarned: decimal('credit_hours_earned'),
  potentialCreditHours: decimal('potential_credit_hours'),
  gpaAddedValue: decimal('gpa_added_value'),
  excludeFromGPA: boolean('exclude_from_gpa'),
  creditType: text('credit_type'),
  gradeStatus: text('grade_status').notNull(),
  comment: text('comment'),
  gradeLevel: text('grade_level'),
  sourceApi: text('source_api'), // The API that the grade was pulled from, since these can come from multiple sources. Nullable because in some source systems this will be irrelevant.
  sourceUpdatedDate: timestamp('source_updated_date').notNull(), // When it was last updated in the source system
  externalSource: text('external_source').notNull().default('Powerschool'),
  externalName: text('external_name'),
  externalId: text('external_id').notNull(),
  externalKey: text('external_key').notNull().unique(),
  externalKeyHash: text('external_key_hash').notNull().unique(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),

  customerId: uuid('customer_id').references(() => customers.customerId, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
}, (table) => [
  pgPolicy('Allow Reading of Student Grades', {
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
  }),
]);

export type StudentGrade = typeof studentGrades.$inferSelect;