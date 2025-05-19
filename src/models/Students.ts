import { pgTable, uuid, varchar, integer, timestamp, date } from "drizzle-orm/pg-core";

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: integer("student_id").notNull(),
  schoolId: integer("school_id").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  gradeLevel: integer("grade_level").notNull(),
  gender: varchar("gender", { length: 20 }),
  dateOfBirth: date("date_of_birth"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  externalSource: varchar("external_source", { length: 50 }),
  externalKey: varchar("external_key", { length: 50 }),
  externalId: varchar("external_id", { length: 50 }),
  externalName: varchar("external_name", { length: 255 }),
});


export type Student = typeof students.$inferSelect;