CREATE TABLE "market_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"side" text NOT NULL,
	"item_id" text NOT NULL,
	"qty" integer NOT NULL,
	"price" integer NOT NULL,
	"wear" integer DEFAULT 0 NOT NULL,
	"collect_gold" integer DEFAULT 0 NOT NULL,
	"collect_qty" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "npc" jsonb DEFAULT '{"dayKey":"","done":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "market_orders" ADD CONSTRAINT "market_orders_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "market_orders_book" ON "market_orders" USING btree ("item_id","side","price");--> statement-breakpoint
CREATE INDEX "market_orders_owner" ON "market_orders" USING btree ("character_id");