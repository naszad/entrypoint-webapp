import { Pool } from 'pg'

// Initialize a single Postgres connection pool using the DATABASE_URL from environment
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

/**
 * Executes a raw SQL query against the database and returns the result rows.
 * @param sqlQuery - The SQL query string to execute.
 * @returns An array of result rows.
 */
export async function querySql(sqlQuery: string): Promise<unknown[]> {
  const { rows } = await pool.query(sqlQuery)
  return rows
} 