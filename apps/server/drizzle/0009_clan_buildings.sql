CREATE TABLE "clan_buildings" (
	"clan_id" integer NOT NULL,
	"building_id" text NOT NULL,
	"level" integer NOT NULL,
	CONSTRAINT "clan_buildings_clan_id_building_id_pk" PRIMARY KEY("clan_id","building_id")
);
--> statement-breakpoint
CREATE TABLE "clan_progress" (
	"clan_id" integer NOT NULL,
	"building_id" text NOT NULL,
	"what" text NOT NULL,
	"qty" integer NOT NULL,
	CONSTRAINT "clan_progress_clan_id_building_id_what_pk" PRIMARY KEY("clan_id","building_id","what")
);
--> statement-breakpoint
ALTER TABLE "clan_buildings" ADD CONSTRAINT "clan_buildings_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_progress" ADD CONSTRAINT "clan_progress_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE cascade ON UPDATE no action;