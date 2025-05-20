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
import { sql } from 'drizzle-orm';

export const students = pgTable(
  'students',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    student_id: integer('student_id').notNull(),
    school_id: integer('school_id').notNull(),
    first_name: text('first_name').notNull(),
    middle_name: text('middle_name'),            
    last_name: text('last_name').notNull(),
    email: varchar('email', { length: 256 }).notNull(),
    phone: varchar('phone', { length: 256 }),  
    grade_level: integer('grade_level').notNull(),
    gender: varchar('gender', { length: 256 }),  
    date_of_birth: date('date_of_birth'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    external_source: text('external_source'),
    external_key: text('external_key'),
    external_id: text('external_id').notNull(),
    external_name: text('external_name'),
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
            AND ssl.external_student_id = ${table.external_id}
        )
      `,
    }),
  ]
).enableRLS();

export type Student = typeof students.$inferSelect;