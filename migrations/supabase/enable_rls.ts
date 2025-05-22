import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL!;
const { hostname, port, username, password, pathname } = new URL(databaseUrl);

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyRLS() {
    const rlsSql = `
    ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow Reading of school" ON public.schools;

    CREATE POLICY "Allow Reading of school"
    ON public.schools
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_school_memberships usm
        WHERE usm.user_id = auth.uid()
        AND usm.school_id = schools.external_id
      )
    );

    -- Enable RLS on the students table
    ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow Reading of student" ON public.students;

    -- Create the policy
    CREATE POLICY "Allow Reading of student"
    ON public.students
    FOR SELECT
    TO authenticated
    USING (
    EXISTS (
        SELECT 1
        FROM user_school_memberships AS usm
        JOIN student_school_memberships AS ssl
        ON usm.school_id = ssl.external_school_id
        WHERE usm.user_id = auth.uid()
        AND ssl.external_student_id = students.external_id
    ));
    `;

    try {
        await client.connect();
        await client.query(rlsSql);
        console.log('RLS policy applied successfully');
    } catch (err) {
        console.error('Failed to apply RLS policy:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyRLS();
