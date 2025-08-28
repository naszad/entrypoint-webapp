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

async function seedMeetingNotes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  const db = drizzle(client);

  const seedFile = 'meeting-notes.sql.off';
  const seedDir = path.join(__dirname, './seeds');
  const filePath = path.join(seedDir, seedFile);

  if (fs.existsSync(filePath)) {
    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`Running ${seedFile}...`);
    if (verbose) {
      console.log(`SQL for ${seedFile}:\n${sql}`);
    }
    await db.execute(sql);
  } else {
    console.log(`Seed file ${seedFile} not found.`);
  }

  await client.end();
  console.log('Meeting notes seeding executed.');
}

seedMeetingNotes().catch(console.error)

