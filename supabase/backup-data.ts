import { exec } from 'child_process';
import path from 'path';
import dotenv from "dotenv";
import fs from "fs";

type Environment = 'local' | 'development' | 'production' | 'test';
const env = (process.env.NODE_ENV || 'local') as Environment;
const envFile = `.env.${env}`;

console.log('Using environment:', env);

dotenv.config({ path: envFile });


interface BackupOptions {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  schemas?: string[];
  outFile?: string;
}

/**
 * Backup a PostgreSQL database schemas into a custom-format dump.
 *
 * @param opts - Backup options
 * @returns Promise that resolves with the dump filename
 */
function backupDatabase({
  host = 'localhost',
  port = 54322,
  user = 'postgres',
  password = 'postgres',
  database = 'postgres',
  schemas = ['public', 'drizzle'],
  outFile = path.resolve(process.cwd(), 'drizzle_and_public.dump'),
}: BackupOptions = {}): Promise<string> {
  const schemaFlags = schemas.map((s) => `-n ${s}`).join(' ');

  const cmd = [
    'pg_dump',
    `-h ${host}`,
    `-p ${port}`,
    `-U ${user}`,
    `-d ${database}`,
    schemaFlags,
    '-F p',
    `-f "${outFile}"`,
  ].join(' ');

  return new Promise((resolve, reject) => {
    console.log('Running backup command:\n', cmd);

    exec(cmd, {
      env: { ...process.env, PGPASSWORD: password },
    }, (err, _stdout, stderr) => {
      if (err) {
        return reject(new Error(`Backup failed: ${stderr.trim()}`));
      }
      resolve(outFile);
    });
  });
}

(async () => {
  try {
    const databaseUrl = process.env.DATABASE_URL!;
    console.log('Using DATABASE_URL:', databaseUrl);
    const { hostname, port, username, password, pathname } = new URL(databaseUrl);

    const outFile = path.resolve(__dirname, 'backups', `drizzle_and_public.dump`);
    const backupDir = path.dirname(outFile);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`Created backup directory at: ${backupDir}`);
    }

    const dumpFile = await backupDatabase({
        host: hostname,
        port: Number(port),
        user: username,
        password: password,
        database: pathname.slice(1),
        schemas: ['public', 'drizzle'],
        outFile
    });
    console.log('Backup succeeded:', dumpFile);
  } catch (err) {
    console.error('Error occurred: ', (err as Error).message);
    process.exit(1);
  }
})();
