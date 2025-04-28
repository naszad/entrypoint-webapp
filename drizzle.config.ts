import type { Config } from 'drizzle-kit'

export default {
  schema: './src/models/**/*.ts',
  out: './supabase/migrations',
  driver: 'pglite',
  dialect: 'postgresql',
  verbose:true,
  strict: true,
} satisfies Config