CREATE TYPE "public"."gift_message_source" AS ENUM('gift_modal');--> statement-breakpoint
CREATE TYPE "public"."guest_source" AS ENUM('admin', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."programacao_card_id" AS ENUM('ceremony', 'reception');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('pending', 'confirmed', 'declined');--> statement-breakpoint
CREATE TABLE "dress_code" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"headline_pt" text DEFAULT '' NOT NULL,
	"headline_en" text,
	"intro_pt" text DEFAULT '' NOT NULL,
	"intro_en" text,
	"women_title_pt" text DEFAULT 'Mulheres' NOT NULL,
	"women_title_en" text,
	"women_body_pt" text DEFAULT '' NOT NULL,
	"women_body_en" text,
	"men_title_pt" text DEFAULT 'Homens' NOT NULL,
	"men_title_en" text,
	"men_body_pt" text DEFAULT '' NOT NULL,
	"men_body_en" text,
	"icon_key" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dress_code_singleton" CHECK ("dress_code"."id" = 'default')
);
--> statement-breakpoint
CREATE TABLE "faq_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_pt" text NOT NULL,
	"question_en" text,
	"answer_pt" text NOT NULL,
	"answer_en" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gift_id" uuid,
	"sender_name" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_pt" text NOT NULL,
	"title_en" text,
	"description_pt" text DEFAULT '' NOT NULL,
	"description_en" text,
	"photo_storage_path" text,
	"external_url" text,
	"suggested_amount_cents" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"plus_ones_allowed" integer DEFAULT 0 NOT NULL,
	"source" "guest_source" DEFAULT 'admin' NOT NULL,
	"rsvp_status" "rsvp_status" DEFAULT 'pending' NOT NULL,
	"rsvp_submitted_at" timestamp,
	"observation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_path" text NOT NULL,
	"caption_pt" text,
	"caption_en" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plus_ones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programacao_cards" (
	"id" "programacao_card_id" PRIMARY KEY NOT NULL,
	"title_pt" text DEFAULT '' NOT NULL,
	"title_en" text,
	"date" date,
	"time" text DEFAULT '' NOT NULL,
	"address_pt" text DEFAULT '' NOT NULL,
	"address_en" text,
	"maps_url" text,
	"icon_key" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_content" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"body_pt" text DEFAULT '' NOT NULL,
	"body_en" text,
	"photo1_storage_path" text,
	"photo2_storage_path" text,
	"photo3_storage_path" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_content_singleton" CHECK ("story_content"."id" = 'default')
);
--> statement-breakpoint
CREATE TABLE "tip_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_pt" text NOT NULL,
	"name_en" text,
	"icon_name" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"title_pt" text NOT NULL,
	"title_en" text,
	"body_pt" text NOT NULL,
	"body_en" text,
	"external_url" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gift_messages" ADD CONSTRAINT "gift_messages_gift_id_gifts_id_fk" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plus_ones" ADD CONSTRAINT "plus_ones_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_category_id_tip_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tip_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "faq_entries_position_idx" ON "faq_entries" USING btree ("position");--> statement-breakpoint
CREATE INDEX "guests_full_name_idx" ON "guests" USING btree ("first_name","last_name");--> statement-breakpoint
CREATE INDEX "guests_status_idx" ON "guests" USING btree ("rsvp_status");--> statement-breakpoint
CREATE INDEX "photos_position_idx" ON "photos" USING btree ("position");--> statement-breakpoint
CREATE INDEX "plus_ones_guest_idx" ON "plus_ones" USING btree ("guest_id","position");--> statement-breakpoint
CREATE INDEX "tip_categories_position_idx" ON "tip_categories" USING btree ("position");--> statement-breakpoint
CREATE INDEX "tips_category_position_idx" ON "tips" USING btree ("category_id","position");