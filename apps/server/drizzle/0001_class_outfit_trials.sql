ALTER TABLE "characters" ADD COLUMN "class_id" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "outfit" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "trials" jsonb DEFAULT '[]'::jsonb NOT NULL;