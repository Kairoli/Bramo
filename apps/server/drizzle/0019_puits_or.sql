CREATE TABLE "tide_patrons" (
	"day" integer NOT NULL,
	"slot" integer NOT NULL,
	"character_id" integer NOT NULL,
	"character_name" text NOT NULL,
	"gold" integer NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "tide_patrons_day_slot_pk" PRIMARY KEY("day","slot")
);
--> statement-breakpoint
ALTER TABLE "clans" ADD COLUMN "works_level" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "clans" ADD COLUMN "banquets" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "clans" ADD COLUMN "banquet_from" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "clans" ADD COLUMN "banquet_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "gear_items" ADD COLUMN "rank" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "gear_items" ADD COLUMN "hones" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tide_patrons" ADD CONSTRAINT "tide_patrons_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;