import { pgTable, uuid, text, timestamp, integer, date, unique } from 'drizzle-orm/pg-core';
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
  unique: unique().on(table.studentId, table.sectionId, table.termId)
}));
