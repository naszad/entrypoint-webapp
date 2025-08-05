import { pgTable,  uuid, text, timestamp, unique, pgEnum, } from "drizzle-orm/pg-core";
import { users } from "./Users";
import { tags } from "./Tags";
import { students } from "./Students";
import { tagCanonicalValues } from "./TagCanonicalValues";

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
}));

export type StudentTag = typeof studentTags.$inferSelect;