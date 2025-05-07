import { date, integer, pgTable, text, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';

export const students = pgTable('students', {
  studentId: uuid('student_id').primaryKey(),
  schoolId: integer('school_id').notNull(),
  firstName: text('first_name').notNull(),
  middleName: text('middle_name'),
  lastName: text('last_name').notNull(),
  email: varchar('email', { length: 256 }).notNull(),
  phone: varchar('phone', { length: 256 }),
  gradeLevel: integer('grade_level').notNull(),
  gender: varchar('gender', { length: 256 }).notNull(),
  dateOfBirth: date('date_of_birth').notNull(), 
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Student = typeof students.$inferSelect;