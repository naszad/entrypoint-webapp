import { pgTable,  uuid, text, boolean, timestamp, unique, pgPolicy, } from "drizzle-orm/pg-core";
import { tagCategories } from "./TagCategories";
import { customers } from "./Customers";
import { users } from "./Users";
import { sql } from "drizzle-orm";

export const tags = pgTable("tags", {
  tagId: uuid("tag_id").primaryKey().defaultRandom(),
  tagCategoryId: uuid("tag_category_id").references(() => tagCategories.tagCategoryId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  customerId: uuid("customer_id").references(() => customers.customerId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  name: text("name").notNull(),
  isMultiValue: boolean("is_multi_value").notNull().default(false),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
},
(table) => ({
    unique: unique().on(table.tagCategoryId, table.customerId, table.name),
    rlsSelect: pgPolicy('Allow Reading of Tags', {
      for: 'select',
      to: 'authenticated',
      using: sql`
        EXISTS (
          SELECT 1
          FROM user_school_memberships usm
          JOIN schools s ON usm.school_id = s.school_id
          WHERE usm.user_id = auth.uid()
          AND s.customer_id = ${table.customerId}
        )
      `,
    }),
     rlsInsert: pgPolicy('Allow Inserting Tags', {
       for: 'insert',
       to: 'authenticated',
       withCheck: sql`
         EXISTS (
           SELECT 1
           FROM user_school_memberships usm
           JOIN schools s ON usm.school_id = s.school_id
           WHERE usm.user_id = auth.uid()
           AND s.customer_id = customer_id
         )
       `,
     }),
}));

export type Tag = typeof tags.$inferSelect;