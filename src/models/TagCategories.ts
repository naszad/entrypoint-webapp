import { pgTable,  uuid, text, } from "drizzle-orm/pg-core";

export const tagCategories = pgTable("tag_categories", {
  tagCategoryId: uuid("tag_category_id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
});

export type TagCategory = typeof tagCategories.$inferSelect;