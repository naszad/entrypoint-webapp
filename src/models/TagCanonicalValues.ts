import { pgTable,  uuid, text, timestamp, unique, pgPolicy, } from "drizzle-orm/pg-core";
import { users } from "./Users";
import { tags } from "./Tags";
import { sql } from "drizzle-orm";

export const tagCanonicalValues = pgTable("tag_canonical_values", {
  tagCanonicalValueId: uuid("tag_canonical_value_id").primaryKey().defaultRandom(),
  tagId: uuid("tag_id").references(() => tags.tagId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  value: text("value").notNull(),
  searchKeyWords: text("search_key_words"),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
},
(table) => ({
    unique: unique().on(table.tagId, table.value),
    rls: pgPolicy('Allow Reading of Tag Canonical Values', {
      for: 'select',
      to: 'authenticated',
      using: sql`
        EXISTS (
          SELECT 1
          FROM tags t
          JOIN user_school_memberships usm ON EXISTS (
            SELECT 1 FROM schools s 
            WHERE s.customer_id = t.customer_id 
            AND s.school_id = usm.school_id
          )
          WHERE t.tag_id = ${table.tagId}
          AND usm.user_id = auth.uid()
        )
      `,
    }),
}));