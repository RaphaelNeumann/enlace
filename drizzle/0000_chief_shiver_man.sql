CREATE TYPE "public"."partners_order" AS ENUM('p1-p2', 'p2-p1');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('COUPLE', 'CEREMONIAL');--> statement-breakpoint
CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"partner1_name" text DEFAULT '' NOT NULL,
	"partner1_short_name" text DEFAULT '' NOT NULL,
	"partner2_name" text DEFAULT '' NOT NULL,
	"partner2_short_name" text DEFAULT '' NOT NULL,
	"partners_order" "partners_order" DEFAULT 'p1-p2' NOT NULL,
	"monogram_initials_override" text,
	"wedding_date" timestamp,
	"wedding_time_zone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"venue_short_name" text DEFAULT '' NOT NULL,
	"venue_address_for_maps" text,
	"site_title_pt" text DEFAULT '' NOT NULL,
	"site_title_en" text,
	"meta_description_pt" text DEFAULT '' NOT NULL,
	"meta_description_en" text,
	"og_image_storage_path" text,
	"hero_illustration_storage_path" text,
	"photo_gallery_as_subpage" boolean DEFAULT false NOT NULL,
	"show_hero" boolean DEFAULT true NOT NULL,
	"show_ceremony_reception" boolean DEFAULT true NOT NULL,
	"show_dress_code" boolean DEFAULT true NOT NULL,
	"show_story" boolean DEFAULT true NOT NULL,
	"show_gifts" boolean DEFAULT true NOT NULL,
	"show_tips" boolean DEFAULT true NOT NULL,
	"show_faq" boolean DEFAULT true NOT NULL,
	"show_photo_gallery" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton" CHECK ("site_settings"."id" = 'default')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"role" "user_role" DEFAULT 'CEREMONIAL' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationTokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationTokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;