
CREATE UNIQUE INDEX IF NOT EXISTS student_daily_absences_external_key_hash_idx
    ON public.student_daily_absences (external_key_hash);

