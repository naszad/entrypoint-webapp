CREATE TABLE "customers" (
	"customer_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_external_key_hash_unique" UNIQUE("external_key_hash");