import { pgTable, uuid, text, integer, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
export const schools = pgTable('schools', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: integer('school_id').notNull(),
  name: text('name').notNull(),
  schoolNumber: integer('school_number'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  address: text('address'),
  phone: text('phone'),
  principalName: text('principal_name'),
  principalEmail: text('principal_email'),
  assistantPrincipalName: text('assistant_principal_name'),
  assistantPrincipalEmail: text('assistant_principal_email'),
  externalSource: text('external_source'),
  externalKey: text('external_key'),
  externalId: text('external_id').notNull(),
  externalName: text('external_name'),
});

export type School = typeof schools.$inferSelect;