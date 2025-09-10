import { sql } from "drizzle-orm";
import { pgTable,  uuid, text, pgPolicy, } from "drizzle-orm/pg-core";

export const tagCategories = pgTable("tag_categories", {
  tagCategoryId: uuid("tag_category_id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
},
() => ({
  rls: pgPolicy("Allow Reading of Tag Categories", {
    for: "select",
    to: "authenticated",
    using: sql`auth.uid() IS NOT NULL`,
  }),
}));

export type TagCategory = typeof tagCategories.$inferSelect;