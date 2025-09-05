import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, pgPolicy, date, unique } from 'drizzle-orm/pg-core';
import { customers } from '@/models/Customers';
import { schools } from './Schools';
import { students } from './Students';
import { years } from './Years';

export const studentDailyAbsences = pgTable('student_daily_absences', {
  studentDailyAbsenceId: uuid('student_daily_absence_id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull().references(() => customers.customerId),
  schoolId: uuid('school_id').notNull().references(() => schools.schoolId),
  studentId: uuid('student_id').notNull().references(() => students.studentId),
  yearId: uuid('year_id').notNull().references(() => years.yearId),
  absenceDate: date('absence_date').notNull(),
  externalSource: text('external_source').notNull().default('Powerschool'),
  externalName: text('external_name'),
  externalId: text('external_id').notNull(),
  externalKey: text('external_key').notNull().unique(),
  externalKeyHash: text('external_key_hash').notNull().unique(),
  sisCode: text('sis_code'),
  normalizedAbsenceCode: text('normalized_absence_code'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
},
(table) => ({
  unique: unique().on(table.customerId, table.studentId, table.absenceDate),
  rls: pgPolicy('Allow Reading of Student Daily Absences', {
    for: 'select',
    to: 'authenticated',
    using: sql`
      EXISTS (
        SELECT 1 FROM user_school_memberships usm
        WHERE usm.user_id = auth.uid()
        AND usm.school_id = ${table.schoolId}
      )
    `,
  }),
}));

export type StudentDailyAbsences = typeof studentDailyAbsences.$inferSelect;
