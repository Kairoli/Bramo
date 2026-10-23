CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" text NOT NULL,
	"character_id" integer,
	"name" text NOT NULL,
	"text" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_reports" (
	"message_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "chat_reports_message_id_character_id_pk" PRIMARY KEY("message_id","character_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "role" text DEFAULT 'player' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "muted_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_channel" ON "chat_messages" USING btree ("channel","id");