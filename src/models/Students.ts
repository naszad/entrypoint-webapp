import {
  pgTable,
  uuid,
  integer,
  text,
  varchar,
  date,
  timestamp,
  pgPolicy
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const students = pgTable(
  'students',
  {
    studentId: uuid('student_id').defaultRandom().primaryKey(),
    schoolId: integer('school_id'),
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
    externalId: integer('external_id'),
    externalKeyHash: text('external_key_hash').notNull(),
    externalName: text('external_name'),
    graduationYear: integer('graduation_year'), 
    enrollmentStatus: text('enrollment_status').notNull(), 
    homeroomName: text('homeroom_name'), 
    fullName : text('full_name').notNull()
  }, 
(table) => [
    pgPolicy('Allow Reading of Students', {
      for: 'select',
      to: 'authenticated',
      using: sql`
        EXISTS (
          SELECT 1
          FROM user_school_memberships AS usm
          JOIN school_student_link       AS ssl
            ON usm.school_key_hash = ssl.external_school_key_hash
          WHERE usm.user_id = auth.uid()
            AND ssl.external_student_key_hash = ${table.externalKeyHash}
        )
      `,
    }),
  ]
);

export type Student = typeof students.$inferSelect;
