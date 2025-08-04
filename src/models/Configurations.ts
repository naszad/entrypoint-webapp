import { pgSchema, uuid, text, jsonb, boolean, timestamp, uniqueIndex, index, check } from "drizzle-orm/pg-core";
import { customers } from '@/models/Customers';
import { schools } from '@/models/Schools';
import { users } from '@/models/Users';
import { sql } from "drizzle-orm";

// Define the schema separately (optional)
export const configSchema = pgSchema("config");

// Define the table within that schema (if using schema)
export const configuration = configSchema.table("configuration", {
  configId: uuid("config_id").primaryKey().defaultRandom(),
  configKey: text("config_key").notNull(),
  value: jsonb("value").notNull(),
  isSecret: boolean("is_secret").default(false),
  customerId: uuid("customer_id").references(() => customers.customerId, { onDelete: "cascade" }),
  schoolId: uuid("school_id").references(() => schools.schoolId, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.userId, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  check("chk_single_scope", sql`
    (${t.customerId} IS NOT NULL)::int + 
    (${t.schoolId} IS NOT NULL)::int + 
    (${t.userId} IS NOT NULL)::int <= 1
  `),

  // Regular index for lookups
  index("idx_lookup").on(t.configKey, t.schoolId, t.customerId),
  
  // Unique constraints with WHERE clauses
  uniqueIndex("uniq_global_config").on(t.configKey).where(
    sql`${t.customerId} IS NULL AND ${t.schoolId} IS NULL AND ${t.userId} IS NULL`
  ),
  uniqueIndex("uniq_customer_config").on(t.configKey, t.customerId).where(
    sql`${t.customerId} IS NOT NULL AND ${t.schoolId} IS NULL AND ${t.userId} IS NULL`
  ),
  uniqueIndex("uniq_school_config").on(t.configKey, t.schoolId).where(
    sql`${t.schoolId} IS NOT NULL AND ${t.userId} IS NULL`
  ),
  uniqueIndex("uniq_user_config").on(t.configKey, t.userId).where(
    sql`${t.userId} IS NOT NULL`
  ),
]);