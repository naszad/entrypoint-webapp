import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  customerId: uuid('customer_id').defaultRandom().primaryKey(),
  name: text('name').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
