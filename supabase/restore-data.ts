import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import dotenv from "dotenv";

type Environment = 'local' | 'development' | 'production' | 'test';
const env = (process.env.NODE_ENV || 'local') as Environment;
const envFile = `.env.${env}`;

console.log('Using environment:', env);

dotenv.config({ path: envFile });

// Configuration
const databaseUrl = process.env.DATABASE_URL!;
const { hostname, port, username, password, pathname } = new URL(databaseUrl);
const RESTORE_DIR = path.resolve(__dirname, 'backups');
const PG_HOST = hostname;
const PG_PORT = Number(port);
const PG_USER = username;
const PG_DB = pathname.slice(1);
const PGPASSWORD = password;

console.log("")
// Utility: find latest or specific .dump
function findDumpToRestore(dir: string, filename?: string): string | null {
  if (filename) {
    const full = path.join(dir, filename);
    return fs.existsSync(full) ? filename : null;
  }

  const dumps = fs.readdirSync(dir)
    .filter(f => f.endsWith('.dump'))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(dir, f)).mtime.getTime()
    }));

  if (dumps.length === 0) return null;

  dumps.sort((a, b) => b.time - a.time);
  return dumps[0].name;
}

// Check if dump has any TABLE DATA
function checkDumpHasData(filePath: string, callback: (hasData: boolean) => void): void {
  const listCmd = `pg_restore -l "${filePath}"`;
  exec(listCmd, { env: { ...process.env, PGPASSWORD } }, (err, stdout, stderr) => {
    if (err || !stdout.trim()) {
      console.error('Dump file is unreadable or empty:\n', stderr);
      return callback(false);
    }
    const hasData = stdout.includes('TABLE DATA');
    callback(hasData);
  });
}

function runRestore(file: string): void {
  const fullPath = path.join(RESTORE_DIR, file);
  console.log(`Attempting to restore from: ${fullPath}`);

  // Detect format by checking if file is binary (custom format) or text (plain SQL)
  const isBinary = fs.readFileSync(fullPath, { encoding: 'utf8' }).includes('PGDMP') === false;

  const dropCmd = `psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DB} -c "DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE;"`;
  const restoreCmd = isBinary
    ? `psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DB} -f "${fullPath}"`
    : `pg_restore --no-comments --no-owner --no-privileges -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DB} "${fullPath}"`;

  exec(dropCmd, { env: { ...process.env, PGPASSWORD } }, (dropErr, _stdout, dropStderr) => {
    if (dropErr) {
      console.error('Error dropping schemas:\n', dropStderr);
      process.exit(1);
    }

    console.log('Schemas dropped and recreated.');

    exec(restoreCmd, { env: { ...process.env, PGPASSWORD } }, (restoreErr, _stdout, restoreStderr) => {
      if (restoreErr) {
        console.error('Restore failed:\n', restoreStderr);
        process.exit(1);
      }

      console.log('Restore completed successfully.');
    });
  });
}


// Entry point
const dumpFile = findDumpToRestore(RESTORE_DIR, process.argv[2]);

if (!dumpFile) {
  console.error('No valid .dump file found.');
  process.exit(1);
}

runRestore(dumpFile);
