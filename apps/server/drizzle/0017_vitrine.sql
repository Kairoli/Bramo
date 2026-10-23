CREATE TABLE "gear_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"model_id" text NOT NULL,
	"gold" integer NOT NULL,
	"at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gear_items" ADD COLUMN "price" integer;--> statement-breakpoint
ALTER TABLE "gear_sales" ADD CONSTRAINT "gear_sales_seller_id_characters_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gear_sales_seller" ON "gear_sales" USING btree ("seller_id");