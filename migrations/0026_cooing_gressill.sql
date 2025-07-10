ALTER TABLE "student_grades" RENAME COLUMN "grade_points" TO "gpa_points";--> statement-breakpoint
ALTER TABLE "student_grades" ADD COLUMN "potential_credit_hours" numeric;--> statement-breakpoint
ALTER TABLE "student_grades" ADD COLUMN "gpa_added_value" numeric;--> statement-breakpoint
ALTER TABLE "student_grades" ADD COLUMN "exclude_from_gpa" boolean;