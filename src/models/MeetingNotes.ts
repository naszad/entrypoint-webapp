import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './Users';
import { students } from './Students';

export const createdByEnum = pgEnum('created_by', ['agent', 'user']);

export const meetingNotes = pgTable('meeting_notes', {
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
});

export type MeetingNote = typeof meetingNotes.$inferSelect;