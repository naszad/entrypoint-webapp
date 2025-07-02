import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, integer, pgPolicy, timestamp } from 'drizzle-orm/pg-core';
import { customers } from '@/models/Customers';

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

  externalSource: text('external_source').notNull().default('Powerschool'),
  externalName: text('external_name'),
  externalId: text('external_id').notNull(),
  externalKey: text('external_key').notNull().unique(),
  externalKeyHash: text('external_key_hash').notNull().unique(),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  customerId: uuid('customer_id').references(() => customers.customerId, { onDelete: 'cascade', onUpdate: 'cascade' }),
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
