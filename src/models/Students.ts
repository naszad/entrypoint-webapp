import {
  pgTable,
  uuid,
  integer,
  text,
  varchar,
  date,
  timestamp,
} from 'drizzle-orm/pg-core';
import { schools } from './Schools';

export const students = pgTable(
  'students',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: integer('student_id').notNull(),
    schoolId: uuid('school_id').notNull().references(() => schools.id),
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
    graduationYear: integer('graduation_year'), 
    enrollmentStatus: text('enrollment_status').notNull(), 
    homeroomName: text('homeroom_name'), 
    fullName : text('full_name').notNull()
  });

export type Student = typeof students.$inferSelect;
