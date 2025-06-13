import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

type Environment = 'local' | 'development' | 'production' | 'test';
const env = (process.env.NODE_ENV || 'local') as Environment;
const envFile = `.env.${env}`;

console.log('Using environment:', env);

dotenv.config({ path: envFile });

const databaseUrl = process.env.DATABASE_URL!;
const { hostname, port, username, password, pathname } = new URL(databaseUrl);

export default defineConfig({
  schema: './src/models/**/*.ts',
  out: './migrations',
  dialect: "postgresql",
  dbCredentials: {
    host: hostname,
    port: Number(port),
    user: username,
    password: password,
    database: pathname.slice(1),
    ssl: 'require'
  },
});