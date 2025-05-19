import { pgTable, uuid, varchar, integer, text } from "drizzle-orm/pg-core";

export const schools = pgTable("schools", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: varchar("school_id", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  schoolNumber: integer("school_number"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  principalName: varchar("principal_name", { length: 255 }),
  principalEmail: varchar("principal_email", { length: 255 }),
  assistantPrincipalName: varchar("assistant_principal_name", { length: 255 }),
  assistantPrincipalEmail: varchar("assistant_principal_email", { length: 255 }),
  externalSource: varchar("external_source", { length: 50 }),
  externalKey: varchar("external_key", { length: 50 }),
  externalId: varchar("external_id", { length: 50 }),
  externalName: varchar("external_name", { length: 255 }),
});


export type School = typeof schools.$inferSelect;