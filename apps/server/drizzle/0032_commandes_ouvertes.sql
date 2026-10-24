ALTER TABLE "artisan_orders" ALTER COLUMN "artisan_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "artisan_orders" ADD COLUMN "scope" text DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "artisan_orders" ADD COLUMN "clan_id" integer;--> statement-breakpoint
ALTER TABLE "artisan_orders" ADD CONSTRAINT "artisan_orders_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE set null ON UPDATE no action;