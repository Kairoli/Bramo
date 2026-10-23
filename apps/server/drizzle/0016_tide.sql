CREATE TABLE "tide_days" (
	"day" integer PRIMARY KEY NOT NULL,
	"tide" text NOT NULL,
	"participants" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"thresholds" integer DEFAULT 0 NOT NULL,
	"settled_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tide_entries" (
	"day" integer NOT NULL,
	"character_id" integer NOT NULL,
	"tide" text NOT NULL,
	"points" integer NOT NULL,
	"ratio" double precision NOT NULL,
	"channel" text NOT NULL,
	"live" boolean DEFAULT false NOT NULL,
	"shards" integer DEFAULT 0 NOT NULL,
	"claimed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tide_entries_day_character_id_pk" PRIMARY KEY("day","character_id")
);
--> statement-breakpoint
ALTER TABLE "tide_entries" ADD CONSTRAINT "tide_entries_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tide_entries_character" ON "tide_entries" USING btree ("character_id","claimed");