CREATE TABLE "clan_items" (
	"clan_id" integer NOT NULL,
	"item_id" text NOT NULL,
	"qty" integer NOT NULL,
	CONSTRAINT "clan_items_clan_id_item_id_pk" PRIMARY KEY("clan_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "clan_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"clan_id" integer NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clan_members" (
	"character_id" integer PRIMARY KEY NOT NULL,
	"clan_id" integer NOT NULL,
	"rank" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"fund" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clans_name_key_unique" UNIQUE("name_key")
);
--> statement-breakpoint
ALTER TABLE "clan_items" ADD CONSTRAINT "clan_items_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_log" ADD CONSTRAINT "clan_log_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_members" ADD CONSTRAINT "clan_members_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_members" ADD CONSTRAINT "clan_members_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clan_log_clan" ON "clan_log" USING btree ("clan_id","at");