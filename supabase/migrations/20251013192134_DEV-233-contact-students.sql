-- ========================================
-- Contacts Table (Safe Creation)
-- ========================================
CREATE TABLE IF NOT EXISTS public.contacts (
    contact_id uuid NOT NULL DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL,
    first_name text,
    last_name text,
    gender text DEFAULT NULL,
    email_address text,
    phone_mobile text,
    phone_preferred text,
    external_source text NOT NULL DEFAULT 'Powerschool'::text,
    external_id text NOT NULL,
    external_key text NOT NULL,
    external_key_hash text NOT NULL,
    created_at timestamp without time zone default now(),
    updated_at timestamp without time zone default now(),
    source_updated_date timestamp without time zone DEFAULT NULL,  -- comes from PowerSchool
    CONSTRAINT contacts_pkey PRIMARY KEY (contact_id)
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Unique Indexes (Safe)
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'contacts_external_key_unique'
    ) THEN
        CREATE UNIQUE INDEX contacts_external_key_unique
        ON public.contacts (external_key);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'contacts_external_key_hash_unique'
    ) THEN
        CREATE UNIQUE INDEX contacts_external_key_hash_unique
        ON public.contacts (external_key_hash);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'contacts_pkey'
    ) THEN
        CREATE UNIQUE INDEX contacts_pkey
        ON public.contacts (contact_id);
    END IF;
END $$;

-- ========================================
-- Foreign Keys (Safe)
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'contacts_customer_id_customers_customer_id_fk'
    ) THEN
        ALTER TABLE public.contacts
        ADD CONSTRAINT contacts_customer_id_customers_customer_id_fk
        FOREIGN KEY (customer_id)
        REFERENCES public.customers(customer_id)
        NOT VALID;
        ALTER TABLE public.contacts VALIDATE CONSTRAINT contacts_customer_id_customers_customer_id_fk;
    END IF;
END $$;

-- ========================================
-- Student Contact Relationships Table
-- ========================================
CREATE TABLE IF NOT EXISTS public.student_contact_relationships (
    student_contact_relationship_id uuid NOT NULL DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL,
    student_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    school_id uuid NOT NULL,
    relation_to_student text DEFAULT NULL,
    created_at timestamp without time zone default now(),
    updated_at timestamp without time zone default now(),
    CONSTRAINT student_contact_relationships_pkey PRIMARY KEY (student_contact_relationship_id)
);

ALTER TABLE public.student_contact_relationships ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Unique Indexes (Safe)
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'student_contact_relationships_customer_id_student_id_contact_id_uniq'
    ) THEN
        CREATE UNIQUE INDEX student_contact_relationships_customer_id_student_id_contact_id_uniq
        ON public.student_contact_relationships (customer_id, student_id, contact_id);
    END IF;
END $$;

-- ========================================
-- Foreign Keys (Safe)
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'student_contact_relationships_customer_id_customers_customer_id_fk'
    ) THEN
        ALTER TABLE public.student_contact_relationships
        ADD CONSTRAINT student_contact_relationships_customer_id_customers_customer_id_fk
        FOREIGN KEY (customer_id)
        REFERENCES public.customers(customer_id)
        NOT VALID;
        ALTER TABLE public.student_contact_relationships VALIDATE CONSTRAINT student_contact_relationships_customer_id_customers_customer_id_fk;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'student_contact_relationships_student_id_students_student_id_fk'
    ) THEN
        ALTER TABLE public.student_contact_relationships
        ADD CONSTRAINT student_contact_relationships_student_id_students_student_id_fk
        FOREIGN KEY (student_id)
        REFERENCES public.students(student_id)
        NOT VALID;
        ALTER TABLE public.student_contact_relationships VALIDATE CONSTRAINT student_contact_relationships_student_id_students_student_id_fk;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'student_contact_relationships_contact_id_contacts_contact_id_fk'
    ) THEN
        ALTER TABLE public.student_contact_relationships
        ADD CONSTRAINT student_contact_relationships_contact_id_contacts_contact_id_fk
        FOREIGN KEY (contact_id)
        REFERENCES public.contacts(contact_id)
        NOT VALID;
        ALTER TABLE public.student_contact_relationships VALIDATE CONSTRAINT student_contact_relationships_contact_id_contacts_contact_id_fk;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'student_contact_relationships_school_id_schools_school_id_fk'
    ) THEN
        ALTER TABLE public.student_contact_relationships
        ADD CONSTRAINT student_contact_relationships_school_id_schools_school_id_fk
        FOREIGN KEY (school_id)
        REFERENCES public.schools(school_id)
        NOT VALID;
        ALTER TABLE public.student_contact_relationships VALIDATE CONSTRAINT student_contact_relationships_school_id_schools_school_id_fk;
    END IF;

END $$;

-- ========================================
-- A user can view a contact only if that contact is related to a student in one of the user’s schools.
-- NOTE: This script intentionally drops and recreates RLS policies for contacts and student_contact_relationships.
-- ========================================

drop policy if exists "Allow Access to Contacts in User Schools" on public.contacts;

CREATE POLICY "Allow Access to Contacts in User Schools"
ON public.contacts
AS permissive
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM student_contact_relationships scr
    JOIN user_school_memberships usm
      ON scr.school_id = usm.school_id
    WHERE
      scr.contact_id = contacts.contact_id
      AND usm.user_id = (SELECT auth.uid())
      AND (
        get_current_school_id() IS NULL
        OR scr.school_id = get_current_school_id()
      )
  )
);


drop policy if exists "Allow Access to Student Contact Relationships in User Schools"
on public.student_contact_relationships;

CREATE POLICY "Allow Access to Student Contact Relationships in User Schools"
ON public.student_contact_relationships
AS permissive
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_school_memberships usm
    WHERE
      usm.school_id = student_contact_relationships.school_id
      AND usm.user_id = (SELECT auth.uid())
      AND (
        get_current_school_id() IS NULL
        OR student_contact_relationships.school_id = get_current_school_id()
      )
  )
);
