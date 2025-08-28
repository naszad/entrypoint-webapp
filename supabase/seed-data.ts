import fs from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import dotenv from 'dotenv';

type Environment = 'local' | 'development' | 'production' | 'test';
const env = (process.env.NODE_ENV || 'local') as Environment;
let envFile = `.env.${env}`;
if(env === 'local') {
  envFile = `.env`;
} 

dotenv.config({ path: envFile })

const verbose = process.argv.includes('--verbose');

async function seedData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL, // Local Supabase DB URL
  });
  await client.connect();

  const db = drizzle(client);

  //Pick up all the SQL files in the seeds directory and run them.
  //Note: files are run in alphabetical order.
  const seedDir = path.join(__dirname, './seeds');
  const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.sql'));

  for (const file of files) {
    const sql = fs.readFileSync(path.join(seedDir, file), 'utf-8');
    console.log(`Running ${file}...`);
    if (verbose) {
      console.log(`SQL for ${file}:\n${sql}`);
    }
    await db.execute(sql);
  }

  await client.end();
  console.log('All seed files executed.');
}

seedData().catch(console.error)