import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  pgEnum,
  pgPolicy
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './Users';
import { students } from './Students';

export const createdByEnum = pgEnum('created_by', ['agent', 'user']);

export const meetingNotes = pgTable(
  'meeting_notes',
  {
    meetingNoteId: uuid('meeting_note_id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.userId),
    studentId: uuid('student_id').notNull().references(() => students.studentId),
    updateLog: text('update_log'),
    private: boolean('private').notNull().default(false),
    transcript: text('transcript'),
    notes: text('notes'),
    summary: text('summary'),
    createdBy: createdByEnum('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  },
  (table) => [
    pgPolicy('Allow Access to Own Notes', {
      for: 'select',
      to: 'authenticated',
      using: sql`
        ${table.userId} = auth.uid()
      `,
    }),
    pgPolicy('Allow Access to Non-Private Notes for Students in User Schools', {
      for: 'select',
      to: 'authenticated',
      using: sql`
        ${table.private} = false
        AND EXISTS (
          SELECT 1
          FROM user_school_memberships AS usm
          JOIN school_student_link     AS ssl
            ON usm.school_id = ssl.school_id
          WHERE usm.user_id = auth.uid()
            AND ssl.student_id = ${table.studentId}
        )
      `,
    }),
  ]
);

export type MeetingNote = typeof meetingNotes.$inferSelect;