ALTER TABLE "characters" ADD COLUMN "wear" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "pantry" jsonb DEFAULT '{}'::jsonb NOT NULL;