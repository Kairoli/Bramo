ALTER TABLE "gear_items" ADD COLUMN "reroll_line" integer;--> statement-breakpoint
ALTER TABLE "gear_items" ADD COLUMN "rerolls" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "gear_items" ADD COLUMN "reroll_offer" jsonb;