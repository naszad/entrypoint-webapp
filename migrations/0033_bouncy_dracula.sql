CREATE TYPE "public"."created_by" AS ENUM('agent', 'user');--> statement-breakpoint
CREATE TABLE "meeting_notes" (
	"meeting_note_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"update_log" text,
	"private" boolean DEFAULT false NOT NULL,
	"transcript" text,
	"notes" text,
	"summary" text,
	"created_by" "created_by" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_student_id_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON DELETE no action ON UPDATE no action;