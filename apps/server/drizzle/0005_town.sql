CREATE TABLE "server_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"kind" text NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_firsts" (
	"item_id" text PRIMARY KEY NOT NULL,
	"character_name" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
