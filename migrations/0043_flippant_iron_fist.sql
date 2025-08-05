ALTER TABLE "years" ADD COLUMN "year_external_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "years" ADD CONSTRAINT "years_year_external_id_unique" UNIQUE("year_external_id");