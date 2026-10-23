CREATE TABLE "tide_signups" (
	"day" integer NOT NULL,
	"character_id" integer NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tide_signups_day_character_id_pk" PRIMARY KEY("day","character_id")
);
--> statement-breakpoint
ALTER TABLE "tide_signups" ADD CONSTRAINT "tide_signups_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;