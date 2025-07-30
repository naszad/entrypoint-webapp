import { pgTable,  uuid, text, timestamp, unique, } from "drizzle-orm/pg-core";
import { users } from "./Users";
import { tags } from "./Tags";

export const tagCanonicalValues = pgTable("tag_canonical_values", {
  tagCanonicalValueId: uuid("tag_canonical_value_id").primaryKey().defaultRandom(),
  tagId: uuid("tag_id").references(() => tags.tagId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  value: text("value").notNull(),
  searchKeyWords: text("search_key_words").notNull(),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
},
(table) => ({
    unique: unique().on(table.tagId, table.value),
}));