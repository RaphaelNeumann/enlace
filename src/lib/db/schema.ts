import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  integer,
  boolean,
  pgEnum,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

export const userRoleEnum = pgEnum("user_role", ["COUPLE", "CEREMONIAL"]);
export const partnersOrderEnum = pgEnum("partners_order", ["p1-p2", "p2-p1"]);

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("CEREMONIAL"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/**
 * Single-row table holding global site content edited via /admin/site.
 * The id is constrained to "default" so only one row can ever exist.
 * See docs/features/site-shell.md, hero-countdown.md, location-map.md,
 * photo-gallery.md.
 */
export const siteSettings = pgTable(
  "site_settings",
  {
    id: text("id").primaryKey().default("default"),
    partner1Name: text("partner1_name").notNull().default(""),
    partner1ShortName: text("partner1_short_name").notNull().default(""),
    partner2Name: text("partner2_name").notNull().default(""),
    partner2ShortName: text("partner2_short_name").notNull().default(""),
    partnersOrder: partnersOrderEnum("partners_order").notNull().default("p1-p2"),
    monogramInitialsOverride: text("monogram_initials_override"),
    weddingDate: timestamp("wedding_date", { mode: "date" }),
    weddingTimeZone: text("wedding_time_zone").notNull().default("America/Sao_Paulo"),
    venueShortName: text("venue_short_name").notNull().default(""),
    venueAddressForMaps: text("venue_address_for_maps"),
    siteTitlePt: text("site_title_pt").notNull().default(""),
    siteTitleEn: text("site_title_en"),
    metaDescriptionPt: text("meta_description_pt").notNull().default(""),
    metaDescriptionEn: text("meta_description_en"),
    ogImageStoragePath: text("og_image_storage_path"),
    heroIllustrationStoragePath: text("hero_illustration_storage_path"),
    photoGalleryAsSubpage: boolean("photo_gallery_as_subpage").notNull().default(false),
    showHero: boolean("show_hero").notNull().default(true),
    showCeremonyReception: boolean("show_ceremony_reception").notNull().default(true),
    showDressCode: boolean("show_dress_code").notNull().default(true),
    showStory: boolean("show_story").notNull().default(true),
    showGifts: boolean("show_gifts").notNull().default(true),
    showTips: boolean("show_tips").notNull().default(true),
    showFaq: boolean("show_faq").notNull().default(true),
    showPhotoGallery: boolean("show_photo_gallery").notNull().default(true),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
  },
  (t) => [check("site_settings_singleton", sql`${t.id} = 'default'`)],
);
