import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgPolicy,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { courses } from "./Courses";

export const sections = pgTable("sections", {
  sectionId: uuid("section_id").primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.courseId, { onDelete: 'cascade' }),
  noOfStudents: integer("no_of_students").notNull(),
  sectionNumber: integer("section_number").notNull(),
  courseNumber: text("course_number").notNull(),
  gradeLevel: text("grade_level").notNull(),
  transactionDate: date('transaction_date'),

  externalKey: text("external_key").notNull(),
  externalId: text("external_id").notNull(),
  externalKeyHash: text("external_key_hash").notNull().unique(),
  externalSource: text("external_source").notNull(),


  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  pgPolicy('Allow Reading of Sections', {
    for: 'select',
    to: 'authenticated',
    using: sql`
      EXISTS (
        SELECT 1
        FROM courses c
        JOIN user_school_memberships usm ON usm.school_id = c.school_id
        WHERE c.course_id = ${table.courseId}
          AND usm.user_id = auth.uid()
      )
    `,
  }),
]);
