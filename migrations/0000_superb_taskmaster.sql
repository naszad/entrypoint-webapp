CREATE TABLE "students" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"email" varchar(256) NOT NULL,
	"phone" varchar(256),
	"grade_level" integer NOT NULL,
	"gender" varchar(256) NOT NULL,
	"date_of_birth" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
