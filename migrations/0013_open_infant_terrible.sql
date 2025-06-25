/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'user_school_memberships'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

ALTER TABLE "user_school_memberships" DROP CONSTRAINT "user_school_memberships_pkey";
ALTER TABLE "user_school_memberships" ADD CONSTRAINT "user_school_memberships_user_id_school_id_pk" PRIMARY KEY("user_id","school_id");