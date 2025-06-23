ALTER TABLE "schools" DROP CONSTRAINT "schools_customer_id_customers_customer_id_fk";
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "transaction_date" date;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE cascade ON UPDATE no action;