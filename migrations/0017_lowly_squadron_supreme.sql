ALTER TABLE "student_grades" ALTER COLUMN "source_api" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_grades" DROP COLUMN "data_source_system";--> statement-breakpoint
ALTER TABLE "student_grades" DROP COLUMN "external_grade_id";--> statement-breakpoint
ALTER TABLE "student_grades" DROP COLUMN "last_syncronized_at";