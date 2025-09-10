import { pgTable,  uuid, text, timestamp, unique, pgEnum, pgPolicy, } from "drizzle-orm/pg-core";
import { users } from "./Users";
import { tags } from "./Tags";
import { students } from "./Students";
import { tagCanonicalValues } from "./TagCanonicalValues";
import { sql } from "drizzle-orm";

export const sourceEnum = pgEnum('source', ['manual', 'ai','import']);

export const studentTags = pgTable("student_tags", {
  studentTagId: uuid("student_tag_id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.studentId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  tagId: uuid("tag_id").references(() => tags.tagId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  value: text("value").notNull(),
  canonicalValueId: uuid("canonical_value_id").references(() => tagCanonicalValues.tagCanonicalValueId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  source: sourceEnum('source').notNull(),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
},
(table) => ({
    unique: unique().on(table.studentId, table.tagId, table.value),
    rlsSelect: pgPolicy('Allow Reading of Student Tags', {
      for: 'select',
      to: 'authenticated',
      using: sql`
        EXISTS (
          SELECT 1
          FROM user_school_memberships usm
          JOIN school_student_link ssl ON usm.school_id = ssl.school_id
          WHERE usm.user_id = auth.uid()
          AND ssl.student_id = ${table.studentId}
        )
      `,
    }),
     rlsInsert: pgPolicy('Allow Inserting Student Tags', {
       for: 'insert',
       to: 'authenticated',
       withCheck: sql`
         EXISTS (
           SELECT 1
           FROM user_school_memberships usm
           JOIN school_student_link ssl ON usm.school_id = ssl.school_id
           WHERE usm.user_id = auth.uid()
           AND ssl.student_id = ${table.studentId}
         )
       `,
     }),
    rlsUpdate: pgPolicy('Allow Updating Student Tags', {
      for: 'update',
      to: 'authenticated',
      using: sql`
        EXISTS (
          SELECT 1
          FROM user_school_memberships usm
          JOIN school_student_link ssl ON usm.school_id = ssl.school_id
          WHERE usm.user_id = auth.uid()
          AND ssl.student_id = ${table.studentId}
        )
      `,
    }),
    rlsDelete: pgPolicy('Allow Deleting Student Tags', {
      for: 'delete',
      to: 'authenticated',
      using: sql`
        EXISTS (
          SELECT 1
          FROM user_school_memberships usm
          JOIN school_student_link ssl ON usm.school_id = ssl.school_id
          WHERE usm.user_id = auth.uid()
          AND ssl.student_id = ${table.studentId}
        )
      `,
    }),
}));

export type StudentTag = typeof studentTags.$inferSelect;