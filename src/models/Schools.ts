import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, integer, pgPolicy } from 'drizzle-orm/pg-core';
export const schools = pgTable('schools', {
  schoolId: uuid('school_id').defaultRandom().primaryKey(),
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
  externalId: integer('external_id'),
  externalKeyHash: text('external_key_hash').notNull(),
  externalName: text('external_name'),
}, 
(table) => [
  pgPolicy('Allow Reading of Schools', {
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
]
);

export type School = typeof schools.$inferSelect;
