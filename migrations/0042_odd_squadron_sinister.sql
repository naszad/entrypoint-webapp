CREATE SCHEMA "config";
--> statement-breakpoint
CREATE TABLE "config"."configuration" (
	"config_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_key" text NOT NULL,
	"value" jsonb NOT NULL,
	"is_secret" boolean DEFAULT false,
	"customer_id" uuid,
	"school_id" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "chk_single_scope" CHECK (
    ("config"."configuration"."customer_id" IS NOT NULL)::int + 
    ("config"."configuration"."school_id" IS NOT NULL)::int + 
    ("config"."configuration"."user_id" IS NOT NULL)::int <= 1
  )
);
--> statement-breakpoint
ALTER TABLE "config"."configuration" ADD CONSTRAINT "configuration_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config"."configuration" ADD CONSTRAINT "configuration_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config"."configuration" ADD CONSTRAINT "configuration_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lookup" ON "config"."configuration" USING btree ("config_key","school_id","customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_global_config" ON "config"."configuration" USING btree ("config_key") WHERE "config"."configuration"."customer_id" IS NULL AND "config"."configuration"."school_id" IS NULL AND "config"."configuration"."user_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_customer_config" ON "config"."configuration" USING btree ("config_key","customer_id") WHERE "config"."configuration"."customer_id" IS NOT NULL AND "config"."configuration"."school_id" IS NULL AND "config"."configuration"."user_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_school_config" ON "config"."configuration" USING btree ("config_key","school_id") WHERE "config"."configuration"."school_id" IS NOT NULL AND "config"."configuration"."user_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_config" ON "config"."configuration" USING btree ("config_key","user_id") WHERE "config"."configuration"."user_id" IS NOT NULL;