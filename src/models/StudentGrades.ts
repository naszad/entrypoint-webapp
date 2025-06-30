import { pgTable, uuid, text, timestamp, decimal } from 'drizzle-orm/pg-core';
import { students } from './Students';
import { sections } from './Sections';
import { terms } from './Terms';
import { courses } from './Courses';

export const studentGrades = pgTable('student_grades', {
  gradeId: uuid('grade_id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => students.studentId),
  sectionId: uuid('section_id').notNull().references(() => sections.sectionId),
  termId: uuid('term_id').notNull().references(() => terms.termId),
  courseId: uuid('course_id').notNull().references(() => courses.courseId),
  gradeLetter: text('grade_letter'),
  gradeCode:  text('grade_code').notNull(),
  gradePercentage: decimal('grade_percent'),
  gradePoints: decimal('grade_points'),
  creditHoursEarned: decimal('credit_hours_earned'),
  creditType: text('credit_type'),
  gradeStatus: text('grade_status').notNull(),
  comment: text('comment'),
  gradeLevel: text('grade_level'),
  sourceApi: text('source_api'), // The API that the grade was pulled from, since these can come from multiple sources. Nullable because in some source systems this will be irrelevant.
  sourceUpdatedDate: timestamp('source_updated_date').notNull(), // When it was last updated in the source system
  externalKey: text("external_key").notNull(),
  externalId: text("external_id").notNull(),
  externalKeyHash: text("external_key_hash").notNull().unique(),
  externalSource: text("external_source").notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(), //When it was last updated in our database
});
