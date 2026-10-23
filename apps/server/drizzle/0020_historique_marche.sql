CREATE TABLE "market_trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"qty" integer NOT NULL,
	"price" integer NOT NULL,
	"buyer_id" integer,
	"seller_id" integer,
	"at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "market_trades" ADD CONSTRAINT "market_trades_buyer_id_characters_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_trades" ADD CONSTRAINT "market_trades_seller_id_characters_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "market_trades_item" ON "market_trades" USING btree ("item_id","at");--> statement-breakpoint
CREATE INDEX "market_trades_buyer" ON "market_trades" USING btree ("buyer_id","at");--> statement-breakpoint
CREATE INDEX "market_trades_seller" ON "market_trades" USING btree ("seller_id","at");