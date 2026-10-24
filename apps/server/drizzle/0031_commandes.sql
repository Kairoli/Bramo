CREATE TABLE "artisan_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"artisan_id" integer NOT NULL,
	"kind" text NOT NULL,
	"target" text NOT NULL,
	"qty" integer NOT NULL,
	"price" integer NOT NULL,
	"materials" jsonb NOT NULL,
	"delay" text NOT NULL,
	"delay_hours" integer NOT NULL,
	"message" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"deadline" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"on_time" boolean,
	"client_settled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "orders_open" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "artisan_orders" ADD CONSTRAINT "artisan_orders_client_id_characters_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artisan_orders" ADD CONSTRAINT "artisan_orders_artisan_id_characters_id_fk" FOREIGN KEY ("artisan_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "artisan_orders_client" ON "artisan_orders" USING btree ("client_id","status");--> statement-breakpoint
CREATE INDEX "artisan_orders_artisan" ON "artisan_orders" USING btree ("artisan_id","status");