CREATE TABLE "avatar_reports" (
	"character_id" integer NOT NULL,
	"reporter_id" integer NOT NULL,
	"version" integer NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "avatar_reports_character_id_reporter_id_version_pk" PRIMARY KEY("character_id","reporter_id","version")
);
--> statement-breakpoint
CREATE TABLE "character_avatars" (
	"character_id" integer PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"data" text NOT NULL,
	"version" integer NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "avatar" integer;--> statement-breakpoint
ALTER TABLE "avatar_reports" ADD CONSTRAINT "avatar_reports_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avatar_reports" ADD CONSTRAINT "avatar_reports_reporter_id_characters_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_avatars" ADD CONSTRAINT "character_avatars_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;