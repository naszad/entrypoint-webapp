import { pgTable, uuid, text, integer, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
export const schools = pgTable('schools', {
  id: uuid('id').defaultRandom().primaryKey(),
  school_id: integer('school_id').notNull(),
  name: text('name').notNull(),
  school_number: integer('school_number'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  address: text('address'),
  phone: text('phone'),
  principal_name: text('principal_name'),
  principal_email: text('principal_email'),
  assistant_principal_name: text('assistant_principal_name'),
  assistant_principal_email: text('assistant_principal_email'),
  external_source: text('external_source'),
  external_key: text('external_key'),
  external_id: text('external_id').notNull(),
  external_name: text('external_name'),
}, (table) => [
  pgPolicy('Allow Reading of school', {
    for: 'select',
    to: 'authenticated',
    using: sql`
      EXISTS (
        SELECT 1 FROM user_school_memberships usm
        WHERE usm.user_id = auth.uid()
        AND usm.school_id = ${table.external_id}
      )
    `,
  }),
]).enableRLS();

export type School = typeof schools.$inferSelect;