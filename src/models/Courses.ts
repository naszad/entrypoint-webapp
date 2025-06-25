// drizzle/schema/course.ts
import { pgTable, uuid, text, timestamp, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { schools } from './Schools';
import { customers } from './Customers';

export const courses = pgTable('courses', {
  courseId: uuid('course_id').default(sql`gen_random_uuid()`).primaryKey(),

  externalKey: text('external_key').notNull(),
  externalId: text('external_id').notNull(),
  externalKeyHash: text('external_key_hash').notNull().unique(),
  externalSource: text('external_source').notNull().default('Powerschool'),
  externalName: text('external_name'),

  schoolId: uuid('school_id').notNull().references(() => schools.schoolId, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').references(() => customers.customerId, { onDelete: 'cascade' }),
  

  name: text('name'),
  localCourseCode: text('local_course_code'),
  stateCourseCode: text('state_course_code'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  pgPolicy('Allow Reading of Courses', {
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
]);

export type COurse = typeof courses.$inferSelect;
