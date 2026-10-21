CREATE TABLE "gear_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"model_id" text NOT NULL,
	"lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"masterpiece" boolean DEFAULT false NOT NULL,
	"signed_by" text,
	"wear" double precision DEFAULT 0 NOT NULL,
	"equipped" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gear_items" ADD CONSTRAINT "gear_items_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gear_items_character" ON "gear_items" USING btree ("character_id");