CREATE TABLE "repair_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"item_id" text NOT NULL,
	"wear" integer NOT NULL,
	"fee" integer NOT NULL,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "prime" jsonb DEFAULT '{"dayKey":"","units":0}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD CONSTRAINT "repair_requests_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "repair_requests_open" ON "repair_requests" USING btree ("done_at");--> statement-breakpoint
CREATE INDEX "repair_requests_owner" ON "repair_requests" USING btree ("character_id");