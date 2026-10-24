CREATE TABLE "blocks" (
	"blocker_id" integer NOT NULL,
	"blocked_id" integer NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "blocks_blocker_id_blocked_id_pk" PRIMARY KEY("blocker_id","blocked_id")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"requester_id" integer NOT NULL,
	"addressee_id" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "friendships_requester_id_addressee_id_pk" PRIMARY KEY("requester_id","addressee_id")
);
--> statement-breakpoint
CREATE TABLE "private_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_id" integer NOT NULL,
	"to_id" integer NOT NULL,
	"text" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"read_at" timestamp with time zone,
	"reported" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "dm_policy" text DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_characters_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_characters_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_characters_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_characters_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_from_id_characters_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_to_id_characters_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "friendships_addressee" ON "friendships" USING btree ("addressee_id");--> statement-breakpoint
CREATE INDEX "private_messages_to" ON "private_messages" USING btree ("to_id","id");--> statement-breakpoint
CREATE INDEX "private_messages_from" ON "private_messages" USING btree ("from_id","id");