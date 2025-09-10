import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

type Environment = 'local' | 'development' | 'production' | 'test';
const env = (process.env.NODE_ENV || 'local') as Environment;

let envFile = `.env.${env}`;
let ssl = true;

if(env === 'local') {
  ssl = false;
  envFile = `.env.local`;
}

console.log('Using environment:', env);

dotenv.config({ path: envFile });

export default defineConfig({
  schema: './src/models/**/*.ts',
  out: './migrations',
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
});