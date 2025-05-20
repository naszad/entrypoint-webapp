import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  integer,
  text,
  varchar,
  date,
  timestamp,
  pgPolicy,
} from 'drizzle-orm/pg-core';

export const students = pgTable(
  'students',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: integer('student_id').notNull(),
    schoolId: integer('school_id').notNull(),
    firstName: text('first_name').notNull(),
    middleName: text('middle_name'),            
    lastName: text('last_name').notNull(),
    email: varchar('email', { length: 256 }).notNull(),
    phone: varchar('phone', { length: 256 }),  
    gradeLevel: integer('grade_level').notNull(),
    gender: varchar('gender', { length: 256 }),  
    dateOfBirth: date('date_of_birth'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    externalSource: text('external_source'),
    externalKey: text('external_key'),
    externalId: text('external_id').notNull(),
    externalName: text('external_name'),
  },
  (table) => [

    pgPolicy('Allow Reading of student', {
      for: 'select',
      to: 'authenticated',
      using: sql`
        EXISTS (
          SELECT 1
          FROM user_school_memberships AS usm
          JOIN student_school_link       AS ssl
            ON usm.school_id = ssl.external_school_id
          WHERE usm.user_id = auth.uid()
            AND ssl.external_student_id = ${table.externalId}
        )
      `,
    }),
  ]
).enableRLS();

export type Student = typeof students.$inferSelect;