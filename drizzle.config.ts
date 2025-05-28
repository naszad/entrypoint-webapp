import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL!;
const { hostname, port, username, password, pathname } = new URL(databaseUrl);

export default defineConfig({
  schema: './src/models/**/*.ts',
  out: './supabase/migrations',
  dialect: "postgresql",
  dbCredentials: {
    host: hostname,
    port: Number(port),
    user: username,
    password: password,
    database: pathname.slice(1),
    ssl: false
  },
});