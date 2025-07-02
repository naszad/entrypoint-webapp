// drizzle/schema/course.ts
import { pgTable, uuid, text, timestamp, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { schools } from './Schools';
import { customers } from './Customers';

export const courses = pgTable('courses', {
  courseId: uuid('course_id').default(sql`gen_random_uuid()`).primaryKey(),

  externalSource: text('external_source').notNull().default('Powerschool'),
  externalName: text('external_name'),
  externalId: text('external_id').notNull(),
  externalKey: text('external_key').notNull().unique(),
  externalKeyHash: text('external_key_hash').notNull().unique(),

  schoolId: uuid('school_id').notNull().references(() => schools.schoolId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  
  name: text('name'),
  localCourseCode: text('local_course_code'),
  stateCourseCode: text('state_course_code'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  customerId: uuid('customer_id').references(() => customers.customerId, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (table) => [
  pgPolicy('Allow Reading of Courses', {
    for: 'select',
    to: 'authenticated',
    using: sql`
      EXISTS (
        SELECT 1
        FROM
          user_school_memberships usm
          CROSS JOIN LATERAL (SELECT public.get_current_school_id() as current_school_id) as app_context
        WHERE
          usm.user_id = auth.uid() AND
          usm.school_id = ${table.schoolId} AND
          (
            app_context.current_school_id IS NULL OR
            usm.school_id = app_context.current_school_id
          )
      )
    `,
  }),
]);

export type COurse = typeof courses.$inferSelect;
